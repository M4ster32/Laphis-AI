# 🚀 GUIA DE DEPLOYMENT - LAPHIS

## 1️⃣ SETUP SUPABASE

```bash
# 1. Cria projeto em https://supabase.com
# 2. Vai em Settings → Database → Connection Pooling
# 3. Copia a connection string (escolhe "Session" mode)
# Exemplo: postgresql://postgres:PASSWORD@db.project.supabase.co:5432/postgres

# 4. Guarda num lugar seguro (vai precisar depois)
```

## 2️⃣ SETUP LOCAL + MIGRAÇÃO

```bash
cd /home/m4ster/Laphis

# Instala dependências PostgreSQL
pip install -r ai-service/requirements.txt

# Exporta connection string do Supabase
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# Testa se consegue conectar
python -c "from sqlalchemy import create_engine; engine = create_engine('$DATABASE_URL'); print('✅ Conexão OK')"

# Migra dados (SQLite → PostgreSQL)
python migrate_to_supabase.py

# Testa backend com PostgreSQL
cd ai-service
python -m uvicorn src.main:app --reload
# Deve mostrar: ✅ Tabelas criadas: 13
```

## 3️⃣ DEPLOY BACKEND (Railway)

```bash
# Instala Railway CLI
npm i -g railway

# Login
railway login

# Do diretório raiz do projeto
cd /home/m4ster/Laphis
railway link  # Seleciona o projeto

# Define variáveis de ambiente
railway variables set DATABASE_URL="postgresql://..."
railway variables set FRONTEND_URL="https://seu-frontend-vercel.app"

# Deploy
railway up

# Output: https://seu-backend-railway.app ✅
```

## 4️⃣ DEPLOY FRONTEND (Vercel)

```bash
cd laphis-frontend

# Login no Vercel
npm i -g vercel
vercel login

# Deploy (auto-detecta Next.js/Vite)
vercel

# Define variáveis de ambiente no dashboard
VITE_API_URL=https://seu-backend-railway.app

# Output: https://seu-frontend-vercel.app ✅
```

## 5️⃣ VERIFICA TUDO

```bash
# Backend health
curl https://seu-backend-railway.app/health

# Frontend carrega em https://seu-frontend-vercel.app
# Check se API calls funcionam

# Logs backend
railway logs -f

# Logs frontend (Vercel dashboard)
```

## 🔐 VARIÁVEIS DE AMBIENTE

### Railway (Backend):
```
DATABASE_URL=postgresql://postgres:PASSWORD@db.project.supabase.co:5432/postgres
FRONTEND_URL=https://seu-frontend-vercel.app
ENVIRONMENT=production
```

### Vercel (Frontend):
```
VITE_API_URL=https://seu-backend-railway.app
```

## 🆘 TROUBLESHOOTING

**Backend não conecta a Supabase:**
```bash
# Verifica connection string
psql postgresql://postgres:PASSWORD@db.project.supabase.co:5432/postgres

# Se falhar, check:
# - PASSWORD está correto?
# - IP whitelisted? (Supabase permite tudo por default)
# - Firewall do projeto?
```

**Frontend erro 401/Unauthorized:**
```bash
# Verifica se VITE_API_URL está correto
# Check localStorage authToken no DevTools
```

**Dados não migraram:**
```bash
# Refaz migração com verbose
python migrate_to_supabase.py --debug
```

## ✅ CHECKLIST FINAL

- [x] Projeto Supabase criado
- [x] Connection string copiada
- [x] Backend testado localmente com PostgreSQL
- [x] Dados migrados (SQLite → PostgreSQL)
- [x] Backend deployed em Railway
- [x] Frontend deployed em Vercel
- [x] Variáveis de ambiente definidas
- [x] CORS configurado (FRONTEND_URL em config.py)
- [x] Testes e2e passam

## 📞 SUPORTE

Se tiver problemas:
1. Check logs: `railway logs -f`
2. Verifica connection string
3. Testa connection local antes de fazer deploy
4. Check CORS errors na DevTools do browser
