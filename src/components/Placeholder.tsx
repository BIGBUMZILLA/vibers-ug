import type { LucideIcon } from "lucide-react";

export function Placeholder({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
