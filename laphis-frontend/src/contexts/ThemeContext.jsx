import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

const COLOR_THEMES = [
  { id: "orange", label: "Burnt Orange", color: "#D9751E" },
  { id: "blue", label: "Ocean Blue", color: "#0066CC" },
  { id: "forest", label: "Forest", color: "#2D8A4E" },
  { id: "purple", label: "Purple", color: "#7C3AED" },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("laphis-theme") || "light";
  });

  const [colorTheme, setColorTheme] = useState(() => {
    return localStorage.getItem("laphis-color") || "orange";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("laphis-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (colorTheme === "orange") {
      document.documentElement.removeAttribute("data-color");
    } else {
      document.documentElement.setAttribute("data-color", colorTheme);
    }
    localStorage.setItem("laphis-color", colorTheme);
  }, [colorTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colorTheme, setColorTheme, COLOR_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
