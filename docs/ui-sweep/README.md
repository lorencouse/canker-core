# UI formatting sweep, October 2026

Before/after captures for the "UI formatting rules" in `AGENTS.md`, taken at
320, 390 and 1280px across the marketing pages, today, map, insights and
settings with a seeded account. Full-page captures, downscaled to 320px wide.

| Screen | Found | Fix |
| --- | --- | --- |
| Insights, 320 and 390 | Page 439px wide: the Recharts chart sized the implicit grid track, so the bottom bar and "Settings" tab ran off screen | `grid-cols-1` on the chart/patterns grid |
| Insights, sore list | "Healed 10/3/2026" wrapped onto a second line inside the row button | `block truncate` |
| Today, chips | Trigger and treatment chips could wrap and were 40px tall on touch | `whitespace-nowrap`, `coarse:h-11` |
| Settings, section chips | 40px tall on touch | `coarse:h-11` |
| Compact buttons and switch | 32–40px hit areas on touch | `.tap-target` on `sm`, `xs`, `icon`, `default` sizes and the switch |

Left as is, because fixing them is a layout change rather than a formatting
one: the 1–10 pain ladder (23–30px wide per step at 320–390px) and the sore
markers on the mouth map (20–25px).
