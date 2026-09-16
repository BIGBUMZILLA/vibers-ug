import catMascot from "@/assets/viber-ug-cat.png";

export function CatBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`cat-badge flex shrink-0 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 ${
        compact ? "h-11 w-11" : "h-32 w-32 sm:h-36 sm:w-36"
      }`}
    >
      <img
        src={catMascot}
        alt="VIBER UG orange cat"
        width={1024}
        height={1024}
        className={`cat-wiggle object-contain ${compact ? "h-9 w-9" : "h-24 w-24 sm:h-28 sm:w-28"}`}
      />
    </div>
  );
}