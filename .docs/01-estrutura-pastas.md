# 📂 Estrutura de Pastas - Guia Detalhado

## Backend (ai-service)

```
ai-service/
├── src/
│   ├── api/                      # 🔌 Rotas HTTP e Endpoints
│   │   ├── health.py             # Verificação de status
│   │   ├── ask.py                # Endpoint de IA (perguntas)
│   │   ├── profile.py            # Gestão de perfil do utilizador
│   │   ├── logs.py               # Histórico de atividades
│   │   └── ingest.py             # Upload e processamento de dados
│   │
│   ├── core/                     # 🧠 Lógica principal
│   │   ├── db.py                 # Conexão e inicialização BD SQLite
│   │   ├── recommender.py        # Algoritmo de recomendações IA
│   │   ├── schemas.py            # Modelos Pydantic (validação)
│   │   └── __init__.py
│   │
│   ├── models/                   # 📊 Modelos de dados (expansível)
│   │   └── __init__.py
│   │
│   ├── utils/                    # 🛠️ Funções utilitárias
│   │   ├── helpers.py            # Funções auxiliares
│   │   └── __init__.py
│   │
│   ├── data/                     # 💾 Armazenamento
│   │   └── laphis.db             # Base de dados SQLite
│   │
│   ├── uploads/                  # 📁 Ficheiros carregados
│   │
│   └── main.py                   # 🚀 Ponto de entrada (FastAPI app)
│
└── requirements.txt              # Dependências Python
```

### O que cada pasta faz:

**`api/`** - Todos os endpoints HTTP que o frontend chama
- Recebem requests do frontend
- Retornam JSON responses
- Validam inputs com Pydantic

**`core/`** - Coração da aplicação
- `db.py`: Gerencia conexões com SQLite
- `recommender.py`: IA que faz recomendações
- `schemas.py`: Define estrutura dos dados (validação automática)

**`utils/`** - Funções reutilizáveis em todo o código
- Cálculos (IMC, calorias, etc.)
- Validações (emails, datas)
- Formatações

---

## Frontend (laphis-frontend)

```
laphis-frontend/
├── src/
│   ├── pages/                    # 📄 Páginas principais
│   │   ├── Home.jsx              # Página inicial
│   │   ├── Chat.jsx              # Chat com IA
│   │   ├── Dashboard.jsx         # Estatísticas e progresso
│   │   ├── Profile.jsx           # Perfil do utilizador
│   │   └── Logs.jsx              # Histórico
│   │
│   ├── app/                      # 🎨 Layout e estrutura
│   │   ├── Layout.jsx            # Layout base (navegação)
│   │   └── layout.css            # Estilos do layout
│   │
│   ├── components/               # 🧩 Componentes reutilizáveis
│   │   ├── Card.jsx (exemplo)    # Cards genéricos
│   │   ├── Button.jsx (exemplo)  # Botões
│   │   └── index.js              # Export central
│   │
│   ├── services/                 # 🔗 Comunicação com API
│   │   └── api.js                # Cliente HTTP (fetch)
│   │
│   ├── contexts/                 # 🌍 Estado global (React Context)
│   │   └── AppContext.jsx        # Estado da aplicação
│   │
│   ├── hooks/                    # 🪝 Custom React Hooks
│   │   └── useApp.js             # Hook para acessar contexto
│   │
│   ├── utils/                    # 🛠️ Funções auxiliares
│   │   └── helpers.js            # Formatação, validação, cálculos
│   │
│   ├── assets/                   # 🖼️ Imagens e recursos
│   │
│   ├── index.css                 # Estilos globais
│   ├── App.css                   # Estilos da app
│   ├── main.jsx                  # Ponto de entrada
│   └── AppRouter.jsx             # Rotas da aplicação
│
├── public/                       # Ficheiros públicos (favicon, etc.)
├── index.html                    # HTML principal
├── package.json                  # Dependências Node
├── vite.config.js                # Configuração Vite
└── eslint.config.js              # Configuração linting
```

### O que cada pasta faz:

**`pages/`** - Páginas completas (compontos principais)
- Cada ficheiro é uma página diferente
- Contêm a lógica específica dessa página

**`components/`** - Blocos reutilizáveis
- Card, Botão, Modal, etc.
- Usados em múltiplas páginas
- Mantêm estado local simples

**`services/`** - Comunicação com backend
- ApiService centraliza todas as chamadas HTTP
- Evita repetir código de fetch

**`contexts/`** - Estado compartilhado entre páginas
- AppContext gerencia dados globais (perfil, utilizador)
- Evita prop drilling

**`hooks/`** - Lógica reutilizável
- useApp: acede ao contexto global
- Custom hooks para lógica comum

**`utils/`** - Funções utilitárias
- Formatação de datas
- Validações
- Cálculos matemáticos

---

## Fluxo de Dados

```
User interacts with Page
        ↓
Page calls ApiService.method()
        ↓
ApiService makes HTTP request to Backend
        ↓
Backend (FastAPI) receives in api/route.py
        ↓
api/route.py uses core/ (db.py, recommender.py)
        ↓
Response sent back as JSON
        ↓
Page receives response, updates Context/State
        ↓
Component re-renders with new data
```

---

## Checklist de Organização ✅

- ✅ Backend estruturado em: api, core, utils, models
- ✅ Frontend estruturado em: pages, components, services, hooks, contexts, utils
- ✅ Serviço API centralizado
- ✅ Estado global com Context
- ✅ Funções auxiliares organizadas
- ✅ Documentação de estrutura
