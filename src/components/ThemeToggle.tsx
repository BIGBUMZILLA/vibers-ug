import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ onPrimary = false }: { onPrimary?: boolean }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Use ${next} mode`}
      title={`Use ${next} mode`}
      className={onPrimary ? "text-primary-foreground hover:bg-primary-foreground/15" : undefined}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}