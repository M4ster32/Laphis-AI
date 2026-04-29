/**
 * ExerciseDB API Service — integração com RapidAPI ExerciseDB
 * Fornece GIFs animados de ~1300 exercícios
 * @module ExerciseDBAPI
 */

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || "exercisedb.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

/**
 * Mapeamento de termos portugueses → inglês para pesquisa na API
 * Inclui exercícios comuns gerados pela IA em português
 */
const PT_TO_EN = {
  // Bíceps / curls
  "rosca direta": "barbell curl",
  "rosca alternada": "dumbbell alternate bicep curl",
  "rosca concentrada": "concentration curl",
  "rosca martelo": "hammer curl",
  "rosca scott": "preacher curl",
  "rosca inversa": "reverse curl",
  "rosca 21": "barbell curl",

  // Tríceps
  "tríceps testa": "lying tricep extension",
  "triceps testa": "lying tricep extension",
  "extensão tríceps": "tricep extension",
  "extensao triceps": "tricep extension",
  "tríceps corda": "tricep rope pushdown",
  "triceps corda": "tricep rope pushdown",
  "tríceps polia": "tricep pushdown",
  "triceps polia": "tricep pushdown",
  "mergulho tríceps": "tricep dips",
  "mergulho triceps": "tricep dips",
  "fundos": "tricep dips",
  "dips": "tricep dips",
  "skull crusher": "lying tricep extension",

  // Peito
  "supino reto": "barbell bench press",
  "supino inclinado": "incline barbell bench press",
  "supino declinado": "decline barbell bench press",
  "supino halteres": "dumbbell bench press",
  "crucifixo": "dumbbell fly",
  "crucifixo inclinado": "incline dumbbell fly",
  "flexões": "push-up",
  "flexoes": "push-up",
  "push-up": "push-up",
  "peck deck": "pec deck",
  "chest fly": "cable fly",

  // Costas
  "remada curvada": "barbell row",
  "remada unilateral": "one arm dumbbell row",
  "remada baixa": "seated cable row",
  "remada alta": "upright row",
  "puxada frontal": "lat pulldown",
  "puxada": "lat pulldown",
  "lat pulldown": "lat pulldown",
  "barra fixa": "pull-up",
  "barra": "pull-up",
  "pull-up": "pull-up",
  "chin-up": "chin-up",
  "levantamento terra": "deadlift",
  "terra": "deadlift",
  "deadlift": "deadlift",
  "hiperextensão": "back extension",
  "hiperextensao": "back extension",

  // Ombros
  "desenvolvimento": "overhead press",
  "desenvolvimento militar": "military press",
  "press militar": "military press",
  "elevação lateral": "lateral raise",
  "elevacao lateral": "lateral raise",
  "elevação frontal": "front raise",
  "elevacao frontal": "front raise",
  "face pull": "face pull",
  "arnold press": "arnold press",
  "encolhimento": "shrug",

  // Pernas
  "agachamento": "squat",
  "agachamento livre": "barbell squat",
  "agachamento hack": "hack squat",
  "agachamento sumô": "sumo squat",
  "agachamento sumo": "sumo squat",
  "leg press": "leg press",
  "extensão de pernas": "leg extension",
  "extensao de pernas": "leg extension",
  "flexão de pernas": "leg curl",
  "flexao de pernas": "leg curl",
  "stiff": "romanian deadlift",
  "stiff leg deadlift": "romanian deadlift",
  "afundo": "lunge",
  "avanço": "lunge",
  "avanco": "lunge",
  "lunge": "lunge",
  "panturrilha": "calf raise",
  "elevação de panturrilha": "calf raise",
  "elevacao de panturrilha": "calf raise",
  "leg curl": "leg curl",
  "leg extension": "leg extension",
  "glúteo": "glute bridge",
  "gluteo": "glute bridge",
  "hip thrust": "hip thrust",
  "cadeira extensora": "leg extension",
  "mesa flexora": "leg curl",

  // Abdómen / Core
  "prancha": "plank",
  "plank": "plank",
  "abdominal": "crunch",
  "crunch": "crunch",
  "crunch bicicleta": "bicycle crunch",
  "elevação de pernas": "leg raise",
  "elevacao de pernas": "leg raise",
  "russian twist": "russian twist",
  "mountain climber": "mountain climber",
  "oblíquos": "oblique crunch",
  "obliquos": "oblique crunch",

  // Cardio
  "corrida": "running",
  "burpee": "burpee",
  "jumping jack": "jumping jacks",
  "polichinelos": "jumping jacks",
  "corda": "jump rope",
  "saltar à corda": "jump rope",
  "bicicleta": "stationary bike",
  "elíptica": "elliptical",
  "eliptica": "elliptical",
};

/**
 * Traduz um nome de exercício de português para inglês
 * @param {string} name
 * @returns {string}
 */
function translateToEnglish(name) {
  if (!name) return name;
  const lower = name.toLowerCase().trim();

  // Correspondência exata
  if (PT_TO_EN[lower]) return PT_TO_EN[lower];

  // Correspondência parcial (se o nome contém alguma das chaves)
  for (const [pt, en] of Object.entries(PT_TO_EN)) {
    if (lower.includes(pt)) return en;
  }

  // Sem tradução encontrada — devolve o original
  return name;
}

// Cache em memória para evitar requests duplicados (100/dia grátis!)
const _gifCache = new Map();

class ExerciseDBAPI {
  /**
   * Headers padrão para requisições RapidAPI
   * @returns {Object}
   */
  static getHeaders() {
    return {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
      "Content-Type": "application/json",
    };
  }

  /**
   * Fetch genérico com tratamento de erros
   * @param {string} path
   * @param {Object} [opts={}]
   * @returns {Promise<*>}
   */
  static async _request(path, opts = {}) {
    const { fallback } = opts;
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.warn(`ExerciseDB API error: ${response.status}`);
        return fallback || null;
      }

      return response.json();
    } catch (err) {
      console.error("ExerciseDB API error:", err);
      return fallback || null;
    }
  }

  /**
   * Procura exercício por nome (fuzzy match no servidor)
   * @param {string} name - ex: "push up", "agachamento", "supino"
   * @returns {Promise<Array>}
   */
  static async searchByName(name) {
    if (!name || typeof name !== "string") return [];
    const encoded = encodeURIComponent(name.trim().toLowerCase());
    return this._request(`/exercises/name/${encoded}`, { fallback: [] });
  }

  /**
   * Obtém todos os exercícios de um grupo muscular específico
   * @param {string} muscle - ex: "chest", "back", "legs", "glutes", etc
   * @returns {Promise<Array>}
   */
  static async getByMuscle(muscle) {
    if (!muscle) return [];
    const encoded = encodeURIComponent(muscle.toLowerCase());
    return this._request(`/exercises/muscle/${encoded}`, { fallback: [] });
  }

  /**
   * Obtém exercícios por equipamento
   * @param {string} equipment - ex: "barbell", "dumbbell", "machine", "cable", "body weight"
   * @returns {Promise<Array>}
   */
  static async getByEquipment(equipment) {
    if (!equipment) return [];
    const encoded = encodeURIComponent(equipment.toLowerCase());
    return this._request(`/exercises/equipment/${encoded}`, { fallback: [] });
  }

  /**
   * Obtém detalhes completos de um exercício por ID
   * @param {string} exerciseId - ID único do exercício (ex: "0001")
   * @returns {Promise<Object|null>}
   */
  static async getById(exerciseId) {
    if (!exerciseId) return null;
    const encoded = encodeURIComponent(exerciseId);
    return this._request(`/exercises/exercise/${encoded}`, { fallback: null });
  }

  /**
   * Procura o melhor GIF para um exercício pelo nome
   * Tenta vários nomes variantes se o primeiro não funcionar
   * @param {string} exerciseName - ex: "push up", "agachamento", "supino"
   * @returns {Promise<{gifUrl: string|null, id: string|null, name: string}>}
   */
  static async searchGifByName(exerciseName) {
    if (!exerciseName || typeof exerciseName !== "string") {
      return { gifUrl: null, id: null, name: exerciseName };
    }

    const original = exerciseName.trim().toLowerCase();

    // Verificar cache primeiro — poupa requests!
    if (_gifCache.has(original)) {
      return _gifCache.get(original);
    }
    const translated = translateToEnglish(original);

    // Tentativas: tradução EN → original PT → primeira palavra EN → primeira palavra PT
    const variants = [
      translated,
      ...(translated !== original ? [original] : []),
      translated.split(/\s+/)[0],
      original.split(/\s+/)[0],
    ];

    // Remove duplicatas e strings vazias
    const uniqueVariants = [...new Set(variants)].filter(Boolean);

    for (const variant of uniqueVariants) {
      try {
        const results = await this.searchByName(variant);
        if (results && results.length > 0) {
          const exercise = results[0];
          const result = {
            gifUrl: exercise.gifUrl || null,
            id: exercise.id || null,
            name: exercise.name || exerciseName,
          };
          _gifCache.set(original, result);
          return result;
        }
      } catch (err) {
        console.warn(`Variant search failed for "${variant}":`, err);
      }
    }

    // Fallback: nenhum resultado encontrado — guardar no cache também (evita retries)
    const empty = { gifUrl: null, id: null, name: exerciseName };
    _gifCache.set(original, empty);
    return empty;
  }

  /**
   * Testa se a API key está funcionando
   * @returns {Promise<boolean>}
   */
  static async testConnection() {
    try {
      const result = await this._request("/exercises/");
      return Array.isArray(result) && result.length > 0;
    } catch (err) {
      console.error("Connection test failed:", err);
      return false;
    }
  }
}

export default ExerciseDBAPI;
