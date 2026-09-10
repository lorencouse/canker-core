import { PropsWithChildren } from 'react';

/**
 * The first-run shell.
 *
 * Deliberately none of the app shell: no top bar and no tab bar, because
 * there is nowhere else to be yet and four tabs of empty screens is a poor
 * first impression. The flow owns the whole viewport and its own progress
 * indicator, which is the only navigation that makes sense here.
 *
 * Safe areas are applied here rather than in the flow, so the steps inside
 * can lay themselves out against a plain box.
 */
export default function OnboardingLayout({ children }: PropsWithChildren) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-background"
      style={{
        paddingTop: 'var(--safe-top)',
        paddingBottom: 'var(--safe-bottom)',
        paddingLeft: 'var(--safe-left)',
        paddingRight: 'var(--safe-right)'
      }}
    >
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
