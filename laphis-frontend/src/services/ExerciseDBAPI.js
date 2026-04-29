/**
 * ExerciseDB API Service — integração com RapidAPI ExerciseDB
 * Fornece GIFs animados de ~1300 exercícios
 * @module ExerciseDBAPI
 */

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || "exercisedb.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

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

    const variants = [
      exerciseName.trim().toLowerCase(),
      exerciseName.trim().toLowerCase().replace(/\s+/g, "-"),
      exerciseName.trim().toLowerCase().split(/\s+/)[0], // Primeira palavra
    ];

    // Remove duplicatas
    const uniqueVariants = [...new Set(variants)];

    for (const variant of uniqueVariants) {
      try {
        const results = await this.searchByName(variant);
        if (results && results.length > 0) {
          const exercise = results[0];
          return {
            gifUrl: exercise.gifUrl || null,
            id: exercise.id || null,
            name: exercise.name || exerciseName,
          };
        }
      } catch (err) {
        console.warn(`Variant search failed for "${variant}":`, err);
      }
    }

    // Fallback: nenhum resultado encontrado
    return { gifUrl: null, id: null, name: exerciseName };
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
