import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

/**
 * Hook para acessar o contexto global da aplicação
 * Uso: const { profile, loadProfile } = useApp();
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de AppProvider");
  }
  return context;
}
