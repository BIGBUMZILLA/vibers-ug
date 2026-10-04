import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type Theme = "light" | "dark";
const ThemeContext = createContext({ theme: "dark" as Theme, toggle: () => {}, doodles: true, toggleDoodles: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [doodles, setDoodles] = useState(true);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("viber-ug-theme");
    setTheme(stored === "light" ? "light" : "dark");
    setDoodles(localStorage.getItem("viber-ug-doodles") !== "off");
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("doodles-off", !doodles);
    localStorage.setItem("viber-ug-theme", theme);
    localStorage.setItem("viber-ug-doodles", doodles ? "on" : "off");
  }, [theme, doodles, ready]);
  return <ThemeContext.Provider value={{theme, toggle: () => setTheme(t => t === "dark" ? "light" : "dark"), doodles, toggleDoodles: () => setDoodles(d => !d)}}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
