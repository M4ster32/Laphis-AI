# 📊 GUIÃO DE APRESENTAÇÃO — LAPHIS

**Data:** 11 de Março de 2026  
**Duração estimada:** 15-20 minutos

---

## 🎯 ESTRUTURA RECOMENDADA

```
1. INTRODUÇÃO (2 min)
   ↓
2. O QUE É O LAPHIS? (2 min)
   ↓
3. DEMONSTRAÇÃO PRÁTICA (5 min)
   ↓
4. ARQUITETURA TÉCNICA (4 min)
   ↓
5. DECISÕES IMPLEMENTADAS (4 min)
   ↓
6. ROADMAP MOBILE (2 min)
   ↓
7. CONCLUSÃO (1 min)
```

---

# 1️⃣ INTRODUÇÃO (2 min)

### 💬 O que dizer:

"Olá! Sou o [nome] e trago-vos o **LAPHIS** — uma aplicação web de coaching fitness e nutrição com inteligência artificial.

**O objetivo?** Criar um personal trainer e nutricionista 24/7 acessível a qualquer pessoa, que dá recomendações personalizadas baseadas no perfil individual."

### 📊 Dados para mencionar:
- **Tech Stack moderno:** React 19 + FastAPI + SQLite
- **Totalmente responsivo:** Funciona perfeitamente em telemóvel
- **Segurança:** Autenticação JWT + Argon2 hash

---

# 2️⃣ O QUE É O LAPHIS? (2 min)

### 💭 Estrutura para explicar:

**"O LAPHIS resolve 4 problemas principais:"**

| Problema | Solução LAPHIS |
|----------|---|
| 💰 Personal trainers são caros | IA oferece coaching grátis |
| ⏰ Acesso limitado a especialistas | 24/7 disponível |
| 🎯 Planos genéricos não funcionam | Personalizados ao utilizador |
| 📊 Sem acompanhamento | Regista progresso e evolução |

### 🔄 Fluxo de utilizador:

```
1. REGISTO
   └─ Email + Password
   └─ Verificação (código de 6 dígitos)
   
2. PERFIL
   └─ Dados pessoais (idade, peso, altura, sexo)
   └─ Objetivo (perder gordura, ganhar massa, manter)
   └─ Nível (iniciante, intermédio, avançado)
   └─ Dias/semana disponíveis
   
3. CHAT COM IA
   └─ Faz perguntas sobre treino, nutrição, lesões, etc.
   └─ IA responde baseada no perfil
   └─ Pode guardar respostas como planos permanentes
   
4. DASHBOARD
   └─ Vê estatísticas (treinos, calorias, streak)
   └─ Acompanha progresso
   
5. REGISTOS
   └─ Treinos: data, duração, calorias, notas
   └─ Refeições: calorias, proteína, alimentos
   └─ Água: copos bebidos
   └─ Peso: evolução corporal
```

---

# 3️⃣ DEMONSTRAÇÃO PRÁTICA (5 min)

### 📱 O QUE MOSTRAR (sim, em tempo real!):

**1. Registo e Verificação (1 min)**
   - Clica em "Registar"
   - Insere email de teste e password
   - **MOSTRA:** Email de verificação chega ao console (em dev mode)
   - Insere código de 6 dígitos
   - ✅ Conta criada!

**2. Preenchimento de Perfil (1 min)**
   - Preenche dados pessoais
   - Seleciona objetivo e nível (visuais bonitos com cards)
   - Vê IMC calculado em tempo real
   - Confirma criação

**3. Chat com IA (2 min)**
   - Faz pergunta: _"Qual é o melhor treino para perder gordura rápido?"_
   - **MOSTRA:** IA responde contextualizadamente (com cálculos TDEE, splits, etc.)
   - Clica em "Guardar como Plano"
   - Plano fica guardado na secção "Planos"

**4. Dashboard (1 min)**
   - Mostra cards de estatísticas
   - Comenta sobre o que cada um significa
   - Navega pelas abas (Home → Chat → Planos → Dashboard → Perfil)

---

# 4️⃣ ARQUITETURA TÉCNICA (4 min)

## 🏗️ Diagrama de Arquitetura:

```
┌──────────────────┐
│   BROWSER        │
│  (React 19)      │
│  Vite 5173       │
└────────┬─────────┘
         │ REST API
         │ JSON
         │
┌────────▼─────────────────────┐
│  BACKEND (FastAPI)           │
│  Python 3.12 — port 8000     │
│                              │
│  ├─ /auth (Login/Register)   │
│  ├─ /chat (IA responses)     │
│  ├─ /profile (User data)     │
│  ├─ /plans (CRUD)            │
│  ├─ /logs (Treinos/Refeições)│
│  └─ /reports (Estatísticas)  │
└────────┬─────────────────────┘
         │ SQLAlchemy ORM
         │
┌────────▼─────────────────────┐
│  DATABASE (SQLite)           │
│  laphis.db                   │
│                              │
│  Tabelas:                    │
│  • users                     │
│  • profiles                  │
│  • chat_messages             │
│  • plans                     │
│  • workout_logs              │
│  • meal_logs                 │
│  • water_logs                │
│  • weight_entries            │
│  • categories                │
└──────────────────────────────┘
```

### 🔐 Fluxo de Autenticação:

```
REGISTO:
1. Utilizador envia email + password
2. Backend gera código de 6 dígitos
3. Código enviado por EMAIL (via Gmail SMTP)
4. Utilizador insere código na app
5. Backend valida código
6. Marca email_verified = 1
7. JWT token retornado

LOGIN:
1. Utilizador envia email + password
2. Backend verifica password (Argon2)
3. JWT token criado (exp: 30 dias)
4. Token guardado em localStorage
5. Cada request inclui token no header Authorization

LOGOUT:
1. Frontend limpa localStorage
2. Token expirado automaticamente em 30 dias
```

---

## 💾 Estrutura da Base de Dados:

### Tabela `users`:
```
id (PK)
email (UNIQUE)
password_hash (Argon2)
goal
email_verified (0/1)
verification_code
verification_code_expires
reset_code
reset_code_expires
created_at
```

**Porquê esta estrutura?**
- `email_verified`: Previne spam/contas fake
- `verification_code + expires`: Segurança (código caduca em 15 min)
- `reset_code`: Recuperação de password segura
- `created_at`: Auditoria e estatísticas

---

### Tabela `profiles`:
```
id (PK)
user_id (FK → users)
name
age
sex (masculino/feminino/outro)
height_cm
weight_kg
goal (perder_gordura/ganhar_massa/manter)
level (iniciante/intermedio/avancado)
days_per_week
```

**Porquê separada de `users`?**
- 1:1 relationship permite **múltiplos perfis por utilizador** no futuro
- Dados de treino/nutrição isolados de autenticação
- Melhor normalização da BD

---

### Tabelas `workout_logs` e `meal_logs`:
```
workout_logs:
├─ id (PK)
├─ profile_id (FK)
├─ date (YYYY-MM-DD)
├─ description
├─ duration_min
├─ calories
├─ notes
└─ created_at

meal_logs:
├─ id (PK)
├─ profile_id (FK)
├─ date (YYYY-MM-DD)
├─ meal (tipo: pequeno-almoço, almoço, etc)
├─ foods
├─ calories
├─ protein_g
├─ notes
└─ created_at
```

**Porquê assim?**
- Histórico completo do utilizador
- Permite dashboards e relatórios
- Análise de progresso ao longo do tempo

---

# 5️⃣ DECISÕES IMPLEMENTADAS

## 📧 Como funciona a VERIFICAÇÃO DE EMAIL

### 🤔 O Problema:
_"A app está offline (não tem SMTP Gmail configurado), então como verificar emails?"_

### ✅ A Solução:

**Em DEV MODE (desenvolvimento — sem credenciais SMTP):**

```python
# No ficheiro email.py, função _send_email():

if DEV_MODE:  # Sem SMTP_EMAIL/PASSWORD configuradas
    print("\n" + "="*60)
    print("📧 EMAIL (DEV MODE)")
    print(f"   Para: {to_email}")
    print(f"   Código: {code}")
    print("="*60 + "\n")
    return True
```

**O que acontece:**
1. ✅ Utilizador faz **registo** com email + password
2. ✅ Backend **gera código de 6 dígitos** (ex: 482917)
3. ✅ Backend **printa o código na consola** (em vez de enviar email)
4. ✅ Utilizador **copia o código** da consola
5. ✅ Insere o código na app → Email verificado!

### 📋 Código de Verificação (ficheiro email.py):

```python
def generate_code(length: int = 6) -> str:
    """Gera código numérico aleatório (ex: 482917)"""
    return "".join(random.choices(string.digits, k=length))

def send_verification_email(to_email: str, code: str) -> bool:
    """
    Em DEV_MODE: printa no console
    Em PRODUÇÃO: envia via Gmail SMTP
    """
    subject = "🔐 LAPHIS — Verifica o teu email"
    
    # Template HTML bonito...
    
    return _send_email(to_email, subject, html)
```

### 🚀 Para PRODUÇÃO:

Se quisermos enviar emails reais, é só configurar variáveis de ambiente:

```bash
export SMTP_EMAIL="teu-email@gmail.com"
export SMTP_PASSWORD="xxxx xxxx xxxx xxxx"  # App Password do Gmail
```

Depois:
```python
# email.py detecta automaticamente as credenciais
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
DEV_MODE = not SMTP_EMAIL or not SMTP_PASSWORD

# Se DEV_MODE = False → envia por Gmail!
```

**O flow em produção:**
1. Utilizador regista → código gerado
2. Email enviado via Gmail SMTP
3. Utilizador recebe email com código bonito
4. Insere código → email verificado ✅

---

## 🔔 Como funcionam as NOTIFICAÇÕES

### ℹ️ Status atual:
_"No momento, não temos notificações push automáticas. Mas temos uma arquitetura preparada para adicionar."_

### 📋 O que temos:

**1. Chat em Tempo Real (bidireccional):**
   - Utilizador escreve → mensagem vai ao backend
   - Backend processa com IA
   - Resposta enviada de volta em JSON
   - Frontend renderiza imediatamente

**2. Toast Notifications (avisos visuais):**
   ```javascript
   // src/utils/notifications.js
   
   export const showNotification = (message, type) => {
     // toast.success("Plano guardado com sucesso!")
     // toast.error("Erro ao guardar plano")
     // toast.info("Carregando IA...")
   }
   ```

**3. Estado visual (loading spinners):**
   - Enquanto IA está a processar → spinner
   - Quando pronto → resposta mostra

### 🚀 Como adicionar notificações Push (para mobile):

Quando passar para app mobile, podemos adicionar:

```javascript
// Service Worker + Web Push API
// ou
// Firebase Cloud Messaging (FCM)

// Exemplo: Notificar quando meta de água diária atingida
if (water_intake >= daily_goal) {
  showNotification("🎉 Meta de água atingida!");
  // Também enviar push notification ao telemóvel
}
```

---

## 🎨 Interface e UX

### 📱 Mobile-First Design:

```css
/* CSS Custom Properties para theme consistente */
:root {
  --primary: #2E7D32      /* Verde fitness */
  --secondary: #9B6A4A    /* Castanho dourado */
  --danger: #D32F2F       /* Vermelho */
  --success: #388E3C      /* Verde escuro */
  --text-primary: #1A1A1A
  --bg-light: #F5F5F5
}

/* Layouts responsivos */
@media (max-width: 600px) {
  /* Mobile */
}

@media (min-width: 601px) and (max-width: 1024px) {
  /* Tablet */
}

@media (min-width: 1025px) {
  /* Desktop */
}
```

### 🎬 Animações incluídas:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

# 6️⃣ ROADMAP PARA MOBILE (2 min)

### 🎯 Estratégia de Migração:

**Opção 1: React Native (RECOMENDADO)**

```
├─ Reutiliza componentes React
├─ Código JavaScript/TypeScript
├─ Funciona em iOS + Android
├─ Tempo desenvolvimento: 2-3 semanas

Passos:
1. Setup: npx create-expo-app laphis-mobile
2. Mover lógica compartilhada para /shared
3. Adaptar UI para mobile (Expo components)
4. Testar em iOS/Android
```

**Opção 2: Flutter**

```
├─ Performance superior
├─ UI mais nativa
├─ Linguagem: Dart
├─ Tempo desenvolvimento: 3-4 semanas

Diferenças:
• Reescrever componentes em Dart
• Melhor integração com SO
```

### 📦 O que muda no backend:

**NADA!** 🎉

O backend REST fica exatamente igual. A app mobile comunica com os mesmos endpoints:

```
Mobile App ──┐
             │ REST API
Web App ─────┤ (FastAPI)
             │
Desktop ─────┘

Mesmos endpoints:
GET    /auth/login
POST   /auth/register
POST   /auth/verify-email
GET    /profile
POST   /chat
GET    /plans
POST   /logs/workout
```

### 📱 Capabilidades mobile exclusivas:

```javascript
// Camera: tirar fotos de refeições
// Location: GPS para atividades
// Notifications: Push notifications
// Offline support: Sincronizar quando online
// Biometric auth: Face ID / Touch ID
```

### 📊 Exemplo de implementação em React Native:

```javascript
// laphis-mobile/src/screens/ChatScreen.jsx

import { View, TextInput, FlatList } from 'react-native';
import { useApp } from '../hooks/useApp';

export default function ChatScreen() {
  const { messages, sendMessage, loading } = useApp();
  
  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => <ChatBubble message={item} />}
        keyExtractor={item => item.id}
      />
      <TextInput
        placeholder="Fala com a IA..."
        onSubmitEditing={(e) => sendMessage(e.nativeEvent.text)}
      />
    </View>
  );
}
```

---

# 7️⃣ RESUMO EXECUTIVO (para fichas de dados)

| Aspeto | Detalhes |
|--------|----------|
| **Nome** | LAPHIS |
| **O quê?** | Coaching fitness + nutrição com IA |
| **Para quem?** | Pessoas que querem treino/nutrição personalizados |
| **Como?** | Chat conversacional + recomendações baseadas no perfil |
| **Stack** | React 19 + FastAPI + SQLite |
| **Segurança** | JWT + Argon2 + Email verification |
| **Responsive?** | Sim, mobile-first |
| **IA** | Integração preparada para OpenAI/Claude |
| **Próximo passo** | Mobile app (React Native) |
| **Roadmap** | v2 com notificações push, IA avançada, integrações |

---

# 📌 DICAS PARA A APRESENTAÇÃO

### ✅ Fazer bem:
- ✅ Começar com o **problema** (pessoas não têm acesso a personal trainers)
- ✅ Mostrar **demonstração prática** (mais valioso que slides)
- ✅ Explicar **arquitetura com diagramas** (draw no whiteboard se necessário)
- ✅ Mencionar **decisões técnicas** (por que escolhemos X em vez de Y)
- ✅ Terminar com **roadmap** (o que vem a seguir)

### ❌ Evitar:
- ❌ Entrar em detalhes técnicos muito profundos (save para Q&A)
- ❌ Mostrar código-fonte (foca em funcionalidade)
- ❌ Falar de coisas que NÃO FUNCIONAM ainda
- ❌ Ser muito rápido (deixa tempo para perguntas)

### 🎤 Possíveis perguntas e respostas:

**P: "Como é que a IA sabe o que recomendar?"**  
R: "A IA usa o perfil do utilizador (objetivo, nível, dias/semana) para contextualize as recomendações. Por exemplo, um iniciante que quer perder gordura 3x/semana recebe planos diferentes de um avançado que quer ganhar massa 6x/semana."

**P: "E se o utilizador não verificar o email?"**  
R: "O utilizador fica com acesso limitado. Pode usar a app, mas é incentivado a verificar o email. Em produção, o código caduca em 15 minutos."

**P: "Quanto tempo levou a fazer?"**  
R: "[resposta honesta] X semanas, desde design até à versão pronta para apresentar."

**P: "Qual é o diferencial em relação aos competitors?"**  
R: "A personalização é muito profunda — não é um plano genérico. Além disso, é 100% em português, com interface muito user-friendly."

**P: "Isso é escalável? Quantos utilizadores suporta?"**  
R: "SQLite é um pouco limitado, mas para validar a ideia é mais que suficiente. Em produção, mudávamos para PostgreSQL e adicionávamos cache (Redis)."

---

# 🎬 ROTEIRO PASSO A PASSO (15 min)

```
[0:00-1:00]   Introdução + problema
[1:00-2:00]   O que é LAPHIS (valor proposto)
[2:00-7:00]   🔴 LIVE DEMO
              • Registo + verificação
              • Preenchimento de perfil
              • Chat com IA
              • Guardar como plano
              • Dashboard
[7:00-11:00]  Arquitetura técnica
              • Diagrama cliente/servidor
              • Fluxo de autenticação
              • Estrutura BD
[11:00-15:00] Decisões técnicas
              • Email verification (DEV vs PROD)
              • Notificações (atual + futuro)
              • UI/UX mobile-first
[15:00-17:00] Roadmap mobile
              • React Native vs Flutter
              • O que muda no backend
              • Capabilidades novas
[17:00-20:00] Conclusão + Q&A
```

---

**Boa sorte na apresentação! 🚀**

*Última actualização: 11 de Março de 2026*
