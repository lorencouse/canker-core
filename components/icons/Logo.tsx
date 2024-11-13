import Image from 'next/image';

const Logo = ({ ...props }) => (
  <Image src="/logo.png" alt="Logo" width={50} height={50} />
);

export default Logo;
