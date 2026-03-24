# 📝 LAPHIS — Todos os Passos (Histórico Completo)

> Registo cronológico de tudo o que foi feito, corrigido e implementado.

---

## Fase 0 — Estado Inicial (Projeto Partido)

O projeto tinha múltiplos erros que impediam a execução:
- Dashboard.jsx tinha 250+ linhas duplicadas → erro de sintaxe na linha 529
- Imports do backend usavam `from src.core` em vez de imports relativos
- BD antiga não tinha `password_hash` → crash no registo
- bcrypt dava conflitos de compilação no Linux
- uvicorn não estava instalado
- `validateForm()` tratava strings como booleans
- CORS só permitia porta 5173 mas Vite corria na 5174
- Frontend usava Tailwind classes mas Tailwind não estava instalado
- `useContext` sem import

---

## Fase 1 — Correções Críticas

### Passo 1.1 — Dashboard.jsx
- Removido código duplicado (250+ linhas)
- Corrigido erro de sintaxe na linha 529
- Resultado: Dashboard renderiza corretamente

### Passo 1.2 — Backend Imports
- Alterado `from src.core.models` → `from core.models` (imports relativos)
- Aplicado a todos os ficheiros em `api/` e `core/`
- Resultado: Backend arranca sem ImportError

### Passo 1.3 — Base de Dados
- Schema antigo não tinha `password_hash` na tabela `users`
- Apagado `laphis.db` e recriado com schema correto via `init_db.py`
- Resultado: Registo e login funcionam

### Passo 1.4 — Password Hashing (bcrypt → Argon2)
- bcrypt dava erros de compilação (`_cffi_backend` missing)
- Substituído por `passlib[argon2]` + `argon2-cffi`
- Atualizado `auth.py`: `CryptContext(schemes=["argon2"])`
- Resultado: Hash de passwords funciona em qualquer sistema

### Passo 1.5 — uvicorn + dependências
- `pip install uvicorn` + atualizado `requirements.txt`
- Resultado: `python run_backend.py` funciona

### Passo 1.6 — CORS
- Adicionada porta 5174 ao `allow_origins`
- Mais tarde mudado para `["*"]` para suportar LAN
- Resultado: Frontend comunica com backend

### Passo 1.7 — Frontend Imports
- Corrigido named vs default exports em `components/index.js`
- Adicionado `import { useContext }` em contextos que faltava
- Resultado: Sem erros de compilação no React

---

## Fase 2 — Redesign Mobile-First Completo

### Passo 2.1 — Design System CSS
- Removidas todas as classes Tailwind
- Criado sistema de CSS Custom Properties (`:root { --primary, --bg, ... }`)
- Definidos estilos globais: `.form-input`, `.form-label`, `.form-select`, `.alert`, `.btn`
- Resultado: Estilos consistentes em toda a app

### Passo 2.2 — Layout Mobile
- Substituído sidebar desktop por bottom tab navigation
- Header fixo no topo
- 5 tabs: 🏠 Home, 💬 Chat, 📋 Planos, 📊 Dashboard, 👤 Perfil
- Resultado: Navegação natural em telemóvel

### Passo 2.3 — Todas as Páginas Redesenhadas
- **Home.jsx**: Landing page com hero, features, CTAs
- **Login.jsx**: Formulário centrado com link para registo
- **Register.jsx**: Formulário com validação + feedback visual
- **Profile.jsx**: 8 campos + cálculo IMC automático + cards visuais para objetivo/nível
- **Chat.jsx**: Bubbles de mensagem (user/AI), timestamps, auto-scroll, avatar IA
- **Dashboard.jsx**: 4 stat cards, progresso semanal, atividades recentes, quick actions
- **Logs.jsx**: Lista de atividades com ícones

### Passo 2.4 — Componentes Reutilizáveis
- `Button.jsx`: 4 variantes × 3 tamanhos
- `Card.jsx`: Icon + título + valor + subtítulo
- `Form.jsx`: Campos dinâmicos com validação e loading states
- `Modal.jsx`: Dialog animado com backdrop + footer actions

---

## Fase 3 — Acesso LAN (Mobile)

### Passo 3.1 — URL Dinâmico
- `constants.js`: `API_BASE_URL = http://${window.location.hostname}:8000`
- Resultado: Frontend funciona tanto em `localhost` como no IP da LAN

### Passo 3.2 — Vite Host
- `vite.config.js`: `server: { host: true }` → expõe em `0.0.0.0`
- Resultado: Acessível via `http://172.18.155.92:5173` no telemóvel

### Passo 3.3 — CORS Aberto
- `main.py`: `allow_origins=["*"]`
- Resultado: Pedidos do telemóvel aceites pelo backend

### Passo 3.4 — QR Code
- Gerado QR code para o URL da LAN
- Resultado: Scan no telemóvel → app abre diretamente

---

## Fase 4 — AI Coach (Recommender System)

### Passo 4.1 — `recommender.py` Reescrito (250+ linhas)
- Lógica de 3 camadas:
  1. Deteção de categoria (saudação, treino, nutrição, motivação, lesão, suplementos, sono, geral)
  2. Respostas baseadas no objetivo do perfil (perder gordura / ganhar massa / manter)
  3. Ajuste ao nível de experiência (iniciante / intermédio / avançado)
- Cálculos automáticos:
  - TDEE via Harris-Benedict (BMR × fator atividade)
  - Macros personalizados (proteína, carbos, gordura)
  - Splits de treino: Full-Body (2-3d), Upper-Lower (4d), PPL (5-6d)
- Tudo em português, conversacional

### Passo 4.2 — `ask.py` Atualizado
- Integração com `recommend()` do recommender
- Guarda mensagens na BD (`chat_messages` table)
- Resultado: Histórico de conversas persistente

---

## Fase 5 — Planos Guardáveis + Histórico Chat

### Passo 5.1 — Modelo `Plan` (Backend)
- Nova tabela `plans` com campos: id, profile_id, type, title, content_json (JSON), notes, status, created_at, updated_at
- Adicionada relação `Profile.plans`
- Resultado: Planos armazenados estruturadamente

### Passo 5.2 — Schemas Pydantic
- `PlanGenerateIn`: profile_id, type, notes
- `PlanSaveIn`: profile_id, type, title, content_json, notes
- `PlanUpdateIn`: title, notes, status (todos opcionais)
- `PlanOut`: todos os campos + datas
- `PlanListOut`: lista paginada
- `ChatMessageOut` + `ChatHistoryOut`: para histórico

### Passo 5.3 — API de Planos (`api/plans.py`)
- 6 endpoints novos:
  - `POST /plans/generate` → gera plano via IA
  - `POST /plans/save` → guarda plano custom
  - `GET /plans/list/{profile_id}` → lista planos (com filtro status)
  - `GET /plans/detail/{plan_id}` → detalhe completo
  - `PUT /plans/{plan_id}` → atualizar título/notas/status
  - `POST /plans/{plan_id}/duplicate` → clonar plano
- Função `_generate_plan_content()`: chama recommender com perguntas adequadas ao tipo
- Função `_bullets_to_sections()`: converte bullets do recommender em secções JSON

### Passo 5.4 — API de Chat History (`api/chat.py`)
- `GET /chat/{profile_id}?page=1&per_page=50`
- Paginação com total, page, per_page
- Resultado: Chat mostra mensagens anteriores

### Passo 5.5 — Frontend Plans
- **Plans.jsx**: Lista de planos com tabs de filtro (todos/ativos/arquivados), modal para gerar novo plano, ações rápidas (arquivar, duplicar)
- **PlanDetail.jsx**: Vista completa do plano com edição inline, duplicar, arquivar, renderização de secções JSON

### Passo 5.6 — Frontend Chat Atualizado
- Carrega histórico ao abrir (`getChatHistory`)
- Botão "Guardar como Plano" em respostas da IA
- `handleSaveAsPlan()`: deteta tipo, extrai título, constrói secções

### Passo 5.7 — Rotas e Navegação
- `AppRouter.jsx`: adicionadas rotas `/plans` e `/plans/:planId`
- `Layout.jsx`: novo tab "📋 Planos" na bottom nav
- `Dashboard.jsx`: quick action "📋 Meus Planos"

### Passo 5.8 — Conflito de Rotas Resolvido
- `GET /plans/{profile_id}` conflitava com `PUT /plans/{plan_id}` (ambos tinham path param)
- Solução: renomeado para `GET /plans/list/{profile_id}`
- Atualizado `api.js` para usar nova rota

### Passo 5.9 — BD Recriada
- Apagado `laphis.db` (agora com 5→6 tabelas)
- Recriado com `init_db.py`
- 6 tabelas: users, profiles, workout_logs, meal_logs, chat_messages, plans

---

## Fase 6 — Correção NetworkError + Consolidação Docs

### Passo 6.1 — Diagnóstico NetworkError no Perfil
- **Sintoma**: "NetworkError when attempting to fetch resource" ao criar perfil
- **Causa raiz**: Backend não estava a correr (port 8000 offline) + tokens antigos (BD foi apagada)
- **Verificação**: Teste end-to-end (register → create profile) retornou 200 OK para ambos

### Passo 6.2 — Error Handling Melhorado (`api.js`)
- Todas as 15+ métodos do `ApiService` atualizados
- Network errors (backend offline) → mensagem clara: "Sem ligação ao servidor. Verifica que o backend está a correr na porta 8000."
- Token inválido (401) → auto-logout + mensagem: "Sessão inválida. Faz login novamente."
- Erros da API → mostra `detail` do backend em português
- Resultado: Utilizador vê mensagem útil em vez de "NetworkError"

### Passo 6.3 — Documentação Consolidada
- 20+ ficheiros de documentação redundantes → 3 ficheiros:
  1. `docs/RESUMO.md` — Resumo completo do projeto
  2. `docs/PASSOS.md` — Este ficheiro (histórico)
  3. `docs/COMO_CORRER.md` — Guia de setup e execução
- Apagados todos os ficheiros `.md` e `.txt` redundantes da raiz
