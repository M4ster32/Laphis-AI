/**
 * Funções utilitárias para o frontend
 */

/**
 * Formatar data para português
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("pt-PT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Formatar hora
 */
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Validar email
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Limpar valor numérico
 */
export const cleanNumber = (value) => {
  return value ? parseFloat(value).toFixed(2) : "0.00";
};

/**
 * Calcular IMC
 */
export const calculateBMI = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(2);
};

/**
 * Classificar IMC
 */
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return "Baixo peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidade";
};

/**
 * Formatar bytes para unidade legível
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};
