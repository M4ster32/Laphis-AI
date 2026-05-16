/**
 * Constantes globais do frontend
 */

// API URL: suporta production e development
// Em produção (Render/domínio real) usa o backend do Render.
// Em dev local (localhost ou IP privado) usa o mesmo host na porta 8000.
const _host = window.location.hostname;
const _isProd = _host === 'laphis-backend.onrender.com' || (!_host.match(/^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/));
export const API_BASE_URL = import.meta.env.VITE_API_URL
  || (_isProd ? 'https://laphis-backend.onrender.com' : `http://${_host}:8000`);

export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  LOGS: "/logs",
};

export const GOALS = {
  PERDER_GORDURA: "perder_gordura",
  GANHAR_MASSA: "ganhar_massa",
  MANTER: "manter",
};

export const LEVELS = {
  INICIANTE: "iniciante",
  INTERMEDIO: "intermedio",
  AVANCADO: "avancado",
};

export const SEX = {
  MASCULINO: "masculino",
  FEMININO: "feminino",
  OUTRO: "outro",
};

export const MEALS = {
  PEQUENO_ALMOCO: "pequeno_almoco",
  ALMOCO: "almoco",
  JANTAR: "jantar",
  SNACK: "snack",
};

// Mensagens
export const MESSAGES = {
  ERROR_LOAD_PROFILE: "Erro ao carregar perfil. Tenta novamente.",
  ERROR_SAVE_PROFILE: "Erro ao guardar perfil. Tenta novamente.",
  ERROR_CONNECT: "Não foi possível ligar ao servidor.",
  SUCCESS_SAVE: "Dados guardados com sucesso!",
};

// Validações
export const VALIDATION = {
  MIN_HEIGHT_CM: 120,
  MAX_HEIGHT_CM: 230,
  MIN_WEIGHT_KG: 35,
  MAX_WEIGHT_KG: 250,
  MIN_AGE: 12,
  MAX_AGE: 100,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 60,
};
