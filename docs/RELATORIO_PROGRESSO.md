# LAPHIS — Relatório de Progresso

**Projeto**: LAPHIS — Coach de Fitness e Nutrição com Inteligência Artificial  
**Autor**: *(preencher nome)*  
**Data**: 15 de abril de 2026  
**Tipo**: Relatório intermédio de construção (não é produto final)

---

## 1. Resumo do Projeto

O LAPHIS é uma aplicação web responsiva de coaching personalizado de fitness e nutrição. A aplicação funciona como um personal trainer digital disponível 24/7, capaz de gerar planos de treino e nutrição adaptados ao perfil, objetivos e preferências de cada utilizador.

**Problema identificado:**
- Personal trainers e nutricionistas têm custos elevados
- Planos genéricos não consideram o perfil individual
- Falta de acompanhamento contínuo e acessível

**Solução proposta:**
- App web com chat inteligente que gera planos personalizados
- Dashboard com métricas e acompanhamento em tempo real
- Sistema de registos (treinos, refeições, água, peso)
- Adaptação automática dos planos com base no progresso

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React | 19.2 |
| **Bundler** | Vite | 8 (beta) |
| **Routing** | React Router | 7.13 |
| **Ícones** | Lucide React | 0.577 |
| **Gráficos** | Recharts | 3.8 |
| **Exportação PDF** | jsPDF + AutoTable | 4.2 / 5.0 |
| **Backend** | FastAPI (Python) | 0.104 |
| **ORM** | SQLAlchemy | 2.0 |
| **Base de Dados** | PostgreSQL (produção) / SQLite (dev) | — |
| **Autenticação** | JWT (PyJWT) + Argon2 | HS256, 30 dias |
| **IA** | OpenAI API (GPT) + Motor de regras fallback | — |
| **Deploy Frontend** | Vercel | Auto-deploy |
| **Deploy Backend** | Render | Auto-deploy |

---

## 3. Arquitetura

```
┌─────────────────┐     HTTPS/JSON      ┌─────────────────┐     SQLAlchemy     ┌──────────────┐
│   React 19      │ ◄──────────────────► │   FastAPI        │ ◄────────────────► │  PostgreSQL   │
│   (Vercel)      │     REST API         │   (Render)       │     ORM            │  (Render)     │
│                 │                      │                  │                    │              │
│ - 16 páginas    │                      │ - 17 routers     │                    │ - 16 tabelas │
│ - CSS custom    │                      │ - JWT auth       │                    │              │
│ - Mobile-first  │                      │ - OpenAI / rules │                    │              │
└─────────────────┘                      └─────────────────┘                    └──────────────┘
```

**Fluxo de autenticação:**
1. Registo com email → código de verificação de 6 dígitos
2. Login → JWT token (válido 30 dias, guardado em `localStorage`)
3. Passwords hasheadas com Argon2 (mais seguro que bcrypt)
4. Auto-logout em caso de token expirado/inválido (HTTP 401)

---

## 4. Base de Dados — 16 Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Autenticação, verificação email, reset password |
| `profiles` | Dados pessoais, objetivos, nível, dieta, alergias |
| `workout_logs` | Registos de exercício (data, duração, calorias) |
| `meal_logs` | Registos de refeições (tipo, alimentos, calorias, proteína) |
| `water_logs` | Hidratação diária (copos, ml total) |
| `weight_entries` | Histórico de peso corporal |
| `categories` | Categorias de planos definidas pelo utilizador |
| `chat_sessions` | Conversas com o coach (com expiração) |
| `chat_messages` | Mensagens individuais (role, conteúdo, sessão) |
| `weekly_reports` | Resumos semanais automáticos |
| `plans` | Planos de treino/nutrição (conteúdo JSON, estado) |
| `zen_sessions` | Sessões de meditação/respiração (humor antes/depois) |
| `progress_snapshots` | Snapshots periódicos de métricas |
| `plan_ratings` | Avaliações de planos (dificuldade, eficácia) |
| `adaptation_logs` | Decisões de adaptação automática |
| `daily_adaptive_plans` | Planos diários adaptativos (treino + refeições) |

---

## 5. Funcionalidades Implementadas

### 5.1 Requisitos Funcionais

| RF | Descrição | Estado |
|----|-----------|--------|
| RF-01 | Registo e autenticação com verificação de email | ✅ Completo |
| RF-02 | Perfil do utilizador (wizard 3 passos, IMC automático) | ✅ Completo |
| RF-03 | Chat com Coach IA (planos personalizados) | ✅ Completo |
| RF-04 | Adaptação automática de planos (via chat) | ✅ Completo |
| RF-05 | Dashboard com métricas e resumo semanal | ✅ Completo |
| RF-06 | Registo de treinos e refeições | ✅ Completo |
| RF-07 | Planos guardáveis (CRUD, filtros, arquivo) | ✅ Completo |
| RF-08 | Registo de água e peso | ✅ Completo |
| RF-09 | Preferências alimentares e alergias | ✅ Completo |
| RF-10 | Relatórios com exportação PDF | ✅ Completo |
| RF-11 | Integração com wearables | ❌ Não iniciado |
| RF-12 | Modo Zen (meditação e sons ambiente) | ✅ Completo |

**11 de 12 requisitos funcionais implementados.**

### 5.2 Páginas do Frontend (16 rotas)

| Página | Rota | Função |
|--------|------|--------|
| Home | `/` | Landing page |
| Login | `/login` | Autenticação |
| Registo | `/register` | Criação de conta |
| Verificar Email | `/verify-email` | Código de 6 dígitos |
| Esqueci Password | `/forgot-password` | Recuperação |
| Reset Password | `/reset-password` | Nova password |
| Dashboard | `/dashboard` | Métricas, resumo, ações rápidas |
| Chat | `/chat` | Conversa com o Coach IA |
| Planos | `/plans` | Lista de planos guardados |
| Detalhe Plano | `/plans/:id` | Ver plano completo |
| Registos | `/logs` | Treinos e refeições |
| Relatórios | `/reports` | Gráficos e exportação PDF |
| Perfil | `/profile` | Editar dados pessoais |
| Definições | `/settings` | Tema, preferências |
| Zen | `/zen` | Meditação guiada, sons ambiente |
| Peso | `/weight` | Histórico de peso |

### 5.3 API Backend (17 routers, 40+ endpoints)

**Routers registados:**
`health`, `auth`, `profile`, `logs`, `ask`, `plans`, `chat`, `categories`, `zen`, `reports`, `water`, `weight`, `progress`, `adaptation`, `rag_ingest`, `rag_ask`, `daily_plan`

**Exemplos de endpoints:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registo |
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET | `/api/profile` | Obter perfil |
| POST | `/api/ask` | Enviar mensagem ao coach |
| GET | `/api/plans` | Listar planos |
| POST | `/api/logs/workout` | Registar treino |
| POST | `/api/logs/meal` | Registar refeição |
| GET | `/api/reports/weekly` | Relatório semanal |
| POST | `/api/water` | Registar água |
| GET | `/api/weight` | Histórico de peso |

---

## 6. Sistema de IA — Duas Camadas

### Camada 1: OpenAI (modo principal)
- Usa GPT via API da OpenAI
- System prompt personalizado com o perfil do utilizador
- Contexto de adaptação injetado automaticamente (progresso, sugestões pendentes)
- Gera planos de treino e nutrição em linguagem natural

### Camada 2: Motor de Regras (fallback)
- Ativo quando a API OpenAI não está disponível ou falha
- `recommender.py` com 850+ linhas de lógica
- Deteção de palavras-chave no pedido do utilizador
- Cálculo automático de TDEE, macros e splits de treino
- Refeições personalizadas por tipo de dieta e alergias
- 3 camadas de decisão: categoria → objetivo → nível de experiência

---

## 7. Design System

### Abordagem
- **CSS puro** com Custom Properties (sem Tailwind/Bootstrap)
- **Mobile-first** — desenhado para telemóvel, adapta para desktop
- **Temas**: Light (Clean White) + Dark (Warm Charcoal)
- **Glassmorphism** no header e navegação (backdrop-filter + transparência)

### Tokens de Design
- Radii: 20px / 14px / 10px / 50px (pill)
- Transições: 180ms com `cubic-bezier(0.16, 1, 0.3, 1)`
- Sombras: 4 níveis (sm / md / lg / xl) com camadas
- Tipografia: Weight 800 headings, letter-spacing -0.035em

### Componentes Reutilizáveis
- `Button` — 4 variantes (primary, secondary, outline, ghost) × 3 tamanhos
- `Card` — container com sombra e hover
- `Form` — inputs com glow ring no focus
- `Modal` — bottom-sheet responsivo (max 85vh)
- `Toast` — notificações (success, error, warning, info)
- `Skeleton` — loading placeholders animados

---

## 8. Segurança

| Medida | Implementação |
|--------|---------------|
| Hashing de passwords | Argon2 (argon2-cffi) |
| Autenticação | JWT HS256, expiração 30 dias |
| Verificação de email | Código de 6 dígitos por email |
| Proteção SQL Injection | ORM (SQLAlchemy) — sem queries raw |
| CORS | Configurado para domínios específicos |
| Auto-logout | Redireciona ao login em 401 |
| Validação de dados | Pydantic v2 em todos os endpoints |

---

## 9. Deploy e Infraestrutura

| Componente | Plataforma | URL |
|------------|-----------|-----|
| Frontend | Vercel | https://laphis.vercel.app |
| Backend | Render | *(URL do Render)* |
| Base de Dados | PostgreSQL (Render) | Interno |
| Repositório | GitHub | github.com/M4ster32/Laphis |

- Deploy automático em cada `git push` para `main`
- Frontend e backend em repositório único (monorepo)
- Backend faz auto-migração de colunas em falta no startup

---

## 10. Histórico de Desenvolvimento (resumo dos commits)

| Fase | O que foi feito |
|------|----------------|
| **Fase 0** | Correção do estado inicial (imports partidos, duplicações, bcrypt→Argon2) |
| **Fase 1** | Fixes críticos — backend funcional, DB recreada, CORS corrigido |
| **Fase 2** | Redesign mobile-first completo — design system CSS, layout bottom tabs |
| **Fase 3** | Acesso LAN — testar no telemóvel via Wi-Fi |
| **Fase 4** | Motor de IA — recommender.py (250+ linhas), chat persistente |
| **Fase 5** | Planos guardáveis — CRUD completo, filtros, guardar do chat |
| **Fase 6** | Error handling — NetworkError, tokens expirados, auto-logout |
| **Integração IA** | OpenAI GPT integrado — chat, planos, adaptação, daily plan |
| **RF-04/RF-09** | Adaptação automática + preferências alimentares |
| **UX Polish** | Perfil wizard, pesquisa em registos, PDF, validação, empty states |
| **Design Premium** | Glassmorphism, sombras layered, spring animations, tipografia bold |
| **Paleta Final** | Clean White + Warm Charcoal (minimal com toque beje) |

---

## 11. O Que Falta / Próximos Passos

| Prioridade | Item | Esforço |
|------------|------|---------|
| Baixa | RF-11 — Integração com wearables (Fitbit, Apple Health) | Alto |
| Média | Testes automatizados (pytest + Vitest) | Médio |
| Média | PWA (Progressive Web App) — funcionar offline | Médio |
| Baixa | Docker para deploy simplificado | Baixo |
| Baixa | Rate limiting nos endpoints | Baixo |
| Futuro | App nativa (React Native) | Alto |

---

## 12. Conclusão

O LAPHIS encontra-se num estado avançado de desenvolvimento, com **11 de 12 requisitos funcionais implementados** e em produção (acessível via https://laphis.vercel.app). A aplicação está funcional end-to-end: um utilizador pode registar-se, preencher o perfil, conversar com o coach IA, receber planos personalizados, registar o seu progresso e visualizar relatórios.

O foco atual tem sido no **polish da experiência de utilizador** — design system moderno, responsividade, feedback visual — e na **robustez** — error handling, auto-migração da base de dados, fallback quando a IA não está disponível.

O único requisito funcional em falta (RF-11, wearables) depende de APIs externas e será abordado numa fase posterior caso haja tempo.

---

*Documento gerado a 15/04/2026 — versão de construção, não final.*
