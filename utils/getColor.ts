export const getColor = (painLevel: number) => {
  const lightness = 100 - painLevel * 7;
  return `hsl(0, 100%, ${lightness}%)`;
};
