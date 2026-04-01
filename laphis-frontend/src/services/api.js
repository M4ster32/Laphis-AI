/**
 * API service — single entry-point for all backend communication.
 * Every public method delegates to `_request` so networking concerns
 * (auth headers, error parsing, 401 handling) live in one place.
 *
 * @module ApiService
 */

import { API_BASE_URL } from "../constants";

class ApiService {
  // ==================== BASE HELPERS ====================

  /**
   * Build default headers, optionally including the Bearer token.
   * @param {boolean} [includeAuth=true]
   * @returns {Object} Headers dictionary.
   */
  static getHeaders(includeAuth = true) {
    const headers = { "Content-Type": "application/json" };
    if (includeAuth) {
      const token = localStorage.getItem("authToken");
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Convenience getter — appends `?token=<jwt>` to a path.
   * Many legacy endpoints expect the token as a query param.
   * @param {string} path - API path starting with `/`.
   * @returns {string} Path with token query param.
   */
  static _withToken(path) {
    const token = localStorage.getItem("authToken");
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}token=${token}`;
  }

  /**
   * Central request dispatcher — eliminates repetitive try/catch blocks.
   *
   * @param {string} path      - API path (e.g. `/health`).
   * @param {Object} [opts]
   * @param {string} [opts.method='GET']   - HTTP method.
   * @param {Object} [opts.body]           - JSON-serialisable body.
   * @param {boolean}[opts.auth=true]      - Attach auth headers.
   * @param {*}      [opts.fallback]       - Return this on failure instead of throwing.
   * @param {string} [opts.errorMsg]       - Default user-facing error message.
   * @returns {Promise<*>} Parsed JSON response.
   */
  static async _request(path, { method = "GET", body, auth = true, fallback, errorMsg } = {}) {
    let response;
    try {
      const config = {
        method,
        headers: auth ? this.getHeaders() : { "Content-Type": "application/json" },
      };
      if (body) config.body = JSON.stringify(body);
      response = await fetch(`${API_BASE_URL}${path}`, config);
    } catch (_networkErr) {
      if (fallback !== undefined) return fallback;
      throw new Error("Sem ligação ao servidor.");
    }

    if (!response.ok) {
      /* Auto-clear stale auth tokens on 401 */
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userEmail");
      }
      if (fallback !== undefined) return fallback;
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || errorMsg || "Erro na operação");
    }

    return response.json();
  }

  // ==================== HEALTH ====================

  /**
   * Check API availability.
   * @returns {Promise<Object>}
   */
  static async health() {
    return this._request("/health", { auth: false, fallback: { status: "unreachable" } });
  }

  // ==================== PROFILE ====================

  /**
   * Fetch the authenticated user's profile.
   * Returns null instead of throwing when profile is missing or token is invalid.
   * @returns {Promise<Object|null>}
   */
  static async getMyProfile() {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    return this._request(this._withToken("/profile/me"), {
      fallback: null,
    });
  }

  /**
   * Fetch a profile by its ID.
   * @param {number|string} profileId
   * @returns {Promise<Object>}
   */
  static async getProfile(profileId) {
    return this._request(`/profile/${profileId}`, { errorMsg: "Erro ao obter perfil" });
  }

  /**
   * Create or update the current user's profile.
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  static async createProfile(profileData) {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Sessão expirada. Faz login novamente.");
    return this._request(this._withToken("/profile"), {
      method: "POST",
      body: profileData,
      errorMsg: "Erro ao criar perfil",
    });
  }

  /** Alias for createProfile (upsert semantics on the backend). */
  static async updateProfile(profileData) {
    return this.createProfile(profileData);
  }

  // ==================== AI CHAT ====================

  /**
   * Send a question to the AI coach.
   * @param {string} question
   * @param {number|null} profileId
   * @param {string|null} sessionId
   * @returns {Promise<Object>}
   */
  static async askAI(question, profileId = null, sessionId = null) {
    const body = { question, profile_id: profileId };
    if (sessionId) body.session_id = sessionId;
    return this._request("/ask", {
      method: "POST",
      body,
      errorMsg: "Erro ao obter resposta da IA",
    });
  }

  // ==================== LOGS ====================

  /**
   * Fetch activity logs (workouts + meals, unified).
   * @param {number} [limit=100]
   * @param {number} [offset=0]
   * @returns {Promise<Array>}
   */
  static async getLogs(limit = 100, offset = 0) {
    return this._request(
      this._withToken(`/logs`) + `&limit=${limit}&offset=${offset}`,
      { fallback: [] }
    );
  }

  /**
   * Create a new log entry (workout or meal).
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async createLog(data) {
    return this._request(this._withToken("/logs"), {
      method: "POST",
      body: data,
      errorMsg: "Erro ao guardar registo",
    });
  }

  /**
   * Delete a log entry.
   * @param {number|string} logId
   * @param {string} [logType='treino']
   * @returns {Promise<Object>}
   */
  static async deleteLog(logId, logType = "treino") {
    return this._request(
      this._withToken(`/logs/${logId}`) + `&log_type=${logType}`,
      { method: "DELETE", errorMsg: "Erro ao apagar registo" }
    );
  }

  // ==================== AUTH ====================

  /**
   * Register a new user account.
   * @param {string} email
   * @param {string} password
   * @param {string} goal
   * @returns {Promise<Object>}
   */
  static async register(email, password, goal) {
    return this._request("/auth/register", {
      method: "POST",
      auth: false,
      body: { email, password, goal },
      errorMsg: "Erro ao registar",
    });
  }

  /**
   * Authenticate an existing user.
   * @param {string} email
   * @param {string} [password='']
   * @returns {Promise<Object>}
   */
  static async login(email, password = "") {
    return this._request("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
      errorMsg: "Email ou senha incorretos",
    });
  }

  // ==================== EMAIL VERIFICATION ====================

  /**
   * Verify email with a 6-digit code.
   * @param {string} email
   * @param {string} code
   * @returns {Promise<Object>}
   */
  static async verifyEmail(email, code) {
    return this._request("/auth/verify-email", {
      method: "POST",
      auth: false,
      body: { email, code },
      errorMsg: "Erro ao verificar email",
    });
  }

  /**
   * Resend the email verification code.
   * @param {string} email
   * @returns {Promise<Object>}
   */
  static async resendVerificationCode(email) {
    return this._request("/auth/resend-code", {
      method: "POST",
      auth: false,
      body: { email },
      errorMsg: "Erro ao reenviar código",
    });
  }

  // ==================== PASSWORD RESET ====================

  /**
   * Request a password recovery code.
   * @param {string} email
   * @returns {Promise<Object>}
   */
  static async forgotPassword(email) {
    return this._request("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: { email },
      errorMsg: "Erro ao pedir recuperação",
    });
  }

  /**
   * Reset password using a recovery code.
   * @param {string} email
   * @param {string} code
   * @param {string} newPassword
   * @returns {Promise<Object>}
   */
  static async resetPassword(email, code, newPassword) {
    return this._request("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: { email, code, new_password: newPassword },
      errorMsg: "Erro ao redefinir password",
    });
  }

  /**
   * Log out the current user and clear local auth state.
   * Always resolves to `true` — never throws.
   * @returns {Promise<true>}
   */
  static async logout() {
    try {
      await this._request("/auth/logout", { method: "POST" });
    } catch {
      /* Ignore — we clear tokens regardless */
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    return true;
  }

  /**
   * Fetch the currently authenticated user.
   * @returns {Promise<Object>}
   */
  static async getCurrentUser() {
    return this._request("/auth/me", { errorMsg: "Erro ao obter utilizador" });
  }

  /**
   * Upload data for ingestion (multipart form).
   * Uses raw fetch because body is FormData, not JSON.
   * @param {FormData} formData
   * @returns {Promise<Object>}
   */
  static async ingestData(formData) {
    const response = await fetch(`${API_BASE_URL}/ingest`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Erro ao enviar dados");
    return response.json();
  }

  // ==================== PLANS ====================

  /**
   * Generate an AI-powered plan.
   * @param {number} profileId
   * @param {string} [type='combined']
   * @param {string|null} [notes]
   * @param {number|null} [categoryId]
   * @returns {Promise<Object>}
   */
  static async generatePlan(profileId, type = "combined", notes = null, categoryId = null) {
    return this._request("/plans/generate", {
      method: "POST",
      body: { profile_id: profileId, type, notes, category_id: categoryId },
      errorMsg: "Erro ao gerar plano",
    });
  }

  /**
   * Save a custom plan.
   * @param {Object} planData
   * @returns {Promise<Object>}
   */
  static async savePlan(planData) {
    return this._request("/plans/save", {
      method: "POST",
      body: planData,
      errorMsg: "Erro ao guardar plano",
    });
  }

  /**
   * List plans for a given profile.
   * @param {number} profileId
   * @param {string|null} [status]
   * @param {number|null} [categoryId]
   * @returns {Promise<Array>}
   */
  static async getPlans(profileId, status = null, categoryId = null) {
    let path = `/plans/list/${profileId}`;
    const params = [];
    if (status) params.push(`status=${status}`);
    if (categoryId) params.push(`category_id=${categoryId}`);
    if (params.length) path += `?${params.join("&")}`;
    return this._request(path, { errorMsg: "Erro ao obter planos" });
  }

  /**
   * Fetch detailed data for a single plan.
   * @param {number|string} planId
   * @returns {Promise<Object>}
   */
  static async getPlanDetail(planId) {
    return this._request(`/plans/detail/${planId}`, { errorMsg: "Erro ao obter plano" });
  }

  /**
   * Update plan metadata (title, notes, status, category).
   * @param {number|string} planId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  static async updatePlan(planId, updateData) {
    return this._request(`/plans/${planId}`, {
      method: "PUT",
      body: updateData,
      errorMsg: "Erro ao atualizar plano",
    });
  }

  /**
   * Duplicate an existing plan.
   * @param {number|string} planId
   * @returns {Promise<Object>}
   */
  static async duplicatePlan(planId) {
    return this._request(`/plans/${planId}/duplicate`, {
      method: "POST",
      errorMsg: "Erro ao duplicar plano",
    });
  }

  /**
   * Permanently delete a plan.
   * @param {number|string} planId
   * @returns {Promise<Object>}
   */
  static async deletePlan(planId) {
    return this._request(`/plans/${planId}`, {
      method: "DELETE",
      errorMsg: "Erro ao apagar plano",
    });
  }

  // ==================== CATEGORIES ====================

  /**
   * List the user's categories.
   * @returns {Promise<Array>}
   */
  static async getCategories() {
    return this._request(this._withToken("/categories"), { errorMsg: "Erro ao obter categorias" });
  }

  /**
   * Create a new category.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async createCategory(data) {
    return this._request(this._withToken("/categories"), {
      method: "POST",
      body: data,
      errorMsg: "Erro ao criar categoria",
    });
  }

  /**
   * Update an existing category.
   * @param {number|string} categoryId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async updateCategory(categoryId, data) {
    return this._request(this._withToken(`/categories/${categoryId}`), {
      method: "PUT",
      body: data,
      errorMsg: "Erro ao editar categoria",
    });
  }

  /**
   * Delete a category.
   * @param {number|string} categoryId
   * @returns {Promise<Object>}
   */
  static async deleteCategory(categoryId) {
    return this._request(this._withToken(`/categories/${categoryId}`), {
      method: "DELETE",
      errorMsg: "Erro ao apagar categoria",
    });
  }

  // ==================== CHAT HISTORY ====================

  /**
   * Fetch legacy paginated chat history.
   * @param {number} profileId
   * @param {number} [page=1]
   * @param {number} [perPage=50]
   * @returns {Promise<Object>}
   */
  static async getChatHistory(profileId, page = 1, perPage = 50) {
    return this._request(`/chat/${profileId}?page=${page}&per_page=${perPage}`, {
      fallback: { messages: [], total: 0, page: 1, per_page: perPage },
    });
  }

  // ==================== CHAT SESSIONS ====================

  /**
   * List all chat sessions for the current user.
   * @returns {Promise<Array>}
   */
  static async getChatSessions() {
    return this._request(this._withToken("/chat/sessions"), { fallback: [] });
  }

  /**
   * Create a new chat session.
   * @returns {Promise<Object>}
   */
  static async createChatSession() {
    return this._request(this._withToken("/chat/sessions"), {
      method: "POST",
      errorMsg: "Erro ao criar sessão",
    });
  }

  /**
   * Fetch a single chat session by ID.
   * @param {string} sessionId
   * @returns {Promise<Object|null>}
   */
  static async getChatSession(sessionId) {
    return this._request(this._withToken(`/chat/sessions/${sessionId}`), { fallback: null });
  }

  /**
   * Rename a chat session.
   * @param {string} sessionId
   * @param {string} title
   * @returns {Promise<Object>}
   */
  static async renameChatSession(sessionId, title) {
    return this._request(
      this._withToken(`/chat/sessions/${sessionId}/title`) + `&title=${encodeURIComponent(title)}`,
      { method: "PUT", errorMsg: "Erro ao renomear sessão" }
    );
  }

  /**
   * Delete a chat session.
   * @param {string} sessionId
   * @returns {Promise<Object>}
   */
  static async deleteChatSession(sessionId) {
    return this._request(this._withToken(`/chat/sessions/${sessionId}`), {
      method: "DELETE",
      errorMsg: "Erro ao apagar sessão",
    });
  }

  // ==================== ZEN SESSIONS ====================

  /**
   * List the user's zen (mindfulness) sessions.
   * @param {number} [limit=50]
   * @returns {Promise<Array>}
   */
  static async getZenSessions(limit = 50) {
    return this._request(this._withToken("/zen") + `&limit=${limit}`, { fallback: [] });
  }

  /**
   * Save a new zen session.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async saveZenSession(data) {
    return this._request(this._withToken("/zen"), {
      method: "POST",
      body: data,
      errorMsg: "Erro ao guardar sessão zen",
    });
  }

  /**
   * Delete a zen session.
   * @param {number|string} sessionId
   * @returns {Promise<Object>}
   */
  static async deleteZenSession(sessionId) {
    return this._request(this._withToken(`/zen/${sessionId}`), {
      method: "DELETE",
      errorMsg: "Erro ao apagar sessão zen",
    });
  }

  /**
   * Fetch aggregated zen statistics.
   * @returns {Promise<Object>}
   */
  static async getZenStats() {
    return this._request(this._withToken("/zen/stats"), { fallback: {} });
  }

  // ==================== REPORTS ====================

  /**
   * Fetch the full user report summary.
   * @returns {Promise<Object>}
   */
  static async getReportSummary() {
    return this._request(this._withToken("/reports/summary"), {
      errorMsg: "Erro ao obter relatório",
    });
  }

  /**
   * Fetch the AI-generated weekly summary.
   * @returns {Promise<Object|null>}
   */
  static async getWeeklySummary() {
    return this._request(this._withToken("/reports/weekly-summary"), { fallback: null });
  }

  /**
   * Force-refresh the weekly summary.
   * @returns {Promise<Object>}
   */
  static async refreshWeeklySummary() {
    return this._request(this._withToken("/reports/weekly-summary/refresh"), {
      method: "POST",
      errorMsg: "Erro ao atualizar resumo",
    });
  }

  // ==================== WATER TRACKING ====================

  /**
   * Fetch today's water intake data.
   * @returns {Promise<Object>}
   */
  static async getWaterToday() {
    return this._request(this._withToken("/water/today"), {
      fallback: { glasses: 0, ml_total: 0, goal_glasses: 8, percentage: 0 },
    });
  }

  /**
   * Add glasses of water.
   * @param {number} [glasses=1]
   * @returns {Promise<Object>}
   */
  static async addWater(glasses = 1) {
    return this._request(this._withToken("/water/add"), {
      method: "POST",
      body: { glasses },
      errorMsg: "Erro ao adicionar água",
    });
  }

  /**
   * Remove one glass of water.
   * @returns {Promise<Object>}
   */
  static async removeWater() {
    return this._request(this._withToken("/water/remove"), {
      method: "POST",
      errorMsg: "Erro ao remover água",
    });
  }

  /**
   * Fetch water intake history over the last N days.
   * @param {number} [days=7]
   * @returns {Promise<Array>}
   */
  static async getWaterHistory(days = 7) {
    return this._request(this._withToken("/water/history") + `&days=${days}`, { fallback: [] });
  }

  // ==================== WEIGHT TRACKING ====================

  /**
   * List weight log entries.
   * @param {number} [limit=60]
   * @returns {Promise<Array>}
   */
  static async getWeightEntries(limit = 60) {
    return this._request(this._withToken("/weight") + `&limit=${limit}`, { fallback: [] });
  }

  /**
   * Add a new weight entry.
   * @param {number} weightKg
   * @param {string|null} [notes]
   * @returns {Promise<Object>}
   */
  static async addWeightEntry(weightKg, notes = null) {
    return this._request(this._withToken("/weight"), {
      method: "POST",
      body: { weight_kg: weightKg, notes },
      errorMsg: "Erro ao registar peso",
    });
  }

  /**
   * Delete a weight entry.
   * @param {number|string} entryId
   * @returns {Promise<Object>}
   */
  static async deleteWeightEntry(entryId) {
    return this._request(this._withToken(`/weight/${entryId}`), {
      method: "DELETE",
      errorMsg: "Erro ao apagar registo",
    });
  }

  /**
   * Fetch aggregated weight statistics.
   * @returns {Promise<Object>}
   */
  static async getWeightStats() {
    return this._request(this._withToken("/weight/stats"), { fallback: {} });
  }

  // ==================== PROGRESS & ADAPTATION ====================

  /**
   * Create a progress snapshot (aggregates weekly metrics).
   * @returns {Promise<Object>}
   */
  static async createProgressSnapshot() {
    return this._request(this._withToken("/progress/snapshot"), {
      method: "POST",
      errorMsg: "Erro ao criar snapshot",
    });
  }

  /**
   * List progress snapshots.
   * @param {number} [limit=20]
   * @returns {Promise<Array>}
   */
  static async getProgressSnapshots(limit = 20) {
    return this._request(this._withToken("/progress/snapshots") + `&limit=${limit}`, {
      fallback: [],
    });
  }

  /**
   * Fetch progress insights (cross-snapshot comparison).
   * @returns {Promise<Object|null>}
   */
  static async getProgressInsights() {
    return this._request(this._withToken("/progress/insights"), { fallback: null });
  }

  /**
   * Submit user feedback about a plan.
   * @param {Object} feedbackData
   * @returns {Promise<Object>}
   */
  static async submitPlanFeedback(feedbackData) {
    return this._request(this._withToken("/adaptation/feedback"), {
      method: "POST",
      body: feedbackData,
      errorMsg: "Erro ao enviar feedback",
    });
  }

  /**
   * Fetch feedback for a specific plan.
   * @param {number|string} planId
   * @returns {Promise<Object|null>}
   */
  static async getPlanFeedback(planId) {
    return this._request(this._withToken(`/adaptation/feedback/${planId}`), { fallback: null });
  }

  /**
   * List adaptation suggestions (optionally filtered by status).
   * @param {string|null} [status]
   * @returns {Promise<Array>}
   */
  static async getAdaptationSuggestions(status = null) {
    let path = this._withToken("/adaptation/suggestions");
    if (status) path += `&status=${status}`;
    return this._request(path, { fallback: [] });
  }

  /**
   * Respond to an adaptation suggestion (accept/reject).
   * @param {number|string} suggestionId
   * @param {string} status
   * @param {string|null} [userResponse]
   * @returns {Promise<Object>}
   */
  static async respondToSuggestion(suggestionId, status, userResponse = null) {
    return this._request(this._withToken(`/adaptation/suggestions/${suggestionId}`), {
      method: "PUT",
      body: { status, user_response: userResponse },
      errorMsg: "Erro ao responder à sugestão",
    });
  }

  /**
   * Trigger a manual heuristic analysis.
   * @returns {Promise<Object>}
   */
  static async triggerAnalysis() {
    return this._request(this._withToken("/adaptation/analyze"), {
      method: "POST",
      errorMsg: "Erro na análise",
    });
  }
}

export default ApiService;
