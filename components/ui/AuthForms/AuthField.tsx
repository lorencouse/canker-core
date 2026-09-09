import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Every auth form asks for the same two or three things, so they share one
 * field rather than each hand-rolling a label and a bare <input>.
 */
export default function AuthField({
  id,
  label,
  type,
  name,
  placeholder,
  autoComplete,
  hint
}: {
  id: string;
  label: string;
  type: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
