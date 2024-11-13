const ImagePlotButton = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="m-2 rounded-xl bg-foreground/70 px-4 py-2 text-background"
    >
      {label}
    </button>
  );
};

export default ImagePlotButton;
