/**
 * Serviço de comunicação com a API do backend
 * Centraliza todas as chamadas HTTP para a API FastAPI
 */

import { API_BASE_URL } from "../constants";

class ApiService {
  /**
   * Obter headers com token de autenticação
   */
  static getHeaders(includeAuth = true) {
    const headers = { "Content-Type": "application/json" };
    if (includeAuth) {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return headers;
  }

  /**
   * Verificar status da API
   */
  static async health() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      throw error;
    }
  }

  /**
   * Obter perfil do utilizador autenticado
   */
  static async getMyProfile() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    let response;
    try {
      response = await fetch(`${API_BASE_URL}/profile/me?token=${token}`, {
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      console.error("Network error fetching profile:", networkErr);
      return null;
    }
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        return null;
      }
      if (response.status === 404) return null;
      return null;
    }
    return await response.json();
  }

  /**
   * Obter perfil do utilizador (por ID)
   */
  static async getProfile(profileId) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/profile/${profileId}`, {
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao obter perfil");
    return await response.json();
  }

  /**
   * Criar ou atualizar perfil
   */
  static async createProfile(profileData) {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error("Sessão expirada. Faz login novamente.");

    let response;
    try {
      response = await fetch(`${API_BASE_URL}/profile?token=${token}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(profileData),
      });
    } catch (networkErr) {
      console.error("Network error creating profile:", networkErr);
      throw new Error("Sem ligação ao servidor. Tenta novamente.");
    }

    const responseData = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        throw new Error("Sessão inválida. Faz login novamente.");
      }
      throw new Error(responseData?.detail || "Erro ao criar perfil");
    }
    return responseData;
  }

  /**
   * Criar ou atualizar perfil (alias)
   */
  static async updateProfile(profileData) {
    return this.createProfile(profileData);
  }

  /**
   * Fazer pergunta à IA
   */
  static async askAI(question, profileId = null) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ question, profile_id: profileId }),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor. Verifica que o backend está a correr.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || "Erro ao obter resposta da IA");
    }
    return await response.json();
  }

  /**
   * Obter histórico de atividades (treinos + refeições unificados)
   */
  static async getLogs(limit = 100, offset = 0) {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(
        `${API_BASE_URL}/logs?token=${token}&limit=${limit}&offset=${offset}`,
        { headers: this.getHeaders() }
      );
      if (!response.ok) {
        if (response.status === 404) return []; // Perfil não criado
        throw new Error("Failed to fetch logs");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
  }

  /**
   * Criar novo registo (treino ou refeição)
   */
  static async createLog(data) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/logs?token=${token}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const resp = await response.json().catch(() => ({}));
      throw new Error(resp.detail || "Erro ao guardar registo");
    }
    return await response.json();
  }

  /**
   * Apagar registo (treino ou refeição)
   */
  static async deleteLog(logId, logType = "treino") {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/logs/${logId}?token=${token}&log_type=${logType}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao apagar registo");
    return await response.json();
  }

  /**
   * Registrar novo utilizador
   */
  static async register(email, password, goal) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, goal }),
      });
    } catch (networkErr) {
      console.error("Register network error:", networkErr, "URL:", API_BASE_URL);
      throw new Error("Sem ligação ao servidor. Tenta novamente.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao registar");
    }
    return await response.json();
  }

  /**
   * Fazer login
   */
  static async login(email, password = "") {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (networkErr) {
      console.error("Login network error:", networkErr, "URL:", API_BASE_URL);
      throw new Error("Sem ligação ao servidor. Tenta novamente.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Email ou senha incorretos");
    }
    return await response.json();
  }

  // ==================== EMAIL VERIFICATION ====================

  /**
   * Verificar email com código de 6 dígitos
   */
  static async verifyEmail(email, code) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao verificar email");
    }
    return await response.json();
  }

  /**
   * Reenviar código de verificação
   */
  static async resendVerificationCode(email) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao reenviar código");
    }
    return await response.json();
  }

  // ==================== PASSWORD RESET ====================

  /**
   * Pedir código de recuperação de password
   */
  static async forgotPassword(email) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao pedir recuperação");
    }
    return await response.json();
  }

  /**
   * Redefinir password com código
   */
  static async resetPassword(email, code, newPassword) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao redefinir password");
    }
    return await response.json();
  }

  /**
   * Fazer logout
   */
  static async logout() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      return true;
    } catch (error) {
      console.error("Error logging out:", error);
      // Clear anyway
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      return true;
    }
  }

  /**
   * Obter utilizador atual
   */
  static async getCurrentUser() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("No token found");
      
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch current user");
      return await response.json();
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }

  /**
   * Ingestar dados (upload)
   */
  static async ingestData(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/ingest`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to ingest data");
      return await response.json();
    } catch (error) {
      console.error("Error ingesting data:", error);
      throw error;
    }
  }

  // ==================== PLANS ====================

  /**
   * Gerar plano via IA
   */
  static async generatePlan(profileId, type = "combined", notes = null, categoryId = null) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/plans/generate`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ profile_id: profileId, type, notes, category_id: categoryId }),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao gerar plano");
    }
    return await response.json();
  }

  /**
   * Guardar plano customizado
   */
  static async savePlan(planData) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/plans/save`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(planData),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao guardar plano");
    }
    return await response.json();
  }

  /**
   * Listar planos de um perfil
   */
  static async getPlans(profileId, status = null, categoryId = null) {
    let url = `${API_BASE_URL}/plans/list/${profileId}`;
    const params = [];
    if (status) params.push(`status=${status}`);
    if (categoryId) params.push(`category_id=${categoryId}`);
    if (params.length) url += `?${params.join("&")}`;
    let response;
    try {
      response = await fetch(url, { headers: this.getHeaders() });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao obter planos");
    return await response.json();
  }

  /**
   * Obter detalhe de um plano
   */
  static async getPlanDetail(planId) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/plans/detail/${planId}`, {
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao obter plano");
    return await response.json();
  }

  /**
   * Atualizar plano (título, notas, status, categoria)
   */
  static async updatePlan(planId, updateData) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao atualizar plano");
    return await response.json();
  }

  /**
   * Duplicar plano
   */
  static async duplicatePlan(planId) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/plans/${planId}/duplicate`, {
        method: "POST",
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao duplicar plano");
    return await response.json();
  }

  // ==================== CATEGORIES ====================

  /**
   * Listar categorias do utilizador
   */
  static async getCategories() {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/categories?token=${token}`, {
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao obter categorias");
    return await response.json();
  }

  /**
   * Criar categoria
   */
  static async createCategory(data) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/categories?token=${token}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const resp = await response.json().catch(() => ({}));
      throw new Error(resp.detail || "Erro ao criar categoria");
    }
    return await response.json();
  }

  /**
   * Editar categoria
   */
  static async updateCategory(categoryId, data) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/categories/${categoryId}?token=${token}`, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao editar categoria");
    return await response.json();
  }

  /**
   * Apagar categoria
   */
  static async deleteCategory(categoryId) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/categories/${categoryId}?token=${token}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao apagar categoria");
    return await response.json();
  }

  // ==================== CHAT HISTORY ====================

  /**
   * Obter histórico de chat
   */
  static async getChatHistory(profileId, page = 1, perPage = 50) {
    let response;
    try {
      response = await fetch(
        `${API_BASE_URL}/chat/${profileId}?page=${page}&per_page=${perPage}`,
        { headers: this.getHeaders() }
      );
    } catch (networkErr) {
      console.error("Network error fetching chat history:", networkErr);
      return { messages: [], total: 0, page: 1, per_page: perPage };
    }
    if (!response.ok) return { messages: [], total: 0, page: 1, per_page: perPage };
    return await response.json();
  }

  // ==================== ZEN SESSIONS ====================

  /**
   * Listar sessões zen do utilizador
   */
  static async getZenSessions(limit = 50) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/zen?token=${token}&limit=${limit}`, {
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      console.error("Network error fetching zen sessions:", networkErr);
      return [];
    }
    if (!response.ok) return [];
    return await response.json();
  }

  /**
   * Guardar nova sessão zen
   */
  static async saveZenSession(data) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/zen?token=${token}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const resp = await response.json().catch(() => ({}));
      throw new Error(resp.detail || "Erro ao guardar sessão zen");
    }
    return await response.json();
  }

  /**
   * Apagar sessão zen
   */
  static async deleteZenSession(sessionId) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/zen/${sessionId}?token=${token}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao apagar sessão zen");
    return await response.json();
  }

  /**
   * Obter estatísticas zen
   */
  static async getZenStats() {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/zen/stats?token=${token}`, {
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      console.error("Network error fetching zen stats:", networkErr);
      return {};
    }
    if (!response.ok) return {};
    return await response.json();
  }

  // ==================== REPORTS ====================

  /**
   * Obter relatório completo do utilizador
   */
  static async getReportSummary() {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/reports/summary?token=${token}`, {
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const resp = await response.json().catch(() => ({}));
      throw new Error(resp.detail || "Erro ao obter relatório");
    }
    return await response.json();
  }

  // ==================== WATER TRACKING ====================

  /**
   * Obter dados de água de hoje
   */
  static async getWaterToday() {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/water/today?token=${token}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return { glasses: 0, ml_total: 0, goal_glasses: 8, percentage: 0 };
      return await response.json();
    } catch (err) {
      console.error("Error fetching water:", err);
      return { glasses: 0, ml_total: 0, goal_glasses: 8, percentage: 0 };
    }
  }

  /**
   * Adicionar água
   */
  static async addWater(glasses = 1) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/water/add?token=${token}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ glasses }),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao adicionar água");
    return await response.json();
  }

  /**
   * Remover 1 copo de água
   */
  static async removeWater() {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/water/remove?token=${token}`, {
        method: "POST",
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao remover água");
    return await response.json();
  }

  /**
   * Histórico de água (últimos N dias)
   */
  static async getWaterHistory(days = 7) {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/water/history?token=${token}&days=${days}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      console.error("Error fetching water history:", err);
      return [];
    }
  }

  // ==================== WEIGHT TRACKING ====================

  /**
   * Listar registos de peso
   */
  static async getWeightEntries(limit = 60) {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/weight?token=${token}&limit=${limit}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      console.error("Error fetching weight entries:", err);
      return [];
    }
  }

  /**
   * Adicionar registo de peso
   */
  static async addWeightEntry(weightKg, notes = null) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/weight?token=${token}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ weight_kg: weightKg, notes }),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) {
      const resp = await response.json().catch(() => ({}));
      throw new Error(resp.detail || "Erro ao registar peso");
    }
    return await response.json();
  }

  /**
   * Apagar registo de peso
   */
  static async deleteWeightEntry(entryId) {
    const token = localStorage.getItem('authToken');
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/weight/${entryId}?token=${token}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      });
    } catch (networkErr) {
      throw new Error("Sem ligação ao servidor.");
    }
    if (!response.ok) throw new Error("Erro ao apagar registo");
    return await response.json();
  }

  /**
   * Estatísticas de peso
   */
  static async getWeightStats() {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/weight/stats?token=${token}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return {};
      return await response.json();
    } catch (err) {
      console.error("Error fetching weight stats:", err);
      return {};
    }
  }

  // ==================== PROGRESS & ADAPTATION ====================

  /**
   * Criar snapshot de progresso (agrega métricas da semana)
   */
  static async createProgressSnapshot() {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/progress/snapshot?token=${token}`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao criar snapshot");
    }
    return await response.json();
  }

  /**
   * Listar snapshots de progresso
   */
  static async getProgressSnapshots(limit = 20) {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/progress/snapshots?token=${token}&limit=${limit}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      console.error("Error fetching snapshots:", err);
      return [];
    }
  }

  /**
   * Obter insights de progresso (comparação entre snapshots)
   */
  static async getProgressInsights() {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/progress/insights?token=${token}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error("Error fetching insights:", err);
      return null;
    }
  }

  /**
   * Submeter feedback sobre um plano
   */
  static async submitPlanFeedback(feedbackData) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/adaptation/feedback?token=${token}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(feedbackData),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro ao enviar feedback");
    }
    return await response.json();
  }

  /**
   * Obter feedback de um plano específico
   */
  static async getPlanFeedback(planId) {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/adaptation/feedback/${planId}?token=${token}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      return null;
    }
  }

  /**
   * Listar sugestões de adaptação
   */
  static async getAdaptationSuggestions(status = null) {
    const token = localStorage.getItem('authToken');
    let url = `${API_BASE_URL}/adaptation/suggestions?token=${token}`;
    if (status) url += `&status=${status}`;
    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      return [];
    }
  }

  /**
   * Responder a uma sugestão (aceitar/rejeitar)
   */
  static async respondToSuggestion(suggestionId, status, userResponse = null) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/adaptation/suggestions/${suggestionId}?token=${token}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ status, user_response: userResponse }),
    });
    if (!response.ok) throw new Error("Erro ao responder à sugestão");
    return await response.json();
  }

  /**
   * Disparar análise heurística manual
   */
  static async triggerAnalysis() {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/adaptation/analyze?token=${token}`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Erro na análise");
    }
    return await response.json();
  }
}

export default ApiService;
