import Image from 'next/image';

const Logo = ({ ...props }) => (
  <Image
    src="/images/canker-core-logo-110.png"
    alt="Logo"
    width={50}
    height={50}
  />
);

export default Logo;
