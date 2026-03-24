# ✅ Base de Dados SQLite - Verificação Completa

## 🎯 Problema Resolvido

**Antes:** Base de dados inicializada mas `.tables` mostrava vazia
**Depois:** Tabelas criadas corretamente no SQLite

---

## 📊 Tabelas Criadas com Sucesso

```bash
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"
# Output: chat_messages  meal_logs  profiles  users  workout_logs
```

### Estrutura Completa

#### 1️⃣ **profiles** (Perfis de Utilizadores)
```sql
- id (INT, PK)
- name (VARCHAR 60)
- age (INT)
- sex (VARCHAR 20)
- height_cm (INT)
- weight_kg (FLOAT)
- goal (VARCHAR 50)
- level (VARCHAR 50)
- days_per_week (INT)
```

#### 2️⃣ **workout_logs** (Histórico de Treinos)
```sql
- id (INT, PK)
- profile_id (INT, FK → profiles.id)
- date (VARCHAR 10, YYYY-MM-DD)
- duration_min (INT)
- notes (TEXT)
```

#### 3️⃣ **meal_logs** (Histórico de Refeições)
```sql
- id (INT, PK)
- profile_id (INT, FK → profiles.id)
- date (VARCHAR 10, YYYY-MM-DD)
- meal (VARCHAR 50)
- calories (INT)
- protein_g (INT, nullable)
- notes (TEXT)
```

#### 4️⃣ **users** (Utilizadores de Chat/IA)
```sql
- id (INT, PK)
- email (VARCHAR 120, UNIQUE)
- goal (VARCHAR 50, nullable)
- created_at (DATETIME)
```

#### 5️⃣ **chat_messages** (Mensagens de Chat)
```sql
- id (INT, PK)
- user_id (INT, FK → users.id)
- role (VARCHAR 20: "user" ou "assistant")
- content (TEXT)
- created_at (DATETIME)
```

---

## 🔧 Ficheiros Alterados

### 1. **`src/core/db.py`**
```python
# ✅ Adicionado:
- inspect() para ver tabelas criadas
- Logs detalhados com caminho da BD
- Lista de tabelas criadas
```

**O que mudou:**
```
DATABASE_URL: sqlite:////home/m4ster/Laphis/ai-service/src/data/laphis.db
✅ Tabelas criadas: 5
   - chat_messages
   - meal_logs
   - profiles
   - users
   - workout_logs
```

### 2. **`src/main.py`**
```python
# ✅ Garantido:
- Modelos importados ANTES de create_all()
- from src.core import models (ANTES de init_db)
- Comentários claros sobre ordem de imports
- Logs melhorados no startup
```

**Ordem correta agora:**
```
1. from src.core import models  ← Registra modelos na Base
2. from src.core.db import init_db  ← Depois importa DB
3. @app.on_event("startup")
4. init_db()  ← Chama create_all
```

### 3. **`src/core/__init__.py`**
```python
# ✅ Garantido:
- Comentários explicam a ordem de imports
- from .db first
- from . import models second
```

---

## ✅ Verificações Completadas

### 1. Teste Python Direto
```bash
cd /home/m4ster/Laphis/ai-service
source ../.venv/bin/activate
python -c "
from src.core import models
from src.core.db import Base, engine, init_db
print('✅ Modelos registados na Base:', len(list(Base.registry.mappers)))
init_db()
"
```

**Output:**
```
✅ Modelos importados com sucesso
✅ Modelos registados na Base: 5
============================================================
🗄️  BASE DE DADOS INICIALIZADA
============================================================
📂 Caminho da BD: /home/m4ster/Laphis/ai-service/src/data/laphis.db
🔗 DATABASE_URL: sqlite:////home/m4ster/Laphis/ai-service/src/data/laphis.db
✅ Tabelas criadas: 5
   - chat_messages
   - meal_logs
   - profiles
   - users
   - workout_logs
```

### 2. Teste SQLite CLI
```bash
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"
# ✅ Output: chat_messages  meal_logs  profiles  users  workout_logs

sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".schema"
# ✅ Mostra todas as 5 tabelas com campos, índices e foreign keys
```

### 3. Verificação de Relacionamentos
```sql
profiles.id ← → workout_logs.profile_id
profiles.id ← → meal_logs.profile_id
users.id ← → chat_messages.user_id
```

✅ Todos os foreign keys criados corretamente!

---

## 🚀 Como Usar Agora

### Reset da BD (se necessário)
```bash
# Apagar BD antiga
rm -f /home/m4ster/Laphis/ai-service/src/data/laphis.db

# Ao correr FastAPI novamente, cria tabelas automaticamente
cd /home/m4ster/Laphis/ai-service
source ../.venv/bin/activate
uvicorn src.main:app --reload
```

### Verificar Tabelas
```bash
# Enquanto o FastAPI está a correr, noutro terminal:
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"
```

### Inserir Dados de Teste
```bash
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db << EOF
INSERT INTO profiles (name, age, sex, height_cm, weight_kg, goal, level, days_per_week)
VALUES ('João', 25, 'masculino', 180, 75.5, 'ganhar_massa', 'intermedio', 5);

INSERT INTO users (email, goal)
VALUES ('joao@example.com', 'perder_gordura');

INSERT INTO chat_messages (user_id, role, content, created_at)
VALUES (1, 'user', 'Olá, como te chamas?', datetime('now'));

INSERT INTO chat_messages (user_id, role, content, created_at)
VALUES (1, 'assistant', 'Olá! Sou a LAPHIS AI.', datetime('now'));
EOF

# Ver dados inseridos
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db "SELECT * FROM profiles;"
```

---

## 📝 Resumo Técnico

| Item | Status | Detalhes |
|------|--------|----------|
| Modelos SQLAlchemy | ✅ 5 criados | Profile, WorkoutLog, MealLog, User, ChatMessage |
| Tabelas SQLite | ✅ 5 criadas | Todas com índices e foreign keys |
| DATABASE_URL | ✅ Absoluto | `/home/m4ster/Laphis/ai-service/src/data/laphis.db` |
| Importação de Modelos | ✅ Ordenada | Feita ANTES de create_all() |
| Logs no Startup | ✅ Detalhados | Mostra caminho da BD e lista de tabelas |
| Reset BD | ✅ Automático | Apagar laphis.db e recriar no próximo start |
| Foreign Keys | ✅ Criadas | Relacionamentos entre tabelas |
| Índices | ✅ Criados | Em campos PK, FK e de busca frequente |

---

## 🎯 Confirmação Final

Para confirmar tudo está correto:

```bash
# 1. Apagar BD antiga
rm -f /home/m4ster/Laphis/ai-service/src/data/laphis.db

# 2. Correr FastAPI
cd /home/m4ster/Laphis/ai-service
source ../.venv/bin/activate
uvicorn src.main:app --reload
# ✅ Deve mostrar:
#    🚀 Iniciando LAPHIS AI Service...
#    🗄️  BASE DE DADOS INICIALIZADA
#    📂 Caminho da BD: /home/m4ster/Laphis/ai-service/src/data/laphis.db
#    ✅ Tabelas criadas: 5
#    ✅ Base de dados pronta para usar!

# 3. Em outro terminal, verificar tabelas
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"
# ✅ Output: chat_messages  meal_logs  profiles  users  workout_logs
```

---

**✅ PROBLEMA RESOLVIDO! Todas as tabelas são criadas e verificadas com sucesso.**
