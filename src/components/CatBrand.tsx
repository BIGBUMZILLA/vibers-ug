import catMascot from "@/assets/viber-ug-cat.png";

export function CatBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`cat-badge flex shrink-0 items-center justify-center rounded-full bg-background cat-glow ${
        compact ? "h-11 w-11" : "h-40 w-40 sm:h-44 sm:w-44"
      }`}
    >
      <img
        src={catMascot}
        alt="Garry, the VIBER UG 256 cat"
        width={1024}
        height={1024}
        className={`cat-wiggle object-contain ${compact ? "h-9 w-9" : "h-32 w-32 sm:h-36 sm:w-36"}`}
      />
    </div>
  );
}