# LAPHIS — Relatório de Progresso

**Projeto**: LAPHIS — Coach de Fitness e Nutrição com Inteligência Artificial  
**Autor**: *(preencher nome)*  
**Data**: 15 de abril de 2026  
**Tipo**: Relatório intermédio (versão de construção)

---

## 1. O que é o LAPHIS

Basicamente, o LAPHIS é uma app web que funciona como um personal trainer e nutricionista virtual. A ideia surgiu porque hoje em dia ter um PT ou nutricionista custa bastante, e a maioria das apps que existem dão planos genéricos que não têm em conta o perfil de cada pessoa.

O que o LAPHIS faz:
- Tem um chat com IA que gera planos de treino e nutrição personalizados
- Adapta os planos conforme o progresso do utilizador
- Permite registar treinos, refeições, água e peso
- Mostra um dashboard com as métricas todas
- Exporta relatórios em PDF
- Tem um modo de meditação com sons ambiente

A app está online e a funcionar em https://laphis.vercel.app

---

## 2. Números do Projeto

| Métrica | Valor |
|---------|-------|
| Linhas de código (frontend) | ~13 500 |
| Linhas de código (backend) | ~6 900 |
| Total de código | ~20 400 linhas |
| Commits no Git | 98 |
| Período de desenvolvimento | 22 Jan – 15 Abr 2026 (~12 semanas) |
| Páginas no frontend | 16 |
| Routers na API | 17 |
| Tabelas na base de dados | 16 |
| Requisitos funcionais feitos | 11 de 12 (92%) |

---

## 3. Tecnologias Usadas

Escolhi estas tecnologias com base no que já conhecia e no que fazia mais sentido para o projeto:

| Camada | Tecnologia | Porquê |
|--------|-----------|--------|
| **Frontend** | React 19 + Vite 8 | É o que tenho mais experiência, e o Vite é muito rápido para development |
| **Routing** | React Router 7 | Standard para React, suporta rotas protegidas |
| **Gráficos** | Recharts | Fácil de usar com React e fica bem no mobile |
| **PDF** | jsPDF + AutoTable | Para exportar os relatórios sem precisar de backend |
| **Ícones** | Lucide React | Leves e consistentes, tipo Feather Icons mas com mais opções |
| **Backend** | FastAPI (Python) | Mais rápido que Django/Flask, documentação automática, async |
| **ORM** | SQLAlchemy 2.0 | Standard para Python, suporta vários tipos de DB |
| **Base de Dados** | SQLite (dev) / PostgreSQL (prod) | SQLite para não complicar em local, PostgreSQL em produção para ser robusto |
| **Auth** | JWT + Argon2 | JWT para ser stateless, Argon2 porque é mais seguro que bcrypt |
| **IA** | OpenAI API + fallback de regras | GPT para respostas naturais, motor de regras quando a API não está disponível |
| **Deploy** | Vercel (front) + Render (back) | Ambos têm tier gratuito e fazem deploy automático |

**Nota sobre o CSS**: Optei por CSS puro com custom properties em vez de Tailwind ou Bootstrap. Deu mais trabalho, mas tenho controlo total sobre o design e não carrego dependências desnecessárias.

---

## 4. Arquitetura

O projeto segue uma arquitetura de 3 camadas clássica:

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

O frontend e o backend estão no mesmo repositório (monorepo) mas fazem deploy separadamente. O frontend no Vercel e o backend + base de dados no Render. Cada vez que faço push para o branch main, ambos fazem deploy automático.

**Fluxo de autenticação:**
1. O utilizador regista-se com email → recebe código de verificação de 6 dígitos
2. Depois do login recebe um JWT token válido por 30 dias
3. As passwords são hasheadas com Argon2 (escolhi em vez de bcrypt porque é mais recente e resistente a ataques GPU)
4. Se o token expirar, a app faz auto-logout e redireciona para o login

---

## 5. Base de Dados

A base de dados tem 16 tabelas. Comecei com 6 e fui adicionando conforme as funcionalidades cresciam.

| Tabela | Para que serve |
|--------|---------------|
| `users` | Dados de autenticação, código de verificação, reset de password |
| `profiles` | Info pessoal (idade, peso, altura, objetivos, nível, dieta, alergias) |
| `workout_logs` | Registos de treinos (data, duração, calorias, notas) |
| `meal_logs` | Registos de refeições (tipo, alimentos, calorias, proteína) |
| `water_logs` | Hidratação diária (copos e ml) |
| `weight_entries` | Histórico de peso ao longo do tempo |
| `categories` | Categorias de planos criadas pelo utilizador |
| `chat_sessions` | Conversas com o coach (expiram ao fim de X tempo) |
| `chat_messages` | Cada mensagem individual (quem enviou, conteúdo, sessão) |
| `weekly_reports` | Resumos semanais gerados automaticamente |
| `plans` | Planos de treino e nutrição guardados (conteúdo em JSON) |
| `zen_sessions` | Sessões de meditação (com humor antes e depois) |
| `progress_snapshots` | Foto do progresso em determinado momento (peso, treinos, calorias) |
| `plan_ratings` | Avaliações dos planos (dificuldade, eficácia, etc.) |
| `adaptation_logs` | Quando a IA sugere mudanças ao plano e a resposta do utilizador |
| `daily_adaptive_plans` | Plano do dia gerado dinamicamente (treino + refeições em JSON) |

O backend faz auto-migração no startup — se faltar alguma coluna na base de dados, ele adiciona sozinho sem precisar de recriar nada.

---

## 6. Funcionalidades — Estado Atual

### 6.1 Requisitos Funcionais

| RF | O que é | Estado | Notas |
|----|---------|--------|-------|
| RF-01 | Registo e autenticação com verificação de email | ✅ Feito | JWT + Argon2 + código 6 dígitos |
| RF-02 | Perfil do utilizador | ✅ Feito | Wizard de 3 passos, calcula IMC automático |
| RF-03 | Chat com Coach IA | ✅ Feito | OpenAI GPT + fallback regras |
| RF-04 | Adaptação automática de planos | ✅ Feito | A IA analisa progresso e sugere mudanças |
| RF-05 | Dashboard com métricas | ✅ Feito | 4 cards de stats, resumo semanal, ações rápidas |
| RF-06 | Registo de treinos e refeições | ✅ Feito | Com pesquisa, filtros, paginação |
| RF-07 | Planos guardáveis | ✅ Feito | CRUD completo, filtros, arquivo, duplicar |
| RF-08 | Registo de água e peso | ✅ Feito | Tracking diário com histórico |
| RF-09 | Preferências alimentares e alergias | ✅ Feito | Integrado no perfil e nas recomendações da IA |
| RF-10 | Relatórios com exportação PDF | ✅ Feito | Gráficos Recharts + export com jsPDF |
| RF-11 | Integração com wearables | ❌ Por fazer | Depende de APIs externas (Fitbit, etc.) |
| RF-12 | Modo Zen (meditação) | ✅ Feito | Sons ambiente, respiração guiada, tracking de humor |

**11 de 12 feitos (92%).** O RF-11 (wearables) não foi implementado porque depende de APIs externas e requer hardware para testar.

### 6.2 Páginas

São 16 páginas no total. As 6 primeiras são públicas (login, registo, etc.) e as restantes 10 são protegidas — só se acede com login.

| Página | Rota | O que faz |
|--------|------|-----------|
| Home | `/` | Landing page com explicação do que é a app |
| Login | `/login` | Autenticação |
| Registo | `/register` | Criar conta |
| Verificar Email | `/verify-email` | Inserir código de 6 dígitos |
| Esqueci Password | `/forgot-password` | Pedir reset da password |
| Reset Password | `/reset-password` | Definir nova password |
| Dashboard | `/dashboard` | Painel principal com stats, resumo semanal, quick actions |
| Chat | `/chat` | Conversa com o coach (a funcionalidade principal) |
| Planos | `/plans` | Lista dos planos guardados com filtros |
| Detalhe Plano | `/plans/:id` | Ver um plano completo |
| Registos | `/logs` | Treinos e refeições registados |
| Relatórios | `/reports` | Gráficos e exportação PDF |
| Perfil | `/profile` | Editar dados pessoais e preferências |
| Definições | `/settings` | Mudar tema (light/dark) e outras preferências |
| Zen | `/zen` | Meditação guiada com sons ambiente |
| Peso | `/weight` | Histórico de pesagens |

### 6.3 API — Endpoints Principais

O backend tem 17 routers que servem mais de 40 endpoints. Aqui ficam os mais importantes:

| Método | Endpoint | O que faz |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login (devolve JWT) |
| POST | `/api/auth/verify-email` | Verificar código de email |
| GET/PUT | `/api/profile` | Ver ou atualizar perfil |
| POST | `/api/ask` | Enviar mensagem ao coach IA |
| GET/POST | `/api/plans` | Listar ou criar planos |
| POST | `/api/logs/workout` | Registar treino |
| POST | `/api/logs/meal` | Registar refeição |
| GET | `/api/reports/weekly` | Pedir relatório semanal |
| POST/GET | `/api/water` | Registar ou ver água do dia |
| GET/POST | `/api/weight` | Histórico de peso |
| POST | `/api/zen/session` | Registar sessão de meditação |

---

## 7. Como Funciona a IA

Esta é provavelmente a parte mais interessante do projeto. O sistema de IA tem duas camadas:

### Camada 1 — OpenAI GPT (modo principal)

Quando o utilizador envia uma mensagem no chat, o backend faz o seguinte:
1. Vai buscar o perfil completo do utilizador (peso, altura, objetivo, nível, dieta, alergias)
2. Verifica se há sugestões de adaptação pendentes (baseadas no progresso)
3. Monta um system prompt com toda essa informação
4. Envia para a API da OpenAI e devolve a resposta

Basicamente a IA sabe tudo sobre o utilizador e responde de forma personalizada. Se o utilizador pedir "um plano de treino para esta semana", a IA vai gerar um plano tendo em conta se é iniciante ou avançado, se quer perder peso ou ganhar massa, etc.

### Camada 2 — Motor de Regras (fallback)

Se a API da OpenAI não estiver disponível (ou se não houver chave API configurada), o sistema usa um motor de regras que escrevi com ~850 linhas de Python. Funciona assim:
1. Deteta palavras-chave na mensagem (treino, dieta, peso, etc.)
2. Cruza com o objetivo e nível do utilizador
3. Calcula TDEE e macros automaticamente
4. Gera recomendações baseadas em regras que defini

Não é tão natural como o GPT, mas garante que a app funciona sempre, mesmo sem IA.

---

## 8. Design e Interface

### Decisões de Design

Fiz o design todo em CSS puro, sem frameworks. Uso CSS Custom Properties (variáveis) para poder trocar o tema inteiro mudando apenas os valores das variáveis num ficheiro.

A app tem dois temas:
- **Light** — Fundo branco limpo com toques de beje
- **Dark** — Cinza escuro quente (não é preto puro, que cansa a vista)

### Mobile-First

A app foi desenhada primeiro para telemóvel e depois adaptada para desktop. Tem navegação por tabs em baixo (tipo Instagram) em vez de sidebar, porque é mais natural no mobile.

### Componentes

Criei componentes reutilizáveis para manter consistência:
- **Button** — 4 variantes (primary, secondary, outline, ghost) em 3 tamanhos
- **Card** — Container com sombra e animação no hover
- **Form** — Inputs com borda que brilha no focus
- **Modal** — Abre por baixo tipo bottom-sheet, responsivo
- **Toast** — Notificações temporárias (sucesso, erro, aviso, info)
- **Skeleton** — Placeholders animados enquanto carrega

Também apliquei glassmorphism no header e na navegação (efeito de vidro fosco com `backdrop-filter`), e as animações usam spring curves para parecerem mais naturais.

---

## 9. Segurança

| O quê | Como |
|-------|------|
| Passwords | Hasheadas com Argon2 (resistente a ataques com GPU) |
| Autenticação | JWT com HS256, expira ao fim de 30 dias |
| Verificação de email | Código de 6 dígitos enviado por email (SMTP em prod, consola em dev) |
| SQL Injection | Uso ORM (SQLAlchemy), nunca faço queries SQL diretamente |
| CORS | Só aceita pedidos dos domínios configurados |
| Sessões expiradas | Auto-redirect para login quando recebe 401 |
| Validação | Pydantic v2 valida todos os dados de entrada em todos os endpoints |

---

## 10. Deploy

| Componente | Onde está | URL |
|------------|----------|-----|
| Frontend | Vercel | https://laphis.vercel.app |
| Backend | Render | *(URL do Render)* |
| Base de Dados | PostgreSQL no Render | Acesso interno |
| Código | GitHub | github.com/M4ster32/Laphis |

O deploy é automático — cada vez que faço `git push` para o branch `main`, o Vercel recompila o frontend e o Render reinicia o backend. Não preciso de fazer nada manualmente.

Tudo está num monorepo (frontend e backend no mesmo repositório). O backend em produção usa PostgreSQL, mas em desenvolvimento local uso SQLite para ser mais simples.

---

## 11. Problemas que Encontrei

Ao longo do desenvolvimento encontrei vários problemas que tive de resolver:

| Problema | Como resolvi |
|----------|-------------|
| bcrypt não compilava no sistema | Troquei para Argon2, que além de funcionar melhor é mais seguro |
| Modal cortado no topo em telemóveis | Usei `100dvh` (dynamic viewport height) em vez de `100vh` |
| Formulário de perfil fazia auto-submit | Separei os event handlers e adicionei `preventDefault` |
| Chat perdia contexto entre mensagens | Implementei sessões de chat com histórico persistente |
| App crashava com token expirado | Adicionei interceptor que deteta 401 e redireciona ao login |
| IA indisponível quando API falha | Criei motor de regras fallback com 850 linhas de lógica |
| Scroll indesejado em certas páginas | Reestruturei o layout com `overflow: hidden` no root e scroll individual por página |
| Base de dados perdia colunas novas | Implementei auto-migração no startup do backend |
| CORS bloqueava pedidos em desenvolvimento | Configurei CORS dinâmico baseado no ambiente (dev vs prod) |

---

## 12. Fases de Desenvolvimento

| Fase | O que fiz | Quando |
|------|----------|--------|
| Setup inicial | Limpeza do código, correção de imports partidos, troca bcrypt→Argon2 | Jan 2026 |
| Backend funcional | DB recriada, CORS corrigido, endpoints a funcionar | Jan-Fev |
| Redesign mobile-first | Design system CSS completo, layout com bottom tabs | Fev |
| Motor de IA | Recommender.py (motor de regras), chat persistente | Fev-Mar |
| Planos guardáveis | CRUD de planos, filtros, guardar do chat, arquivo | Mar |
| Error handling | NetworkError, tokens expirados, auto-logout, validação | Mar |
| Integração OpenAI | GPT integrado no chat, planos, adaptação, daily plan | Mar-Abr |
| RF-04/RF-09 | Adaptação automática + preferências alimentares | Abr |
| UX polish | Perfil wizard, pesquisa em registos, PDF, empty states | Abr |
| Design premium | Glassmorphism, sombras, animações spring, tipografia | Abr |
| Paleta final | Clean White + Warm Charcoal (minimal com toque beje) | Abr |

---

## 13. O Que Falta

| Item | Prioridade | Porquê |
|------|-----------|--------|
| RF-11 — Wearables (Fitbit, etc.) | Baixa | Precisa de APIs externas e hardware para testar |
| Testes automatizados | Média | Ainda não escrevi testes, estive focado nas funcionalidades |
| PWA (funcionar offline) | Média | Seria útil mas não é crítico para a entrega |
| Docker | Baixa | Simplifica o setup mas não é obrigatório |
| Rate limiting | Baixa | Proteção extra contra abuso, mas com poucos utilizadores não é urgente |

---

## 14. Conclusão

Neste momento o LAPHIS tem 11 de 12 requisitos funcionais implementados e está em produção. A app funciona end-to-end: uma pessoa pode registar-se, preencher o perfil, falar com o coach, receber planos personalizados, registar o progresso e ver relatórios.

O único requisito que falta (wearables) depende de APIs externas e vai ser tratado se houver tempo. O foco agora é polir a experiência, corrigir bugs que possam aparecer e preparar a entrega final.

O projeto tem quase 100 commits e mais de 20 mil linhas de código entre frontend e backend, o que reflete bastante trabalho ao longo das últimas 12 semanas.

---

*Relatório escrito a 15/04/2026 — versão de construção.*
