# ✅ SOLUÇÃO FINAL - Base de Dados SQLite

## 📋 Ficheiros Alterados

### 1. **`src/core/db.py`** ✅
**Mudanças:**
- ✅ Adicionado `inspect()` para listar tabelas criadas
- ✅ Melhorado log de startup com:
  - Caminho absoluto da BD
  - DATABASE_URL utilizada
  - Lista de tabelas criadas
  - Aviso se não houver tabelas

### 2. **`src/main.py`** ✅
**Mudanças:**
- ✅ Ordem corrigida: `from src.core import models` ANTES de `from src.core.db import init_db`
- ✅ Isto garante que os modelos são registados na Base antes de `create_all()`
- ✅ Logs melhorados no startup

### 3. **`src/core/__init__.py`** ✅
**Mudanças:**
- ✅ Comentários explicativos sobre ordem de imports
- ✅ Garante que modelos são sempre importados primeiro

---

## 🔍 Como Confirmar que Tudo Funciona

### Passo 1: Apagar BD Antiga
```bash
rm -f /home/m4ster/Laphis/ai-service/src/data/laphis.db
```

### Passo 2: Correr Backend
```bash
cd /home/m4ster/Laphis/ai-service
source ../.venv/bin/activate
uvicorn src.main:app --reload
```

**Output esperado:**
```
🚀 Iniciando LAPHIS AI Service...

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
============================================================

✅ Base de dados pronta para usar!
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Passo 3: Verificar Tabelas com SQLite (noutro terminal)
```bash
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"
```

**Output esperado:**
```
chat_messages  meal_logs  profiles  users  workout_logs
```

### Passo 4: Ver Schema Completo
```bash
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".schema"
```

**Output esperado:** (todas as 5 tabelas com campos, índices e foreign keys)

---

## 📊 Tabelas Criadas

| Tabela | Finalidade | Foreign Keys |
|--------|-----------|--------------|
| `profiles` | Perfis de utilizadores | - |
| `workout_logs` | Histórico de treinos | profile_id → profiles |
| `meal_logs` | Histórico de refeições | profile_id → profiles |
| `users` | Utilizadores de chat/IA | - |
| `chat_messages` | Mensagens de conversa | user_id → users |

---

## 🎯 Verificação Rápida (Tudo em Um)

```bash
# 1. Limpar
rm -f /home/m4ster/Laphis/ai-service/src/data/laphis.db

# 2. Testar importação
cd /home/m4ster/Laphis/ai-service
source ../.venv/bin/activate
python -c "
from src.core import models
from src.core.db import Base, init_db
print('Modelos registados:', len(list(Base.registry.mappers)))
init_db()
"

# 3. Verificar com SQLite
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"
# Deve mostrar: chat_messages  meal_logs  profiles  users  workout_logs
```

---

## 💡 O Que foi Corrigido

**Problema:** Modelos não eram descobertos pelo SQLAlchemy
- ❌ ANTES: Imports em ordem errada → Base vazia
- ✅ DEPOIS: Modelos importados ANTES de create_all() → 5 tabelas criadas

**Problema:** Logs não detalhados
- ❌ ANTES: Apenas "Base de dados inicializada com sucesso!"
- ✅ DEPOIS: Mostra caminho da BD, URL, lista de tabelas

**Problema:** DATABASE_URL relativo podia causar confusão
- ❌ ANTES: `sqlite:///./laphis.db` (relativo)
- ✅ DEPOIS: `sqlite:////home/m4ster/.../laphis.db` (absoluto)

---

## 🚀 Status Final

✅ **Base de dados:** Criada automaticamente no startup
✅ **Tabelas:** 5 tabelas com relacionamentos corretos
✅ **Foreign keys:** Todos os relacionamentos criados
✅ **Índices:** Criados automaticamente em campos PK, FK
✅ **Logs:** Detalhados e informativos
✅ **Reset:** Automático - basta apagar laphis.db

---

**Tudo pronto! 🎉**
