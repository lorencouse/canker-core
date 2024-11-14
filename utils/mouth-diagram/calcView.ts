// import { useCankerSores } from "../context/CankerSoresContext";

const calcView = (x: number, y: number) => {
  const dimensions = 600;
  if (y < dimensions / 2) {
    if (x < dimensions * 0.33) {
      return 'Left Cheek';
    }
    if (x < dimensions * 0.66) {
      return 'Upper Mouth';
    }
    return 'Right Cheek';
  }
  if (x < dimensions * 0.33) {
    return 'Left Jaw';
  }
  if (x < dimensions * 0.66) {
    return 'Lower Mouth';
  }
  return 'Right Jaw';
};

export default calcView;
