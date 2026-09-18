/**
 * Style lab: draws the same subject under competing style contracts and tiles
 * the results into one labelled contact sheet, so a wording question gets
 * settled by looking rather than by arguing.
 *
 *   node tools/style-lab.mjs tools/style-lab/<experiment>.json
 *   node tools/style-lab.mjs <exp>.json --only flat,ref     # some variants
 *   node tools/style-lab.mjs <exp>.json --n 2               # 2 draws each
 *   node tools/style-lab.mjs <exp>.json --sheet-only        # retile, no spend
 *   node tools/style-lab.mjs <exp>.json --live              # draw synchronously, full price
 *   node tools/style-lab.mjs <exp>.json --collect           # pick up a batch this process left waiting
 *
 * An experiment file is:
 *
 *   {
 *     "name": "diagram-subject-dominance",
 *     "aspect": "16:9",
 *     "subjects": [{ "id": "escrow", "prompt": "..." }],
 *     "refs": ["data/style-lab/refs/mascot-sheet.jpeg"],
 *     "variants": [
 *       { "id": "current", "style": "...", "refs": [] },
 *       { "id": "bound",   "style": "...", "refs": "inherit" }
 *     ]
 *   }
 *
 * One cell per (subject, variant, draw). Cells are cached on disk by a hash
 * of everything that went into them, so re-running to retile costs nothing
 * and only edited variants get redrawn. Every billed call goes on
 * tools/.art-ledger.json, so the running spend stays one number.
 *
 * Needs GEMINI_API_KEY in .env.local (an AI Studio key with billing on; a
 * Gemini app subscription is not API access). Every call is billed, so
 * nothing here draws without Loren's go for that batch; --sheet-only prices
 * a plan and retiles cached cells for free.
 *
 * `refs` are the one lever text cannot pull: the image bytes go up alongside
 * the prompt, which is Gemini's answer to Midjourney's --sref. "inherit"
 * takes the experiment's list; a variant's own array overrides it; [] draws
 * from text alone, which is the control every experiment should carry.
 */
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER = join(ROOT, "tools/.art-ledger.json");
const OUT = process.env.ART_LAB_DIR || join(ROOT, "data/style-lab");
// Every drawn cell lands here, named by a hash of the prompt, the refs and
// the model. Sheets are assembled from it, so the same cell is never paid
// for twice however many experiments show it.
const CELLS = join(OUT, "_cells");

const MODEL = process.env.ART_IMAGE_MODEL || "gemini-3.1-flash-image";
const API = "https://generativelanguage.googleapis.com/v1";
const IMAGE_SIZE = process.env.ART_IMAGE_SIZE || "1K"; // 1K is plenty to judge style
// Google's price list (ai.google.dev/gemini-api/docs/pricing, read 2026-09-02):
// image output is $60 per 1M tokens, and a picture is 747 tokens at 0.5K,
// 1120 at 1K, 1680 at 2K, 2520 at 4K, so $0.045 / $0.067 / $0.101 / $0.151.
// Input (prompt plus two 768px refs) is about 1,900 tokens at $0.50 per 1M,
// a tenth of a cent. Override with ART_IMAGE_USD.
const USD_BY_SIZE = { "0.5K": 0.045, "1K": 0.067, "2K": 0.101, "4K": 0.151 };
const USD_PER_IMAGE = Number(process.env.ART_IMAGE_USD || USD_BY_SIZE[IMAGE_SIZE] || 0.101);
// The Batch API is the same model and the same weights at a flat 50% off, in
// exchange for waiting. Loren's standing instruction (2026-09-17) is that
// style work here never needs an instant answer, so batch is the DEFAULT and
// --live is the escape hatch, rather than the other way round.
const usdFor = (batch) => (batch ? USD_PER_IMAGE / 2 : USD_PER_IMAGE);

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  for (const name of [".env.local", ".env"]) {
    const envFile = join(ROOT, name);
    if (!existsSync(envFile)) continue;
    const line = readFileSync(envFile, "utf8")
      .split("\n")
      .find((l) => /^\s*GEMINI_API_KEY\s*=/.test(l));
    if (line) return line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback);

// Reference bytes ride along as inline JPEG. They are downsized first: the
// model reads style off a 768px thumbnail as well as off a 2752px master,
// and the big ones make the request slow enough to time out.
const refCache = new Map();
async function refPart(rel) {
  if (!refCache.has(rel)) {
    const buf = await sharp(join(ROOT, rel)).resize(768, 768, { fit: "inside" }).jpeg({ quality: 88 }).toBuffer();
    refCache.set(rel, { inlineData: { mimeType: "image/jpeg", data: buf.toString("base64") } });
  }
  return refCache.get(rel);
}

/** The request body for one cell, shared by the live call and the batch: two
 *  paths that send different bodies is two style contracts. */
async function requestFor(prompt, aspect, refs) {
  const parts = [];
  for (const r of refs) parts.push(await refPart(r));
  parts.push({ text: prompt });
  return {
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect, imageSize: IMAGE_SIZE } },
  };
}

/** A cell's name in the batch, and the filename it lands under: the same
 *  string, so a response finds its cell without an index into a lost list. */
const cellKey = (c) => basename(c.file).replace(/\.jpg$/, "");

async function generate(key, prompt, aspect, refs) {
  const body = await requestFor(prompt, aspect, refs);
  const res = await fetch(`${API}/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (res.status === 429 && /prepayment credits/i.test(text)) {
    throw new Error("out of AI Studio credits: top up at https://ai.studio/projects");
  }
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 300)}`);
  const json = JSON.parse(text);
  const image = (json.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  if (!image) {
    const why = json.candidates?.[0]?.finishReason || json.promptFeedback?.blockReason || "no image";
    throw new Error(`${why}: ${text.slice(0, 200)}`);
  }
  return Buffer.from(image.inlineData.data, "base64");
}

/*
 * The Batch API: half price for waiting, and the default here.
 *
 * Ported from house-finder's tools/gen-mkt-images.mjs, where every one of
 * these fallbacks and stream tricks was paid for once already. The comments
 * that say why a shape is defensive are kept, because the reasons still hold.
 *
 * The batch name is written to disk BEFORE anything is waited on: a batch can
 * take hours and this process can be killed, and --collect must be able to
 * pick it up rather than submit and pay for the same cells again. One state
 * file per batch, keyed by the batch id, so two batches at once cannot erase
 * each other's recovery record.
 */
const stateFor = (name) => join(OUT, `_batch-${String(name).split("/").pop()}.json`);
const resultFor = (name) => join(OUT, `_batch-${String(name).split("/").pop()}-result.json`);

function pendingBatches() {
  if (!existsSync(OUT)) return [];
  return readdirSync(OUT)
    .filter((f) => /^_batch-[A-Za-z0-9_-]+\.json$/.test(f) && !f.endsWith("-result.json"))
    .map((f) => join(OUT, f));
}

// batchGenerateContent is listed on the model for v1, but v1beta is where the
// documentation puts it and the 3.x models have moved between the two before
// (:generateContent still 404s on v1beta). Try ours, fall back.
async function batchPost(key, path, body) {
  let last;
  for (const base of [API, API.replace("/v1", "/v1beta")]) {
    const res = await fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    if (res.ok) return JSON.parse(text);
    last = `${res.status} ${text.slice(0, 300)}`;
    if (res.status !== 404) break;
  }
  throw new Error(last);
}

async function submitBatch(key, cells, aspect) {
  const requests = [];
  for (const c of cells) {
    requests.push({ request: await requestFor(c.prompt, aspect, c.refs), metadata: { key: cellKey(c) } });
  }
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  const job = await batchPost(key, `/models/${MODEL}:batchGenerateContent`, {
    batch: { display_name: `canker-${stamp}`, input_config: { requests: { requests } } },
  });
  if (!job.name) throw new Error(`batch created with no name: ${JSON.stringify(job).slice(0, 300)}`);
  return job.name;
}

// Polling asks for `done` alone through a field mask: a finished batch is the
// whole payload otherwise, which is megabytes per poll for one boolean. `done`
// is true for a batch that succeeded AND for one that failed; `error` tells
// them apart.
async function batchDone(key, name) {
  const job = await batchPost(key, `/${name}?fields=name,done,error`);
  return { done: !!job.done, error: job.error };
}

// The result is streamed to a file and scanned there, never read into one
// string: V8 caps a string at about 537MB and a large batch has gone past it.
// Asking for `response` alone also halves the download, because a finished
// batch carries the same rows twice (once as the operation's progress, once
// as its result).
async function fetchBatchToFile(key, name, dest) {
  let last;
  for (const base of [API, API.replace("/v1", "/v1beta")]) {
    const res = await fetch(`${base}/${name}?fields=response`, { headers: { "x-goog-api-key": key } });
    if (res.ok) {
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      return dest;
    }
    last = `${res.status} ${(await res.text()).slice(0, 300)}`;
    if (res.status !== 404) break;
  }
  throw new Error(last);
}

/** Find `"<field>"` followed by `:` and an opening quote, from `at`. */
function afterKey(buf, field, at) {
  const marker = Buffer.from(`"${field}"`);
  let i = buf.indexOf(marker, at);
  if (i === -1) return -1;
  i += marker.length;
  while (i < buf.length && (buf[i] === 0x20 || buf[i] === 0x0a || buf[i] === 0x0d || buf[i] === 0x09)) i += 1;
  if (buf[i] !== 0x3a) return -1;
  i += 1;
  while (i < buf.length && (buf[i] === 0x20 || buf[i] === 0x0a || buf[i] === 0x0d || buf[i] === 0x09)) i += 1;
  if (buf[i] !== 0x22) return -1;
  return i + 1;
}

/** Rows in file order as {key, b64}: one base64 blob at a time, each far
 *  under the string cap, followed by the metadata key we sent with it. */
async function* streamBatchRows(file) {
  const CHUNK = 8 * 1024 * 1024;
  const stream = createReadStream(file, { highWaterMark: CHUNK });
  let buf = Buffer.alloc(0);
  let pending = null;
  for await (const chunk of stream) {
    buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
    for (;;) {
      if (!pending) {
        // base64 has no escapes, so the blob ends at the next quote.
        const start = afterKey(buf, "data", 0);
        if (start === -1) break;
        const end = buf.indexOf(0x22, start);
        if (end === -1) break;
        pending = { b64: buf.toString("latin1", start, end) };
        buf = buf.subarray(end + 1);
        continue;
      }
      const kStart = afterKey(buf, "key", 0);
      if (kStart === -1) break;
      const kEnd = buf.indexOf(0x22, kStart);
      if (kEnd === -1) break;
      pending.key = buf.toString("utf8", kStart, kEnd);
      yield pending;
      pending = null;
      buf = buf.subarray(kEnd + 1);
    }
    // Keep only what a marker might still be straddling.
    if (!pending && buf.length > CHUNK * 2) buf = buf.subarray(buf.length - 4096);
  }
}

async function collectBatch(key, name, cells, ledger) {
  const byKey = new Map(cells.map((c) => [cellKey(c), c]));
  let waited = 0;
  const limit = Number(process.env.ART_BATCH_WAIT || 3600);
  const RESULT = resultFor(name);
  for (;;) {
    const { done, error } = await batchDone(key, name);
    if (done && error) throw new Error(`batch failed: ${JSON.stringify(error).slice(0, 300)}`);
    if (done) {
      process.stdout.write(`\r  downloading the result ...            `);
      await fetchBatchToFile(key, name, RESULT);
      console.log(`\r  result is ${Math.round(statSync(RESULT).size / 1e6)}MB, reading it off disk   `);
      let ok = 0;
      const seen = new Set();
      for await (const row of streamBatchRows(RESULT)) {
        if (seen.has(row.key)) continue; // one cell is written once even if listed twice
        seen.add(row.key);
        const cell = byKey.get(row.key);
        if (!cell) {
          console.log(`no cell for ${row.key}`);
          continue;
        }
        try {
          writeFileSync(cell.file, await sharp(Buffer.from(row.b64, "base64")).jpeg({ quality: 92 }).toBuffer());
          ledger.calls.push({ at: new Date().toISOString(), name: row.key, model: MODEL, size: IMAGE_SIZE, batch: true });
          ledger.images += 1;
          ledger.usd += usdFor(true);
          writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");
          console.log(`  ${basename(cell.file)} ok (batch)`);
          ok += 1;
        } catch (e) {
          console.log(`  ${basename(cell.file)} FAILED: ${e.message}`);
        }
      }
      const mine = stateFor(name);
      if (existsSync(mine)) renameSync(mine, `${mine}.done`);
      rmSync(RESULT, { force: true });
      console.log(`batch done: ${ok}/${cells.length} drawn, about $${(ok * usdFor(true)).toFixed(2)}`);
      if (seen.size < cells.length) console.log(`${cells.length - seen.size} response(s) carried no image; rerun to redraw them`);
      return;
    }
    if (waited >= limit) {
      console.log(`\nstill running after ${Math.round(waited / 60)}min. It is paid for and it keeps going.`);
      console.log(`collect it later with: node tools/style-lab.mjs <exp>.json --collect`);
      return;
    }
    // Slow the polling as it goes: a batch is minutes at best, hours at worst.
    const gap = waited < 60 ? 10 : waited < 600 ? 30 : 60;
    await new Promise((r) => setTimeout(r, gap * 1000));
    waited += gap;
    process.stdout.write(`\r  pending, ${Math.round(waited / 60)}min ...   `);
  }
}

async function runBatch(key, cells, aspect, ledger) {
  const name = await submitBatch(key, cells, aspect);
  mkdirSync(OUT, { recursive: true });
  // Written before the wait: a killed process comes back for this batch with
  // --collect instead of resubmitting the same cells. Billing is per output
  // token on requests that completed, not on acceptance.
  writeFileSync(
    stateFor(name),
    JSON.stringify({ name, at: new Date().toISOString(), aspect, cells: cells.map((c) => ({ file: c.file, key: cellKey(c) })) }, null, 2) + "\n",
  );
  console.log(`batch ${name} submitted, ${cells.length} cell(s). State is in ${stateFor(name).replace(ROOT + "/", "")}`);
  await collectBatch(key, name, cells, ledger);
}

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

// A caption bar under each cell. Without the variant name on the picture a
// contact sheet is unreadable the moment it leaves the terminal.
function caption(width, height, title, sub) {
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${width}" height="${height}" fill="#141c24"/>` +
      `<text x="14" y="${Math.round(height * 0.42)}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${Math.round(height * 0.34)}" fill="#eef2f6">${esc(title)}</text>` +
      `<text x="14" y="${Math.round(height * 0.82)}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(height * 0.28)}" fill="#5fb3b8">${esc(sub)}</text>` +
      `</svg>`,
  );
}

async function sheet(cells, dest, cellW) {
  const [aw, ah] = cells.aspect;
  const w = cellW;
  const h = Math.round((cellW * ah) / aw);
  const bar = Math.round(h * 0.13);
  const cols = Math.min(cells.items.length, cells.cols);
  const rows = Math.ceil(cells.items.length / cols);
  const comps = [];
  for (let i = 0; i < cells.items.length; i++) {
    const it = cells.items[i];
    const left = (i % cols) * w;
    const top = Math.floor(i / cols) * (h + bar);
    if (it.file && existsSync(it.file)) {
      comps.push({ input: await sharp(it.file).resize(w, h, { fit: "cover" }).png().toBuffer(), left, top });
    }
    comps.push({ input: caption(w, bar, it.title, it.sub), left, top: top + h });
  }
  await sharp({ create: { width: w * cols, height: (h + bar) * rows, channels: 3, background: "#2a333c" } })
    .composite(comps)
    .png()
    .toFile(dest);
  return dest;
}

async function main() {
  const args = process.argv.slice(2);
  const expPath = args.find((a) => !a.startsWith("--"));
  if (!expPath) throw new Error("usage: node tools/style-lab.mjs tools/style-lab/<experiment>.json");
  const flag = (name, dflt) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? dflt : args[i + 1];
  };
  const sheetOnly = args.includes("--sheet-only");
  const live = args.includes("--live");
  const collect = args.includes("--collect");
  const draws = Number(flag("n", 1));
  const cellW = Number(flag("cell", 520));
  const only = (flag("only", "") || "").split(",").filter(Boolean);

  const exp = readJson(join(ROOT, expPath), null) || readJson(expPath, null);
  if (!exp) throw new Error(`no experiment at ${expPath}`);
  const aspect = exp.aspect || "16:9";
  const [aw, ah] = aspect.split(":").map(Number);
  const dir = join(OUT, exp.name);
  mkdirSync(dir, { recursive: true });
  mkdirSync(CELLS, { recursive: true });

  const variants = exp.variants.filter((v) => !only.length || only.includes(v.id));
  const items = [];
  for (const subject of exp.subjects) {
    for (const v of variants) {
      for (let d = 0; d < draws; d++) {
        const refs = v.refs === "inherit" ? exp.refs || [] : v.refs || [];
        const prompt = (v.template || "{subject}\n\nStyle: {style}")
          .replace("{subject}", subject.prompt.trim())
          .replace("{style}", (v.style || "").trim());
        const key = createHash("sha1").update(JSON.stringify({ prompt, refs, aspect, MODEL, IMAGE_SIZE, d })).digest("hex").slice(0, 10);
        items.push({
          // Content-addressed and shared across experiments, not filed under
          // one: a control variant carried forward unchanged then costs
          // nothing the second time it appears.
          file: join(CELLS, `${subject.id}__${v.id}__${key}.jpg`),
          title: v.id,
          sub: `${subject.id}${refs.length ? ` · ${refs.length} ref` : " · text only"}${draws > 1 ? ` · #${d + 1}` : ""}`,
          prompt,
          refs,
        });
      }
    }
  }

  const todo = items.filter((i) => !existsSync(i.file));
  const unit = usdFor(!live);
  console.log(
    `${exp.name}: ${items.length} cell(s), ${todo.length} to draw ${live ? "live" : "through the Batch API"}, about $${(todo.length * unit).toFixed(2)}`,
  );

  // A batch this process stopped waiting on. Its cells are already paid for,
  // so this path never submits anything.
  if (collect) {
    const key = apiKey();
    if (!key) throw new Error("GEMINI_API_KEY not set (.env.local, .env, or the environment)");
    const ledger = readJson(LEDGER, { calls: [], images: 0, usd: 0 });
    const pending = pendingBatches();
    if (!pending.length) console.log("no batch waiting to be collected");
    for (const f of pending) {
      const st = readJson(f, null);
      if (!st?.name) continue;
      console.log(`collecting ${st.name} (submitted ${st.at})`);
      const byKey = new Map(items.map((i) => [cellKey(i), i]));
      // Fall back to the state file's own record for a cell this experiment
      // no longer lists, so an edited variant cannot strand a paid-for draw.
      const cells = st.cells.map((c) => byKey.get(c.key) || { file: c.file });
      await collectBatch(key, st.name, cells, ledger);
    }
  } else if (!sheetOnly && todo.length && !live) {
    const key = apiKey();
    if (!key) throw new Error("GEMINI_API_KEY not set (.env.local, .env, or the environment)");
    const ledger = readJson(LEDGER, { calls: [], images: 0, usd: 0 });
    await runBatch(key, todo, aspect, ledger);
    console.log(`spent to date: ${ledger.images} image(s), about $${ledger.usd.toFixed(2)}`);
  } else if (!sheetOnly && todo.length) {
    const key = apiKey();
    if (!key) throw new Error("GEMINI_API_KEY not set (.env.local, .env, or the environment)");
    const ledger = readJson(LEDGER, { calls: [], images: 0, usd: 0 });
    for (const it of todo) {
      process.stdout.write(`  ${basename(it.file)} ... `);
      try {
        const buf = await generate(key, it.prompt, aspect, it.refs);
        writeFileSync(it.file, await sharp(buf).jpeg({ quality: 92 }).toBuffer());
        ledger.calls.push({ at: new Date().toISOString(), name: `style-lab/${exp.name}/${basename(it.file)}`, model: MODEL, size: IMAGE_SIZE });
        ledger.images += 1;
        ledger.usd += usdFor(false);
        writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + "\n");
        console.log("ok");
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
      }
    }
    console.log(`spent to date: ${ledger.images} image(s), about $${ledger.usd.toFixed(2)}`);
  }

  const dest = join(dir, "_sheet.png");
  await sheet({ items, aspect: [aw, ah], cols: exp.cols || variants.length }, dest, cellW);
  console.log(dest);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
