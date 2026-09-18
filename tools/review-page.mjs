#!/usr/bin/env node
/**
 * A one-page contact sheet for a style-lab experiment:
 * data/style-lab/<experiment>/_review.html, opened in Chrome.
 *
 *   node tools/review-page.mjs tools/style-lab/mascot.json
 *   node tools/review-page.mjs tools/style-lab/mascot.json --only ink
 *   node tools/review-page.mjs --all          # every experiment that has cells
 *   node tools/review-page.mjs --all --serve  # and hold it open on 127.0.0.1:4123
 *
 * `_sheet.png` already tiles an experiment, and it is the right thing for
 * judging a style question at a glance, because the whole point is seeing
 * nine cells beside each other. It is the wrong thing for judging a drawing:
 * a 520px tile hides exactly the faults that matter here — a stray gradient,
 * an outline where the contract said none, a rose used as skin. This writes
 * each cell full width with the variant it came from and the prompt that
 * drew it, which is what "show him the pictures" has to mean before anything
 * is adopted as the house style.
 *
 * Ported from house-finder's tools/review-page.mjs, including its two scars:
 *
 * An empty page exits 1 rather than writing a valid file with nothing in it.
 * A cell list that comes back empty still exits 0 everywhere else, and a
 * blank review page reads as "nothing wrong with these" rather than as a bug.
 *
 * `--serve` exists because Chrome will not open a `file://` URL through the
 * extension, so a review page on disk cannot actually be reviewed. It holds a
 * read-only static server on 127.0.0.1 over the lab directory and nothing
 * else, until it is killed.
 *
 * `_review.txt` records the exact cells the page showed, one per line.
 * Anything downstream that acts on a review — adopting a variant, promoting a
 * draw — reads THAT file and never "whatever is sitting in the folder": a
 * second batch landing mid-review is how house-finder once shipped 36 frames
 * nobody had looked at. Approving a page approves what was on the page.
 */
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.ART_LAB_DIR || join(ROOT, "data/style-lab");
const CELLS = join(OUT, "_cells");
const MODEL = process.env.ART_IMAGE_MODEL || "gemini-3.1-flash-image";
const IMAGE_SIZE = process.env.ART_IMAGE_SIZE || "1K";

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : args[i + 1];
};
const only = (flag("only", "") || "").split(",").filter(Boolean);

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

/**
 * The cell filenames an experiment would produce, by the same hash the style
 * lab uses. Recomputed here rather than read off disk, so a cell drawn from
 * an EDITED prompt is not quietly shown as if it answered the current one.
 */
function cellsOf(exp) {
  const aspect = exp.aspect || "16:9";
  const variants = exp.variants.filter((v) => !only.length || only.includes(v.id));
  const cells = [];
  for (const subject of exp.subjects) {
    for (const v of variants) {
      const refs = v.refs === "inherit" ? exp.refs || [] : v.refs || [];
      const prompt = (v.template || "{subject}\n\nStyle: {style}")
        .replace("{subject}", subject.prompt.trim())
        .replace("{style}", (v.style || "").trim());
      // d is the draw index; --n 1 is the default and the only one tiled here.
      const key = createHash("sha1").update(JSON.stringify({ prompt, refs, aspect, MODEL, IMAGE_SIZE, d: 0 })).digest("hex").slice(0, 10);
      cells.push({
        id: `${subject.id}__${v.id}__${key}`,
        file: join(CELLS, `${subject.id}__${v.id}__${key}.jpg`),
        subject: subject.id,
        variant: v.id,
        refs,
        prompt,
        style: (v.style || "").trim(),
      });
    }
  }
  return cells;
}

const experiments = args.includes("--all")
  ? readdirSync(join(ROOT, "tools/style-lab")).filter((f) => f.endsWith(".json")).map((f) => join(ROOT, "tools/style-lab", f))
  : args.filter((a) => !a.startsWith("--") && a !== flag("only", null)).map((a) => (existsSync(a) ? a : join(ROOT, a)));

if (!experiments.length) {
  console.error("usage: node tools/review-page.mjs tools/style-lab/<experiment>.json [--only ink] [--all]");
  process.exit(1);
}

const sections = [];
const shown = [];
const missed = [];
for (const path of experiments) {
  const exp = readJson(path);
  const drawn = cellsOf(exp).filter((c) => {
    if (existsSync(c.file)) return true;
    missed.push(`${exp.name}/${c.subject}/${c.variant} (not drawn)`);
    return false;
  });
  if (!drawn.length) continue;
  const figures = drawn.map((c) => {
    shown.push(`${exp.name}\t${c.subject}\t${c.variant}\t${basename(c.file)}`);
    return `<figure id="${esc(c.id)}">
  <img src="${esc(relative(OUT, c.file))}" alt="${esc(c.subject)}, ${esc(c.variant)}" loading="lazy">
  <figcaption>
    <b>${esc(c.subject)} &middot; ${esc(c.variant)}</b>
    <span>${c.refs.length ? `${c.refs.length} reference frame(s)` : "text only"} &middot; ${esc(IMAGE_SIZE)} &middot; ${esc(MODEL)}</span>
    <details><summary>the prompt that drew it</summary><pre>${esc(c.prompt)}</pre></details>
  </figcaption>
</figure>`;
  });
  sections.push(`<section><h2>${esc(exp.name)} <em>${drawn.length} cell(s), ${esc(exp.aspect || "16:9")}</em></h2>
${figures.join("\n")}</section>`);
}

if (!sections.length) {
  for (const m of missed) console.log(`  skipped ${m}`);
  console.error("nothing to review: the page would be empty, so it was not written");
  process.exit(1);
}

// The page wears the product's own chrome, dark side: judging whether art
// belongs in this app is easier against the app's background than a white one.
const html = `<!doctype html><meta charset="utf-8"><title>Art review: ${shown.length} cell(s)</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --bg:#121921; --card:#1b232d; --ink:#eef2f6; --dim:#8fa0b0; --teal:#59b8c5; --line:#2a333c; }
  * { box-sizing: border-box; }
  body { margin:0; padding:2rem 1rem 6rem; background:var(--bg); color:var(--ink);
         font:15px/1.55 -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; }
  h1 { font-size:1.05rem; font-weight:600; max-width:1100px; margin:0 auto 2rem; color:var(--dim); }
  h1 b { color:var(--ink); }
  section { max-width:1100px; margin:0 auto 4rem; }
  h2 { font-size:1.3rem; margin:0 0 1.5rem; padding-bottom:.6rem; border-bottom:1px solid var(--line); }
  h2 em { float:right; font-style:normal; font-size:.8rem; color:var(--dim); font-weight:400; padding-top:.5rem; }
  figure { margin:0 0 3rem; }
  /* Checkerboard under the frame: the contract's grounds are near-white, and
     a near-white edge on a dark page is invisible without something behind it. */
  img { display:block; width:100%; height:auto; border-radius:12px; border:1px solid var(--line);
        background:#fff repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 50%/24px 24px; }
  figcaption { margin-top:.7rem; display:grid; gap:.25rem; }
  figcaption b { font-size:1rem; }
  figcaption span { color:var(--dim); font-size:.82rem; }
  details { margin-top:.4rem; }
  summary { color:var(--teal); font-size:.82rem; cursor:pointer; width:max-content; }
  pre { white-space:pre-wrap; background:var(--card); border:1px solid var(--line); border-radius:8px;
        padding:.9rem 1rem; margin:.6rem 0 0; font-size:.8rem; line-height:1.5; color:var(--dim); }
</style>
<h1><b>${shown.length} cell(s)</b> for review &mdash; nothing adopted. Judge against docs/ART-DIRECTION.md: no red anywhere, cool slate plus the one teal, rose is mouth tissue only, nothing gory, no text in the pixels.</h1>
${sections.join("\n")}
`;

mkdirSync(OUT, { recursive: true });
const dest = join(OUT, "_review.html");
writeFileSync(dest, html);
writeFileSync(join(OUT, "_review.txt"), shown.join("\n") + "\n");
for (const m of missed) console.log(`  skipped ${m}`);
console.log(`${shown.length} cell(s): ${dest}`);

if (args.includes("--serve")) {
  const port = Number(flag("port", 4123));
  const TYPES = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".txt": "text/plain; charset=utf-8" };
  createServer((req, res) => {
    // Read-only, GET only, and every path is resolved and then checked to be
    // inside the lab directory: a static server pointed at a repo is one
    // "../../.env" away from serving the API key it was drawn with.
    const rel = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "") || "_review.html";
    const file = join(OUT, rel);
    const inside = file === OUT || file.startsWith(OUT + "/");
    if (req.method !== "GET" || !inside || !existsSync(file) || !readdirSync(dirname(file)).includes(basename(file))) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[file.slice(file.lastIndexOf("."))] || "application/octet-stream" });
    res.end(readFileSync(file));
  }).listen(port, "127.0.0.1", () => console.log(`serving on http://127.0.0.1:${port}/_review.html — ctrl-c to stop`));
}
