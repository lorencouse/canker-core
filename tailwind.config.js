const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'selector',
  content: [
    'app/**/*.{ts,tsx,mdx}',
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    // The MDX element map lives at the repo root, so its classes — the list
    // markers and the table rules every article depends on — were never
    // generated until this line existed.
    'mdx-components.tsx'
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', md: '2rem' },
      screens: { '2xl': '1200px' }
    },
    extend: {
      fontFamily: {
        // Bricolage Grotesque for words and figures: a characterful display
        // face with heavy weights that make a streak number feel earned.
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        // Nunito for body and button labels: a rounded sans that matches
        // the rounded shapes, with tabular numerals for data.
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      fontSize: {
        display: [
          'clamp(2.5rem, 6vw, 3.75rem)',
          { lineHeight: '1.04', letterSpacing: '-0.03em' }
        ],
        title: [
          'clamp(1.75rem, 3.5vw, 2.5rem)',
          { lineHeight: '1.1', letterSpacing: '-0.02em' }
        ],
        // An app tab's large title (components/shell/LargeTitle.tsx), the
        // size iOS gives one: big enough to name the screen at a glance.
        'large-title': [
          '2.125rem',
          { lineHeight: '1.15', letterSpacing: '-0.02em' }
        ],
        section: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        subhead: ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }],
        /*
         * A headline figure. Almost every large glyph in this product is a
         * number, and the scale had nothing between a 1.125rem subhead and
         * a 1.5rem section heading — so the figures that are the point of
         * the Insights screen were competing with their own labels.
         */
        figure: ['1.75rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }]
      },
      colors: {
        border: 'hsl(var(--border))',
        // Ink-weight separation. See the --rule note in styles/main.css.
        rule: 'hsl(var(--rule))',
        // Sunflower win colour and its pressable edge; lavender for comfort.
        win: {
          DEFAULT: 'hsl(var(--win))',
          edge: 'hsl(var(--win-edge))',
          foreground: 'hsl(var(--win-foreground))'
        },
        streak: {
          DEFAULT: 'hsl(var(--streak))',
          foreground: 'hsl(var(--streak-foreground))',
          edge: 'hsl(var(--streak-edge))'
        },
        comfort: 'hsl(var(--comfort))',
        // The edge of a control. See --control in styles/main.css.
        control: 'hsl(var(--control))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          edge: 'hsl(var(--primary-edge))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        tile: {
          indigo: 'hsl(var(--tile-indigo))',
          amber: 'hsl(var(--tile-amber))',
          green: 'hsl(var(--tile-green))',
          slate: 'hsl(var(--tile-slate))'
        },
        // Pain level 1-10. Data only - never use these for chrome.
        severity: {
          1: 'hsl(var(--sev-1))',
          2: 'hsl(var(--sev-2))',
          3: 'hsl(var(--sev-3))',
          4: 'hsl(var(--sev-4))',
          5: 'hsl(var(--sev-5))',
          6: 'hsl(var(--sev-6))',
          7: 'hsl(var(--sev-7))',
          8: 'hsl(var(--sev-8))',
          9: 'hsl(var(--sev-9))',
          10: 'hsl(var(--sev-10))'
        }
      },
      boxShadow: {
        // Hard offsets in ink, kept for drawings; nothing on screen at rest uses them.
        drop: 'var(--drop)',
        'drop-sm': 'var(--drop-sm)',
        // The pressable edge: a solid deeper-colour ledge under a control.
        // Pressed, the control moves down and the edge goes (see button.tsx).
        press: '0 5px 0 hsl(var(--primary-edge))',
        'press-win': '0 5px 0 hsl(var(--win-edge))',
        'press-line': '0 4px 0 hsl(var(--border))',
        // Only on what floats over the page: a sheet, a menu.
        sheet: '0 -8px 32px hsl(240 48% 17% / 0.16)',
        menu: '0 12px 32px hsl(240 48% 17% / 0.22)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius)',
        sm: 'var(--radius)',
        /*
         * Radius carries information: a surface is rounder than the data
         * cell inside it, and a control (--radius, 16px) sits between. Chips
         * and day dots are rounded-full. The names stay so call sites say
         * what they mean.
         */
        worksheet: '1.25rem',
        cell: '0.75rem'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        // A bottom sheet rising from under the screen's edge.
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' }
        },
        'scrim-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        // A menu or a pose growing from where it was asked for.
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'sheet-in': 'sheet-in 0.42s var(--ease-sheet)',
        'scrim-in': 'scrim-in 0.24s ease-out',
        'pop-in': 'pop-in 0.18s var(--ease-spring)'
      }
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    // Size controls off the input device, not the viewport (docs/MOBILE.md):
    // `coarse:min-h-11` is a 44px tap target under a thumb only.
    plugin(({ addVariant }) =>
      addVariant('coarse', '@media (pointer: coarse)')
    ),
    // Where the app's tabs are (utils/nav-mode.ts): `rail:` while they stand
    // down the right edge, `navtop:` while they are links in the top bar.
    // Neither is a content breakpoint; content lays out by width alone.
    plugin(({ addVariant }) => {
      addVariant('rail', ':root[data-nav="rail"] &');
      addVariant('navtop', ':root[data-nav="top"] &');
      // A fold down the middle of the window (utils/fold.ts, THE FOLD in
      // styles/main.css).
      addVariant('fold', ':root[data-fold="columns"] &');
    })
  ]
};
