# 📋 LAPHIS — Resumo Completo do Projeto

> **Última atualização:** Julho 2025

---

## 1. O que é o LAPHIS?

**LAPHIS** é uma aplicação web de **coaching fitness & nutrição com IA**. O utilizador cria uma conta, preenche o seu perfil (idade, peso, altura, objetivo, nível) e recebe recomendações personalizadas de treino e nutrição geradas por um sistema de IA. Pode também guardar planos, consultar histórico de conversas e registar atividades.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + Vite | React 19, Vite 8 |
| Routing | React Router | v7 |
| Estilos | CSS puro (Custom Properties) | — |
| Backend | FastAPI (Python) | Python 3.12 |
| ORM | SQLAlchemy | 2.0 |
| Base de Dados | SQLite | — |
| Auth | JWT (PyJWT, HS256) + Argon2 | 30 dias expiração |
| Validação | Pydantic v2 | — |

**Arquitetura:**

```
┌──────────────┐    REST/JSON     ┌──────────────┐     SQL      ┌──────────┐
│   React App  │ ◄──────────────► │   FastAPI    │ ◄──────────► │  SQLite  │
│  (Vite 5173) │                  │  (port 8000) │              │  laphis  │
└──────────────┘                  └──────────────┘              └──────────┘
```

---

## 3. Funcionalidades Implementadas

### 3.1 Autenticação
- Registo com email + password (mín. 6 caracteres)
- Login com JWT (token guardado em `localStorage`)
- Hash de passwords com Argon2 (memory-hard)
- Rotas protegidas no frontend e backend
- Auto-logout quando token inválido/expirado (401)

### 3.2 Perfil do Utilizador
- 8 campos: nome, idade, sexo, altura, peso, objetivo, nível, dias/semana
- Cálculo de IMC em tempo real
- Cards visuais para selecção de objetivo e nível
- Criação e edição no mesmo formulário

### 3.3 AI Coach (Chat)
- Chat conversacional com a IA em português
- Respostas contextuais baseadas no perfil do utilizador
- Sistema de recomendação com 3 camadas:
  1. **Baseado no objetivo** (perder gordura / ganhar massa / manter)
  2. **Ajustado ao nível** (iniciante / intermédio / avançado)
  3. **Deteção de palavras-chave** (treino, nutrição, lesão, motivação, suplementos, sono)
- Cálculos automáticos: TDEE (Harris-Benedict), macros, splits de treino
- Splits gerados: Full-Body, Upper-Lower, PPL (Push-Pull-Legs)
- Histórico de mensagens guardado na BD com paginação

### 3.4 Planos Guardáveis
- Geração de planos via IA (treino / nutrição / combinado)
- Guardar planos do chat como plano permanente
- CRUD completo: listar, ver detalhe, editar título/notas, arquivar, duplicar
- Filtros por estado (todos / ativos / arquivados)
- Conteúdo estruturado em JSON com secções

### 3.5 Dashboard
- 4 cards de estatísticas (treinos, calorias, streak, nível)
- Progresso semanal
- Atividades recentes
- Ações rápidas (Chat IA, Planos, Perfil)

### 3.6 Logs de Atividade
- Registo de treinos (data, duração, notas)
- Registo de refeições (data, refeição, calorias, proteína, notas)
- Listagem com paginação

### 3.7 UI/UX Mobile-First
- Design system completo com CSS Custom Properties
- Tema verde (`--primary: #2E7D32`)
- Bottom tab navigation (🏠 Home, 💬 Chat, 📋 Planos, 📊 Dashboard, 👤 Perfil)
- Animações (fadeIn, slideUp)
- Cards, buttons, forms, alerts, modals reutilizáveis
- Acesso via LAN (URL dinâmico: `http://${window.location.hostname}:8000`)

---

## 4. Modelo de Dados (6 Tabelas)

### `users`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| email | VARCHAR UNIQUE | Not null |
| password_hash | VARCHAR | Argon2 hash |
| goal | VARCHAR | Opcional |
| created_at | DATETIME | Auto |

### `profiles`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK → users | Único |
| name | VARCHAR | Not null |
| age | INTEGER | 12-100 |
| sex | VARCHAR | masculino/feminino/outro |
| height_cm | INTEGER | 120-230 |
| weight_kg | FLOAT | 35-250 |
| goal | VARCHAR | perder_gordura/ganhar_massa/manter |
| level | VARCHAR | iniciante/intermedio/avancado |
| days_per_week | INTEGER | 1-7 |
| training_days | VARCHAR | Opcional |
| notes | TEXT | Opcional |

### `workout_logs`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| profile_id | INTEGER FK → profiles | |
| date | VARCHAR | ISO date |
| duration_min | INTEGER | Minutos |
| notes | TEXT | Opcional |

### `meal_logs`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| profile_id | INTEGER FK → profiles | |
| date | VARCHAR | ISO date |
| meal | VARCHAR | Tipo refeição |
| calories | INTEGER | kcal |
| protein_g | FLOAT | Gramas |
| notes | TEXT | Opcional |

### `chat_messages`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK → users | |
| role | VARCHAR | "user" ou "assistant" |
| content | TEXT | Mensagem |
| created_at | DATETIME | Auto |

### `plans`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| profile_id | INTEGER FK → profiles | |
| type | VARCHAR | training/nutrition/combined |
| title | VARCHAR | Título do plano |
| content_json | JSON | Secções estruturadas |
| notes | TEXT | Notas do utilizador |
| status | VARCHAR | active/archived |
| created_at | DATETIME | Auto |
| updated_at | DATETIME | Auto-update |

---

## 5. API Endpoints

### Público
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login |

### Protegido (JWT)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/me` | User atual |
| POST | `/auth/logout` | Logout |
| GET | `/profile/{id}` | Perfil por ID |
| GET | `/profile/me?token=` | Perfil por token |
| POST | `/profile?token=` | Criar/atualizar perfil |
| POST | `/ask` | Perguntar à IA |
| GET | `/logs` | Listar logs |
| POST | `/logs/{id}/workout` | Registar treino |
| POST | `/logs/{id}/meal` | Registar refeição |
| POST | `/plans/generate` | Gerar plano IA |
| POST | `/plans/save` | Guardar plano |
| GET | `/plans/list/{profile_id}` | Listar planos |
| GET | `/plans/detail/{plan_id}` | Detalhe plano |
| PUT | `/plans/{plan_id}` | Atualizar plano |
| POST | `/plans/{plan_id}/duplicate` | Duplicar plano |
| GET | `/chat/{profile_id}` | Histórico chat |

---

## 6. Estrutura de Ficheiros

```
Laphis/
├── ai-service/              ← Backend FastAPI
│   ├── requirements.txt     ← Dependências Python
│   ├── init_db.py           ← Criar/resetar BD
│   └── src/
│       ├── main.py          ← App FastAPI + CORS + routers
│       ├── config.py        ← Configurações (JWT_SECRET, etc.)
│       ├── api/
│       │   ├── auth.py      ← Register, login, logout, me
│       │   ├── profile.py   ← CRUD perfil
│       │   ├── ask.py       ← Endpoint IA + guardar mensagens
│       │   ├── plans.py     ← CRUD planos + geração IA
│       │   ├── chat.py      ← Histórico chat c/ paginação
│       │   ├── logs.py      ← Logs treino + refeição
│       │   ├── health.py    ← Health check
│       │   └── ingest.py    ← Upload dados
│       ├── core/
│       │   ├── models.py    ← 6 modelos SQLAlchemy
│       │   ├── schemas.py   ← Schemas Pydantic
│       │   ├── db.py        ← Engine + SessionLocal
│       │   └── recommender.py ← Sistema IA (250+ linhas)
│       ├── data/
│       │   └── laphis.db    ← SQLite database
│       └── models/
│           └── user.py      ← (legacy)
│
├── laphis-frontend/         ← Frontend React
│   ├── package.json         ← Dependências Node
│   ├── vite.config.js       ← Config Vite (host: true)
│   ├── index.html           ← Entry HTML
│   └── src/
│       ├── main.jsx         ← React root + Router
│       ├── AppRouter.jsx    ← Definição de rotas
│       ├── constants.js     ← API_BASE_URL dinâmico
│       ├── index.css        ← Estilos globais + design system
│       ├── app/
│       │   ├── Layout.jsx   ← Shell (header + bottom tabs)
│       │   └── layout.css   ← Estilos layout
│       ├── pages/
│       │   ├── Home.jsx     ← Landing page
│       │   ├── Login.jsx    ← Formulário login
│       │   ├── Register.jsx ← Formulário registo
│       │   ├── Profile.jsx  ← Formulário perfil (8 campos + IMC)
│       │   ├── Chat.jsx     ← Chat IA + histórico + guardar plano
│       │   ├── Dashboard.jsx← Stats, progresso, ações rápidas
│       │   ├── Plans.jsx    ← Lista planos + gerar + filtros
│       │   ├── PlanDetail.jsx← Detalhe plano + editar + duplicar
│       │   └── Logs.jsx     ← Listagem logs
│       ├── services/
│       │   └── api.js       ← ApiService (todas chamadas HTTP)
│       ├── contexts/
│       │   └── AppContext.jsx← Estado global React
│       ├── hooks/
│       │   └── useApp.js    ← Hook para AppContext
│       ├── components/
│       │   ├── Button.jsx   ← 4 variantes, 3 tamanhos
│       │   ├── Card.jsx     ← Card com icon + stats
│       │   ├── Form.jsx     ← Formulário dinâmico
│       │   └── Modal.jsx    ← Modal animado
│       └── utils/
│           └── helpers.js   ← Funções auxiliares
│
├── docs/                    ← Documentação
│   ├── RESUMO.md            ← Este ficheiro
│   ├── PASSOS.md            ← Histórico de passos
│   └── COMO_CORRER.md       ← Guia de setup
│
├── run_backend.py           ← Script arranque backend
└── start_laphis.sh          ← Script bash start/stop
```

---

## 7. Design System

### CSS Custom Properties
```css
--primary: #2E7D32          /* Verde principal */
--primary-light: #4CAF50    /* Verde claro */
--primary-bg: #E8F5E9       /* Background verde suave */
--bg: #f0f2f5               /* Background geral */
--surface: #ffffff           /* Cards, surfaces */
--text: #1a1a1a             /* Texto principal */
--text-secondary: #666      /* Texto secundário */
--border: #e0e0e0           /* Bordas */
--danger: #e74c3c           /* Vermelho erro */
--success: #2ecc71          /* Verde sucesso */
--radius: 16px              /* Border radius cards */
--shadow: 0 2px 12px rgba(0,0,0,0.08)  /* Sombras */
```

### Componentes
- **Button**: 4 variantes (primary, secondary, danger, success) × 3 tamanhos (sm, md, lg)
- **Card**: Icon + título + valor + subtítulo
- **Form**: Campos dinâmicos com validação
- **Modal**: Dialog animado com backdrop + footer actions
- **Alerts**: Success (verde) e Error (vermelho) com ícones

---

## 8. Segurança

- **Passwords**: Argon2 (memory-hard, resistente a GPU attacks)
- **Tokens**: JWT HS256, 30 dias expiração, guardados em `localStorage`
- **BD**: Email único (constraint), SQL injection prevenido via ORM
- **Password**: Mínimo 6 caracteres
- **CORS**: `allow_origins=["*"]` para acesso LAN
- **Auto-logout**: Frontend deteta 401 e limpa sessão

---

## 9. Decisões Técnicas

| Decisão | Alternativa | Razão |
|---------|-------------|-------|
| CSS puro | Tailwind | Controlo total, sem build overhead, custom properties |
| SQLite | PostgreSQL | Desenvolvimento local, sem setup, ficheiro único |
| Argon2 | bcrypt | Mais seguro, memory-hard, sem conflitos de compilação |
| Vite | Create React App | Mais rápido, HMR instantâneo, ESM nativo |
| FastAPI | Flask/Django | Async nativo, Pydantic integrado, Swagger automático |
| Bottom tabs | Sidebar | Mobile-first, mais natural em telemóvel |

---

## 10. Trabalho Futuro

### Curto Prazo
- [ ] Fine-tune LLaMA 2 no tower (RTX 5060 Ti 16GB VRAM)
- [ ] Voz/TTS no chat IA
- [ ] Gráficos de progresso (recharts)

### Médio Prazo
- [ ] Docker deployment
- [ ] Testes (pytest + vitest)
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Export CSV/PDF dos planos

### Longo Prazo
- [ ] Password reset por email
- [ ] 2FA
- [ ] Rate limiting
- [ ] WebSockets para chat em tempo real
- [ ] Refresh tokens
