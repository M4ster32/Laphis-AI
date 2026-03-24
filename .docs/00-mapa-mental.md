# 🎯 Mapa Mental do Projeto

## O que é LAPHIS?

Uma plataforma Web com:
- **IA** para recomendações personalizadas
- **Treino** e **Nutrição** customizado
- **Dashboard** para acompanhar progresso
- **Chat** para interagir com a IA

---

## Arquitetura em 3 Camadas

```
┌─────────────────────────────────────┐
│  🖥️  FRONTEND (React)               │
│  └─ Interface Web (localhost:5173)  │
└────────────┬────────────────────────┘
             │ HTTP / JSON
             ↓
┌─────────────────────────────────────┐
│  🔧 API (FastAPI)                   │
│  └─ Backend (localhost:8000)        │
│  └─ Endpoints: /health, /ask, etc   │
└────────────┬────────────────────────┘
             │ SQL Queries
             ↓
┌─────────────────────────────────────┐
│  💾 DATABASE (SQLite)               │
│  └─ laphis.db (ai-service/src/data) │
└─────────────────────────────────────┘
```

---

## Fluxo Típico de Uso

```
1. Utilizador abre http://localhost:5173

2. Vê a página Home (Home.jsx)

3. Clica em "Chat" → vai para Chat.jsx

4. Chat.jsx usa ApiService.askAI()

5. ApiService faz POST http://localhost:8000/ask

6. Backend recebe em api/ask.py

7. ask.py chama core/recommender.py (IA)

8. IA usa dados da core/db.py (SQLite)

9. Resposta volta como JSON

10. Chat.jsx mostra resposta no ecrã
```

---

## Pastas Importantes

### Backend
```
🧠 core/        - Lógica principal (BD, IA, validação)
🔌 api/         - Endpoints HTTP (rotas)
🛠️  utils/       - Funções auxiliares reutilizáveis
💾 data/        - Base de dados SQLite
```

### Frontend
```
📄 pages/       - Páginas (Home, Chat, Dashboard, Profile, Logs)
🧩 components/  - Blocos reutilizáveis (Card, Button, etc)
🔗 services/    - Comunicação com API (api.js)
🌍 contexts/    - Estado global (AppContext)
🪝 hooks/       - Custom hooks (useApp)
🛠️  utils/       - Funções auxiliares (formatação, validação)
🎨 app/         - Layout e estrutura geral
```

---

## Ficheiros Principais

### Backend
| Ficheiro | Função |
|----------|--------|
| `src/main.py` | 🚀 Inicia a API |
| `src/api/ask.py` | 💬 Endpoint de IA |
| `src/api/profile.py` | 👤 Gestão de perfil |
| `src/core/db.py` | 💾 Base de dados |
| `src/core/recommender.py` | 🧠 Algoritmo de recomendações |

### Frontend
| Ficheiro | Função |
|----------|--------|
| `src/main.jsx` | 🚀 Inicia React |
| `src/AppRouter.jsx` | 🗺️ Rotas da app |
| `src/pages/Chat.jsx` | 💬 Página de chat |
| `src/services/api.js` | 🔗 Cliente HTTP |
| `src/contexts/AppContext.jsx` | 🌍 Estado global |

---

## Comandos Essenciais

### Iniciar Tudo
```bash
# Terminal 1 - Backend
cd /home/m4ster/Laphis/ai-service
source ../.venv/bin/activate
uvicorn src.main:app --reload

# Terminal 2 - Frontend
cd /home/m4ster/Laphis/laphis-frontend
npm run dev
```

### Testar Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Ver documentação da API
http://localhost:8000/docs
```

### Instalar Pacotes
```bash
# Backend
cd /home/m4ster/Laphis
source .venv/bin/activate
pip install <nome-pacote>

# Frontend
cd /home/m4ster/Laphis/laphis-frontend
npm install <nome-pacote>
```

---

## Como Adicionar uma Nova Funcionalidade

### 1️⃣ Backend (criar um novo endpoint)

```python
# src/api/novo.py
from fastapi import APIRouter
from src.core.db import get_conn

router = APIRouter()

@router.get("/novo")
def novo_endpoint():
    return {"message": "Novo endpoint"}
```

```python
# src/main.py (adicionar)
from src.api.novo import router as novo_router
app.include_router(novo_router)
```

### 2️⃣ Frontend (chamar no componente)

```jsx
// src/pages/NovaPagina.jsx
import ApiService from "../services/api";

export default function NovaPagina() {
  const [data, setData] = useState(null);

  const loadData = async () => {
    const result = await ApiService.get("/novo");
    setData(result);
  };

  return <button onClick={loadData}>Carregar</button>;
}
```

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Backend não responde" | `curl http://localhost:8000/health` |
| "BD não criada" | `chmod -R 755 ai-service/src/data` |
| "Porta em uso" | `lsof -i :8000` → `kill -9 <PID>` |
| "Módulo não encontrado" | `source .venv/bin/activate` → `pip install -r requirements.txt` |
| "npm não funciona" | `sudo apt install nodejs npm` |

---

## Links Úteis

📚 **Documentação:**
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- Documentação local: Ver ficheiros em `.docs/`

🔗 **URLs Locais:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
