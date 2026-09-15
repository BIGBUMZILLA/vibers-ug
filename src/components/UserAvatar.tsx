import { SignedImage } from "@/components/SignedImage";

export function UserAvatar({
  name,
  avatar,
  size = 44,
  online,
}: {
  name: string;
  avatar?: string | null;
  size?: number;
  online?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {avatar ? (
        <SignedImage
          reference={avatar}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-accent font-display font-semibold text-accent-foreground"
          style={{ fontSize: size / 2.6 }}
        >
          {initials || "?"}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-online" />
      )}
    </div>
  );
}
