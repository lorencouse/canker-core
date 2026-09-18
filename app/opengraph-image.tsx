import { ImageResponse } from 'next/og';

/**
 * The default share card, inherited by every route that does not define its
 * own. It is generated rather than a checked-in PNG so the wording stays in
 * one place with the rest of the metadata.
 *
 * Drawn here rather than reusing MouthMapHero because satori supports only a
 * subset of CSS and none of the custom properties the ramp is built on — so
 * the severity colours are the resolved light-theme values, kept in sync with
 * styles/main.css by hand.
 */
export const alt =
  'Canker Core — track mouth sores and see whether they are healing';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SEVERITY = ['#e6b3b3', '#dd8c8c', '#d05f5f', '#c23434', '#a01f1f'];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#131a21',
          padding: '72px 80px',
          color: '#eff2f5'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              background: '#63bfc9'
            }}
          />
          <div style={{ fontSize: 30, letterSpacing: -0.5, color: '#9fb0bf' }}>
            Canker Core
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 82, lineHeight: 1.05, letterSpacing: -2 }}>
            Know whether it&rsquo;s healing.
          </div>
          <div style={{ fontSize: 34, color: '#9fb0bf', maxWidth: 900 }}>
            Mark where a mouth sore is, log its size and pain each day, and see
            whether it is actually shrinking.
          </div>
        </div>

        {/* The severity ramp, because it is the one thing in the product that
            reads instantly at thumbnail size. */}
        <div style={{ display: 'flex', gap: 12 }}>
          {SEVERITY.map((colour) => (
            <div
              key={colour}
              style={{
                width: 112,
                height: 14,
                borderRadius: 7,
                background: colour
              }}
            />
          ))}
        </div>
      </div>
    ),
    size
  );
}
