# 🗄️ Passo 2: Base de Dados SQLite - Verificação

## ✅ Ficheiros Alterados/Criados

### Criados:
1. **`src/core/models.py`** - Modelos SQLAlchemy
   - `User` - Utilizador com email, goal, created_at
   - `ChatMessage` - Mensagem de chat com relacionamento para User

2. **`requirements.txt`** - Dependências do projeto
   - FastAPI, Uvicorn, SQLAlchemy, Pydantic

### Alterados:
1. **`src/core/db.py`** - Migrado de sqlite3 para SQLAlchemy
   - `engine` - Motor SQLAlchemy para SQLite
   - `SessionLocal` - Session factory
   - `Base` - Base declarativa para modelos
   - `get_db()` - Dependency para injetar sessão nos endpoints
   - `init_db()` - Criar tabelas automaticamente

2. **`src/main.py`** - Integração com modelos
   - Importa `models` para registar na Base
   - `on_startup` cria tabelas com `Base.metadata.create_all()`

3. **`src/core/__init__.py`** - Exports do módulo core
   - Facilita imports de `Base`, `SessionLocal`, `engine`, `get_db`

---

## 🔍 Como Confirmar que a BD foi Criada

### Opção 1: Procurar o ficheiro (Mais Rápido)
```bash
ls -lh /home/m4ster/Laphis/ai-service/src/data/laphis.db
```

**Esperado:**
```
-rw-r--r-- 1 user user 8192 Feb 26 12:34 /home/m4ster/Laphis/ai-service/src/data/laphis.db
```

Se aparecer `No such file or directory`, a BD ainda não foi criada (é normal até correr o servidor).

### Opção 2: Ver o Conteúdo da BD (com SQLite CLI)
```bash
cd /home/m4ster/Laphis/ai-service
sqlite3 src/data/laphis.db ".tables"
```

**Esperado:**
```
chat_messages  users
```

### Opção 3: Ver o Schema da BD
```bash
sqlite3 /home/m4ster/Laphis/ai-service/src/data/laphis.db ".schema"
```

**Esperado:**
```sql
CREATE TABLE users (
    id INTEGER NOT NULL, 
    email VARCHAR(120) NOT NULL, 
    goal VARCHAR(50), 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (email)
);

CREATE TABLE chat_messages (
    id INTEGER NOT NULL, 
    user_id INTEGER NOT NULL, 
    role VARCHAR(20) NOT NULL, 
    content TEXT NOT NULL, 
    created_at DATETIME NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);
```

---

## 🚀 Próximos Passos

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

**Esperado na consola:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
...
✅ Base de dados inicializada com sucesso!
```

### 3. Verificar que a BD foi Criada
```bash
# Em outro terminal
ls -lh /home/m4ster/Laphis/ai-service/src/data/laphis.db
```

---

## 📝 Resumo da Estrutura

```
ai-service/
├── src/
│   ├── core/
│   │   ├── __init__.py        (atualizado)
│   │   ├── db.py              (atualizado - SQLAlchemy)
│   │   ├── models.py          (novo - User, ChatMessage)
│   │   ├── schemas.py         (existente - Pydantic)
│   │   └── recommender.py
│   ├── api/
│   ├── main.py                (atualizado - Base.metadata.create_all)
│   └── ...
├── requirements.txt            (novo - dependências)
└── ...
```

---

## 🔧 Configuração da BD

### SQLite Local
- **Localização**: `ai-service/src/data/laphis.db`
- **URL**: `sqlite:///./laphis.db` (relativo)
- **Environment**: `DATABASE_URL` (variável de ambiente - opcional)
- **Conexão**: `check_same_thread=False` para dev local

### Modelos Criados

**User**
```python
id: int (Primary Key)
email: str (Unique)
goal: str (Optional)
created_at: datetime
└── messages: List[ChatMessage]
```

**ChatMessage**
```python
id: int (Primary Key)
user_id: int (Foreign Key → users.id)
role: str ("user" ou "assistant")
content: str (Text)
created_at: datetime
└── user: User
```

---

## ⚠️ Notas Importantes

1. **SQLAlchemy é agora obrigatório** - Instala via `pip install -r requirements.txt`

2. **A BD é criada automaticamente** - Quando corres `uvicorn src.main:app --reload`, o `startup` cria as tabelas

3. **Imports Importantes**
   ```python
   # Para criar endpoints:
   from fastapi import Depends
   from src.core.db import get_db
   from sqlalchemy.orm import Session
   
   @router.get("/exemplo")
   def exemplo(db: Session = Depends(get_db)):
       # db está pronto para usar
   ```

4. **Adicionar Novos Modelos**
   - Cria em `src/core/models.py`
   - Herda de `Base`
   - Importa em `src/main.py` (automático com `from src.core import models`)

---

## ✅ Checklist de Verificação

- [ ] `pip install -r ai-service/requirements.txt` executado
- [ ] `uvicorn src.main:app --reload` executado sem erros
- [ ] Ver mensagem "✅ Base de dados inicializada com sucesso!"
- [ ] Ficheiro `laphis.db` existe em `ai-service/src/data/`
- [ ] Tabelas `users` e `chat_messages` existem (verificar com `sqlite3`)
- [ ] Nenhum erro de import nos ficheiros Python

---

Tudo pronto! A base de dados SQLite está completamente configurada com SQLAlchemy. 🎉
