export default function Separator({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px grow bg-border" />
      <span className="text-xs text-muted-foreground">{text}</span>
      <span className="h-px grow bg-border" />
    </div>
  );
}
