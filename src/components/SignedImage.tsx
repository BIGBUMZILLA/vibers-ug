import { useEffect, useState } from "react";
import { signedUrl } from "@/lib/media";

export function SignedImage({
  reference,
  alt,
  className,
}: {
  reference: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    signedUrl(reference).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [reference]);

  if (!url) return <div className={`bg-muted ${className ?? ""}`} aria-hidden />;
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}
