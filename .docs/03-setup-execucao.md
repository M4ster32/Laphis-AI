# 🚀 Setup e Execução do Projeto

## Pré-requisitos

- **Python 3.8+** instalado
- **Node.js 16+** e **npm** instalado
- **Git** para controlo de versão

## Estrutura de Pastas

```
Laphis/
├── .venv/                # Ambiente virtual Python
├── ai-service/           # Backend (FastAPI)
├── laphis-frontend/      # Frontend (React)
├── docs/                 # Documentação do projeto
└── db/                   # Scripts de BD
```

---

## 1️⃣ Setup Inicial (primeira vez)

### Backend (AI Service)

```bash
# 1. Navegar até à pasta do backend
cd /home/m4ster/Laphis/ai-service

# 2. Criar ambiente virtual (se não existir)
python3 -m venv /home/m4ster/Laphis/.venv

# 3. Ativar ambiente virtual
source /home/m4ster/Laphis/.venv/bin/activate

# 4. Instalar dependências
pip install -r requirements.txt

# 5. Testar se funciona
python -c "import fastapi; print('✅ FastAPI pronto')"
```

### Frontend (React)

```bash
# 1. Navegar até à pasta do frontend
cd /home/m4ster/Laphis/laphis-frontend

# 2. Instalar dependências
npm install

# 3. Testar se funciona
npm run lint
```

---

## 2️⃣ Executar em Desenvolvimento

### Opção A: Dois Terminais Separados

**Terminal 1 - Backend:**
```bash
cd /home/m4ster/Laphis/ai-service
source /home/m4ster/Laphis/.venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Resultado esperado:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Terminal 2 - Frontend:**
```bash
cd /home/m4ster/Laphis/laphis-frontend
npm install
npm run dev
```

Resultado esperado:
```
  VITE v8.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

### Opção B: Executar Tudo num Script

Criar ficheiro `run.sh` na raiz:

```bash
#!/bin/bash

# Iniciar backend em background
cd /home/m4ster/Laphis/ai-service
source /home/m4ster/Laphis/.venv/bin/activate
uvicorn src.main:app --reload &
BACKEND_PID=$!

# Iniciar frontend
cd /home/m4ster/Laphis/laphis-frontend
npm run dev

# Cleanup ao terminar
kill $BACKEND_PID
```

---

## 3️⃣ URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | `http://localhost:5173` | Interface web |
| Backend | `http://localhost:8000` | API REST |
| Docs API | `http://localhost:8000/docs` | Swagger (documentação interativa) |
| Health Check | `http://localhost:8000/health` | Status da API |

---

## 4️⃣ Verificações Básicas

### Backend está OK?
```bash
curl http://localhost:8000/health
# Esperado: {"status":"ok"}
```

### Aceder aos Docs da API
Abrir no browser: `http://localhost:8000/docs`
- Permite testar endpoints
- Documentação automática

### Frontend carregou?
Abrir no browser: `http://localhost:5173`
- Deve mostrar a interface React
- Verificar console para erros

---

## 5️⃣ Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'fastapi'"

```bash
# Solução: Reativar ambiente virtual
source /home/m4ster/Laphis/.venv/bin/activate
pip install -r requirements.txt
```

### Erro: "npm: command not found"

```bash
# Solução: Instalar Node.js
# No Ubuntu/Debian:
sudo apt install nodejs npm

# No macOS:
brew install node
```

### Erro: "Port 8000 is already in use"

```bash
# Solução: Matar processo na porta 8000
lsof -i :8000
kill -9 <PID>

# Ou usar porta diferente
uvicorn src.main:app --reload --port 8001
```

### Erro: "Port 5173 is already in use"

```bash
# Solução: Usar porta diferente
cd laphis-frontend
npm run dev -- --port 5174
```

### BD não está a ser criada

Verificar permissões na pasta:
```bash
ls -la /home/m4ster/Laphis/ai-service/src/data/
# Deve ter permissão de escrita (w)
chmod -R 755 /home/m4ster/Laphis/ai-service/src/data/
```

---

## 6️⃣ Instalação de Novas Dependências

### Backend (Python)
```bash
cd /home/m4ster/Laphis
source .venv/bin/activate
pip install <nome-pacote>
pip freeze > ai-service/requirements.txt
```

### Frontend (Node)
```bash
cd /home/m4ster/Laphis/laphis-frontend
npm install <nome-pacote>
```

---

## 7️⃣ Builds para Produção

### Backend
```bash
# Já pronto para deploy (FastAPI + Uvicorn)
# Basta fazer deploy com:
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd /home/m4ster/Laphis/laphis-frontend
npm run build
# Cria pasta `dist/` com ficheiros de produção
```

---

## Checklist Setup ✅

- [ ] Python 3.8+ instalado
- [ ] Node.js 16+ instalado
- [ ] `.venv` criado e ativado
- [ ] Dependências Python instaladas
- [ ] Dependências Node instaladas
- [ ] Backend inicia sem erros
- [ ] Frontend inicia sem erros
- [ ] API disponível em `http://localhost:8000`
- [ ] Frontend disponível em `http://localhost:5173`
- [ ] Base de dados criada em `ai-service/src/data/laphis.db`
