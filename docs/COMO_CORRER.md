# 🚀 LAPHIS — Como Meter Tudo a Funcionar

> Guia rápido para pôr o projeto a correr do zero.

---

## Pré-requisitos

| Ferramenta | Versão Mínima | Verificar |
|-----------|---------------|-----------|
| Python | 3.10+ | `python3 --version` |
| Node.js | 16+ | `node --version` |
| npm | 8+ | `npm --version` |
| pip | 21+ | `pip --version` |

---

## 1. Setup Inicial (primeira vez)

### 1.1 — Backend (Python)

```bash
cd /home/m4ster/Laphis

# Criar virtual environment (se não existe)
python3 -m venv .venv

# Ativar
source .venv/bin/activate

# Instalar dependências
pip install -r ai-service/requirements.txt

# Criar base de dados (6 tabelas)
cd ai-service
python init_db.py
```

**Dependências Python principais:**
- fastapi, uvicorn, sqlalchemy, pydantic
- pyjwt, passlib, argon2-cffi
- python-multipart

### 1.2 — Frontend (Node/React)

```bash
cd /home/m4ster/Laphis/laphis-frontend

# Instalar dependências
npm install
```

---

## 2. Arrancar o Projeto

### Opção A — Dois terminais (recomendado para debug)

**Terminal 1 — Backend:**
```bash
cd /home/m4ster/Laphis
source .venv/bin/activate
python run_backend.py
```
→ Backend disponível em `http://localhost:8000`
→ Swagger docs em `http://localhost:8000/docs`

**Terminal 2 — Frontend:**
```bash
cd /home/m4ster/Laphis/laphis-frontend
npm run dev
```
→ Frontend disponível em `http://localhost:5173`

### Opção B — Script automático

```bash
cd /home/m4ster/Laphis
bash start_laphis.sh start
```

Para parar: `bash start_laphis.sh stop`
Para ver logs: `bash start_laphis.sh logs-backend` ou `logs-frontend`

---

## 3. Primeiro Uso

1. Abre `http://localhost:5173` no browser
2. Clica **"Criar Conta"** → preenche email + password (mín. 6 chars)
3. Redireciona para **Perfil** → preenche os 8 campos obrigatórios
4. Após guardar → vai para o **Dashboard**
5. Usa o **Chat IA** para pedir planos de treino/nutrição
6. Guarda planos na aba **Planos**

---

## 4. Acesso via Telemóvel (LAN)

```bash
# Descobre o teu IP local
hostname -I
# Exemplo: 172.18.155.92
```

No telemóvel, abre: `http://172.18.155.92:5173`

> ⚠️ O backend e frontend têm de estar a correr no computador.
> O telemóvel tem de estar na mesma rede Wi-Fi.

---

## 5. Resetar Base de Dados

Se precisares de começar com dados limpos:

```bash
cd /home/m4ster/Laphis/ai-service

# Apagar BD existente
rm src/data/laphis.db

# Recriar com schema atualizado (6 tabelas)
source ../.venv/bin/activate
python init_db.py
```

> ⚠️ Depois de resetar a BD, os tokens antigos ficam inválidos.
> Tens de criar conta novamente (Register).

---

## 6. Troubleshooting

### Backend não arranca

```bash
# Verificar se porta 8000 está ocupada
lsof -i :8000

# Matar processo se necessário
kill $(lsof -ti :8000)

# Verificar que o venv está ativo
which python  # deve mostrar .venv/bin/python

# Testar health check
curl http://localhost:8000/health
```

### Frontend não arranca

```bash
# Verificar se porta 5173 está ocupada
lsof -i :5173

# Reinstalar dependências
cd /home/m4ster/Laphis/laphis-frontend
rm -rf node_modules
npm install
npm run dev
```

### "NetworkError" ou "Sem ligação ao servidor"

1. Verifica que o **backend está a correr** (Terminal 1)
2. Testa: `curl http://localhost:8000/health` → deve retornar `{"status": "ok"}`
3. Se retornar "Connection refused" → o backend não está a correr

### "Sessão inválida" ou auto-logout

- A BD foi resetada → os tokens antigos já não são válidos
- Solução: **cria conta novamente** (Register)

### Erros de import no backend

```bash
# Garantir que estás no venv correto
source /home/m4ster/Laphis/.venv/bin/activate

# Reinstalar dependências
pip install -r /home/m4ster/Laphis/ai-service/requirements.txt
```

### Token expirado (após 30 dias)

- O JWT expira após 30 dias
- Solução: faz **login novamente**

---

## 7. URLs Importantes

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |
| Frontend (LAN) | http://[TEU-IP]:5173 |

---

## 8. Ficheiros Importantes para Desenvolvimento

| Para... | Editar... |
|---------|-----------|
| Adicionar endpoint API | `ai-service/src/api/` + registar em `main.py` |
| Novo modelo BD | `ai-service/src/core/models.py` |
| Novo schema | `ai-service/src/core/schemas.py` |
| Melhorar IA | `ai-service/src/core/recommender.py` |
| Nova página frontend | `laphis-frontend/src/pages/` + rota em `AppRouter.jsx` |
| Novo método API client | `laphis-frontend/src/services/api.js` |
| Estilos globais | `laphis-frontend/src/index.css` |
| Navegação (tabs) | `laphis-frontend/src/app/Layout.jsx` |
| Config API URL | `laphis-frontend/src/constants.js` |

---

## 9. Como Adicionar uma Nova Feature (Template)

### Backend:
1. Criar modelo em `models.py` (se precisa de tabela nova)
2. Criar schemas em `schemas.py`
3. Criar `api/nova_feature.py` com os endpoints
4. Registar router em `main.py`: `app.include_router(nova_router, ...)`
5. Resetar BD se houver novo modelo: `rm laphis.db && python init_db.py`

### Frontend:
1. Adicionar métodos em `services/api.js`
2. Criar página em `pages/NovaFeature.jsx`
3. Adicionar rota em `AppRouter.jsx`
4. (Opcional) Adicionar tab em `app/Layout.jsx`
