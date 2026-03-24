# ✅ Resolução de Erros - Base de Dados SQLAlchemy

## Erro Original
```
ImportError: cannot import name 'get_conn' from 'src.core.db'
```

## Causa
Os ficheiros API (`ask.py`, `profile.py`, `logs.py`) estavam a tentar importar `get_conn()` que foi removida quando migramos de sqlite3 para SQLAlchemy.

---

## 🔧 O Que Foi Corrigido

### 1. **`src/core/models.py`** (Expandido)
Adicionados modelos SQLAlchemy para as tabelas existentes:

```python
class Profile(Base)
├── name, age, sex
├── height_cm, weight_kg
├── goal, level
├── days_per_week
└── Relationships: workout_logs, meal_logs

class WorkoutLog(Base)
├── profile_id (FK)
├── date, duration_min
├── notes
└── Relationship: profile

class MealLog(Base)
├── profile_id (FK)
├── date, meal
├── calories, protein_g, notes
└── Relationship: profile

class User(Base)
├── email (unique)
├── goal
├── created_at
└── Relationship: messages

class ChatMessage(Base)
├── user_id (FK)
├── role ("user"/"assistant")
├── content
├── created_at
└── Relationship: user
```

### 2. **`src/api/ask.py`** (Atualizado)
```python
# ❌ Antes
from ..core.db import get_conn

def ask(payload: AskIn):
    profile = _load_profile(payload.profile_id)

# ✅ Depois
from fastapi import Depends
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..core.models import Profile

def ask(payload: AskIn, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == payload.profile_id).first()
```

### 3. **`src/api/profile.py`** (Atualizado)
```python
# ❌ Antes
@router.post("")
def create_profile(payload: ProfileIn):
    conn = get_conn()
    # ... SQL commands

# ✅ Depois
@router.post("")
def create_profile(payload: ProfileIn, db: Session = Depends(get_db)):
    db_profile = Profile(**payload.model_dump())
    db.add(db_profile)
    db.commit()
    return ProfileOut.model_validate(db_profile)
```

### 4. **`src/api/logs.py`** (Atualizado)
```python
# ❌ Antes
def _profile_exists(profile_id: int) -> bool:
    conn = get_conn()
    # ... SQL check

# ✅ Depois
def _profile_exists(profile_id: int, db: Session) -> bool:
    return db.query(Profile).filter(Profile.id == profile_id).first() is not None
```

---

## 📋 Ficheiros Alterados

| Ficheiro | Alterações |
|----------|-----------|
| `src/core/models.py` | ✅ Expandido com Profile, WorkoutLog, MealLog |
| `src/core/db.py` | ✅ Já estava pronto |
| `src/main.py` | ✅ Já estava pronto |
| `src/api/ask.py` | ✅ Migrado para SQLAlchemy |
| `src/api/profile.py` | ✅ Migrado para SQLAlchemy |
| `src/api/logs.py` | ✅ Migrado para SQLAlchemy |

---

## 🚀 Como Testar Agora

### 1. Instalar Dependências
```bash
cd /home/m4ster/Laphis
source .venv/bin/activate
pip install -r ai-service/requirements.txt
```

### 2. Correr o Backend
```bash
cd /home/m4ster/Laphis/ai-service
source ../.venv/bin/activate
uvicorn src.main:app --reload
```

**Esperado:**
```
✅ Base de dados inicializada com sucesso!
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 3. Verificar Tabelas Criadas
```bash
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"
```

**Esperado:**
```
chat_messages  meal_logs  profiles  users  workout_logs
```

---

## 📊 Estrutura Final de BD

```sql
profiles
├── id (PK)
├── name, age, sex
├── height_cm, weight_kg
├── goal, level, days_per_week
└── FKs: workout_logs.profile_id, meal_logs.profile_id

workout_logs
├── id (PK)
├── profile_id (FK → profiles.id)
├── date, duration_min, notes

meal_logs
├── id (PK)
├── profile_id (FK → profiles.id)
├── date, meal, calories, protein_g, notes

users
├── id (PK)
├── email (UNIQUE)
├── goal
├── created_at
└── FK: chat_messages.user_id

chat_messages
├── id (PK)
├── user_id (FK → users.id)
├── role, content
├── created_at
```

---

## ✅ Verificação de Sintaxe

Todos os ficheiros compilam sem erros:
```bash
python -m py_compile src/main.py src/api/ask.py src/api/profile.py src/api/logs.py src/core/models.py src/core/db.py
```

✅ Sem output = Sem erros ✓

---

## 🎯 Próximos Passos

1. ✅ Corrigidos os erros de import
2. ✅ Todos os ficheiros agora usam SQLAlchemy
3. ✅ Modelos criados e relacionamentos definidos
4. ⏭️ Pronto para testar com `uvicorn src.main:app --reload`

---

**Status:** ✅ Todos os erros resolvidos!
