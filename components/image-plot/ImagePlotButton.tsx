import { Button } from '@/components/ui/button';

/**
 * A control that floats over the mouth map. It uses the translucent 'overlay'
 * variant so the diagram stays readable underneath.
 */
const ImagePlotButton = ({
  onClick,
  label,
  variant = 'overlay'
}: {
  onClick: () => void;
  label: string;
  variant?: 'overlay' | 'default' | 'destructive';
}) => (
  <Button type="button" onClick={onClick} variant={variant} size="xs">
    {label}
  </Button>
);

export default ImagePlotButton;
