/**
 * The mark is the product in miniature: the mouth outline you plot on, with a
 * single sore marked inside it. The ring inherits currentColor so it themes,
 * while the dot stays on the severity ramp because it stands for data.
 */
const Logo = ({
  className,
  size = 32,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    role="img"
    aria-label="Canker Core"
    className={className}
    {...props}
  >
    <ellipse
      cx="16"
      cy="16"
      rx="10.5"
      ry="13"
      stroke="currentColor"
      strokeWidth="2"
      opacity="0.85"
    />
    <ellipse
      cx="16"
      cy="16"
      rx="5.5"
      ry="7.5"
      stroke="currentColor"
      strokeWidth="1.25"
      opacity="0.35"
    />
    <circle cx="20.5" cy="11.5" r="3" fill="hsl(var(--sev-8))" />
  </svg>
);

export default Logo;
