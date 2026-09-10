/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', md: '2rem' },
      screens: { '2xl': '1200px' }
    },
    extend: {
      fontFamily: {
        // Archivo for headings: a squarish grotesque with a signage feel,
        // which suits a product built around a map.
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        // Source Sans 3 for body and data: humanist, real tabular numerals.
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
      },
      fontSize: {
        display: ['clamp(2.5rem, 6vw, 3.75rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        title: ['clamp(1.75rem, 3.5vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
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
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
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
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        /*
         * Radius carries information here rather than being one house value.
         * A worksheet is the softest thing on screen because you handle it; a
         * data cell is the hardest because it is a measurement and should not
         * look tappable. Chips and toggles stay fully round.
         */
        worksheet: '0.875rem',
        cell: '2px'
      },
      keyframes: {
        /*
         * A reading arriving in a course. The app's only non-hover motion:
         * it answers a press of Save by showing the day that press recorded,
         * rather than announcing it in a toast alone. The reduced-motion
         * block in main.css turns it off.
         */
        commit: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        commit: 'commit 360ms cubic-bezier(0.34, 1.3, 0.64, 1)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
