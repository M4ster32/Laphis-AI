# 📝 Convenções de Código e Boas Práticas

## Python (Backend)

### Nomes de Ficheiros e Módulos
```python
# ✅ BOM
user_service.py
get_user_profile.py
calculate_bmi.py

# ❌ RUIM
UserService.py
GetUserProfile.py
calculateBmi.py
```

### Funções e Variáveis
```python
# ✅ BOM
def get_user_profile(user_id):
    user_data = fetch_user(user_id)
    return user_data

# ❌ RUIM
def GetUserProfile(userId):
    userData = FetchUser(userId)
    return userData
```

### Classes
```python
# ✅ BOM
class UserProfile:
    def __init__(self, name, age):
        self.name = name
        self.age = age

# ❌ RUIM
class user_profile:
    def __init__(self, name, age):
        self.name = name
        self.age = age
```

### Docstrings
```python
def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """
    Calcular o Índice de Massa Corporal.
    
    Args:
        weight_kg: Peso em quilogramas
        height_cm: Altura em centímetros
    
    Returns:
        float: IMC arredondado a 2 casas decimais
    """
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 2)
```

### Imports
```python
# ✅ BOM - Ordem correta
import os
import sys
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, APIRouter
import sqlite3

from src.core.db import get_conn

# ❌ RUIM - Desordenado
from src.core.db import get_conn
import os
from fastapi import FastAPI
import sqlite3
```

---

## JavaScript/React (Frontend)

### Nomes de Ficheiros
```javascript
// ✅ BOM
Dashboard.jsx
useApp.js
api.js
helpers.js
Dashboard.css

// ❌ RUIM
dashboard.jsx
UseApp.js
API.js
Helpers.js
```

### Componentes React
```jsx
// ✅ BOM
export default function Dashboard() {
  return <div>Conteúdo</div>;
}

// ❌ RUIM
const Dashboard = () => {
  return <div>Conteúdo</div>;
};
export default Dashboard;
```

### Nomes de Variáveis
```javascript
// ✅ BOM
const [userData, setUserData] = useState(null);
const [isLoading, setIsLoading] = useState(false);

// ❌ RUIM
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
```

### Funções
```javascript
// ✅ BOM
const fetchUserProfile = async (userId) => {
  try {
    const response = await fetch(`/api/profile/${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

// ❌ RUIM
const getProfile = async (id) => {
  return fetch(`/api/profile/${id}`).then(r => r.json());
};
```

### Comentários
```javascript
// ✅ BOM
/**
 * Obter perfil do utilizador da API
 * @param {number} userId - ID do utilizador
 * @returns {Promise<Object>} Dados do perfil
 */
const fetchUserProfile = async (userId) => {
  // ...
};

// ❌ RUIM
// get user
const getProfile = async (id) => {
  // ...
};
```

---

## Estrutura de Componente Completo

### Backend (Python)
```python
# src/api/profile.py
"""Rotas para gestão de perfil do utilizador"""
from fastapi import APIRouter, HTTPException
from src.core.db import get_conn
from src.core.schemas import ProfileSchema
from src.utils.helpers import validate_email

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/{profile_id}")
def get_profile(profile_id: int):
    """Obter perfil por ID"""
    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,))
        profile = cursor.fetchone()
        conn.close()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return dict(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_profile(profile: ProfileSchema):
    """Criar novo perfil"""
    # Validação
    if not validate_email(profile.email):
        raise HTTPException(status_code=400, detail="Invalid email")
    
    # Processamento
    # ...
    
    return {"id": 1, "message": "Profile created"}
```

### Frontend (React)
```jsx
// src/pages/Profile.jsx
/**
 * Página de Perfil do Utilizador
 * Permite visualizar e editar dados pessoais
 */
import { useEffect, useState } from "react";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { validateEmail } from "../utils/helpers";
import "../pages/Profile.css";

export default function Profile() {
  const { profile, updateProfile, loading } = useApp();
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validação
    if (!validateEmail(formData.email)) {
      setError("Email inválido");
      return;
    }

    try {
      await updateProfile(formData);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!profile) return <div>Erro ao carregar perfil</div>;

  return (
    <div className="profile-container">
      <h1>Meu Perfil</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        {/* Campos */}
      </form>
    </div>
  );
}
```

---

## Checklist de Qualidade ✅

- [ ] Nomes descritivos (não abreviaturas)
- [ ] Docstrings em funções importantes
- [ ] Tratamento de erros (try/catch)
- [ ] Validação de inputs
- [ ] Sem hardcoding de valores
- [ ] Código DRY (Don't Repeat Yourself)
- [ ] Componentes pequenos e focados
- [ ] Sem console.log em produção
- [ ] Testes unitários (quando aplicável)
- [ ] Documentação atualizada
