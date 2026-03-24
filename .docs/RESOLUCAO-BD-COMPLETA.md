# ✅ RESOLUÇÃO COMPLETA - Base de Dados SQLite

## 🎯 Resumo do Problema e Solução

### Problema
```
✅ FastAPI arrancava com "Base de dados inicializada com sucesso"
❌ Mas sqlite3 laphis.db ".tables" mostrava vazio
```

### Causa Raiz
Os modelos SQLAlchemy não eram importados **ANTES** de `Base.metadata.create_all()` ser chamado, então o SQLAlchemy não tinha nada para criar.

### Solução Implementada
Garantir que a ordem de imports é:
1. `from src.core import models` ← **PRIMEIRO** (registra modelos na Base)
2. `from src.core.db import init_db` ← **DEPOIS**
3. Chamar `init_db()` que executa `Base.metadata.create_all()`

---

## 📁 Ficheiros Alterados

### 1. **`src/main.py`**
```python
# ✅ ANTES (ordem errada):
from src.core.db import init_db, engine, Base
from src.core import models  # ← importado DEPOIS

# ✅ DEPOIS (ordem correta):
from src.core import models  # ← importado PRIMEIRO
from src.core.db import init_db, engine, Base
```

### 2. **`src/core/db.py`**
```python
# ✅ Melhorias:
- Adicionado: from sqlalchemy import inspect
- Função init_db() agora mostra:
  * Caminho completo da BD
  * DATABASE_URL utilizada
  * Lista de tabelas criadas
  * Aviso se nenhuma tabela foi criada
```

### 3. **`src/core/__init__.py`**
```python
# ✅ Garantido:
from .db import Base, SessionLocal, engine, get_db, init_db
from . import models  # ← Sempre importado depois de db
```

---

## ✅ Verificação Final

### Tabelas Criadas (5 no Total)

```bash
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"
# Output: chat_messages  meal_logs  profiles  users  workout_logs
```

### Log de Startup
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
```

### Schema das Tabelas
```sql
-- Todos os relacionamentos e índices criados ✅
profiles
  ├─ workout_logs (FK: profile_id)
  └─ meal_logs (FK: profile_id)

users
  └─ chat_messages (FK: user_id)
```

---

## 🚀 Como Usar Agora

### Setup Inicial (primeira vez)
```bash
# 1. Instalar dependências
cd /home/m4ster/Laphis
source .venv/bin/activate
pip install -r ai-service/requirements.txt

# 2. Correr o backend
cd ai-service
uvicorn src.main:app --reload
```

### Reset da BD (se necessário)
```bash
# 1. Apagar BD antiga
rm -f /home/m4ster/Laphis/ai-service/src/data/laphis.db

# 2. Correr backend novamente
cd /home/m4ster/Laphis/ai-service
source ../.venv/bin/activate
uvicorn src.main:app --reload
# ✅ Cria BD e tabelas automaticamente
```

### Verificar Dados
```bash
# Ver tabelas
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".tables"

# Ver schema
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".schema"

# Ver dados em tabela
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db "SELECT * FROM profiles;"
```

---

## 📊 Status dos Componentes

| Componente | Status | Detalhes |
|-----------|--------|----------|
| SQLAlchemy | ✅ Instalado | v2.0.23 |
| FastAPI | ✅ Funcionando | Startup correto |
| SQLite BD | ✅ Criada | `/home/m4ster/Laphis/ai-service/src/data/laphis.db` |
| Tabelas | ✅ Criadas | 5 tabelas com FKs e índices |
| Modelos | ✅ Registados | Profile, WorkoutLog, MealLog, User, ChatMessage |
| Imports | ✅ Ordenados | Modelos importados ANTES de create_all |
| Logs | ✅ Detalhados | Mostra caminho, URL, lista de tabelas |

---

## 🎯 Confirmação de Sucesso

Executar isto para confirmar tudo:

```bash
#!/bin/bash
cd /home/m4ster/Laphis/ai-service

# 1. Limpar BD antiga
rm -f src/data/laphis.db

# 2. Testar imports
source ../.venv/bin/activate
python -c "
from src.core import models
from src.core.db import Base, init_db
print('✅ Modelos registados:', len(list(Base.registry.mappers)))
init_db()
"

# 3. Verificar tabelas
echo ""
echo "🔍 Verificando tabelas com SQLite:"
sqlite3 src/data/laphis.db ".tables"

# 4. Verificar que ficheiro existe
echo ""
echo "📁 Verificando ficheiro:"
ls -lh src/data/laphis.db
```

**Resultado esperado:**
```
✅ Modelos registados: 5
[logs detalhados]
chat_messages  meal_logs  profiles  users  workout_logs
-rw-r--r-- 1 m4ster m4ster 20K fev 26 19:30 src/data/laphis.db
```

---

## 📝 Checklist Final

- [x] Ficheiros alterados (3 ficheiros)
- [x] Ordem de imports corrigida
- [x] Logs melhorados
- [x] 5 tabelas criadas
- [x] Foreign keys criadas
- [x] Índices criados
- [x] Startup testado com sucesso
- [x] SQLite CLI verificado
- [x] Documentação atualizada

---

## 🔗 Documentação Relacionada

- `.docs/BD-VERIFICACAO-FINAL.md` - Verificação detalhada
- `.docs/SOLUCAO-BD-FINAL.md` - Solução resumida
- `.docs/PASSO2-VERIFICACAO.md` - Setup inicial
- `.docs/RESOLUCAO-ERROS.md` - Resolução de erros anteriores

---

**✅ PROBLEMA COMPLETAMENTE RESOLVIDO!**

**A base de dados SQLite é criada com sucesso no startup do FastAPI com todas as 5 tabelas, relacionamentos e índices.**
