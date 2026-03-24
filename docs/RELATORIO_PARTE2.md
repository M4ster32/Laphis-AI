# LAPHIS – Lifestyle AI Performance Health Integration System

## Trabalho Final de Curso — Licenciatura em Engenharia Informática

### Projeto II — Relatório de Implementação

**2.º Semestre**

Henrique Jesus da Silva Fernandes, a22402302

Orientador: José Braga Vasconcelos

Departamento de Engenharia Informática e Sistemas de Informação  
Universidade Lusófona, Centro Universitário do Porto (CUP)

---

## Resumo

O presente relatório constitui a segunda parte do trabalho final de curso dedicado à aplicação LAPHIS (Lifestyle AI Performance Health Integration System), dando continuidade à especificação e modelação apresentadas no relatório do Projeto I. Enquanto o primeiro relatório se focou na conceção, análise de requisitos, modelação conceptual e protótipos de interface, este segundo relatório documenta a **implementação efetiva** da aplicação, descrevendo as decisões arquiteturais tomadas, as tecnologias adotadas, as funcionalidades desenvolvidas, o estado atual do projeto e o trabalho futuro previsto.

A implementação seguiu uma abordagem incremental e modular, em conformidade com a arquitetura proposta no Projeto I. Foi desenvolvido um backend baseado em FastAPI com base de dados SQLite e um frontend em React com Vite, constituindo uma aplicação web responsiva que cobre a totalidade dos módulos funcionais identificados na especificação: gestão de perfil, geração de planos personalizados de treino e nutrição por IA, registo de atividades, acompanhamento de progresso, bem-estar mental (Modo Zen) e comunicação com um assistente inteligente.

**Palavras-chave:** Implementação, React, FastAPI, Inteligência Artificial, Fitness, Nutrição, Bem-Estar, Engenharia de Software.

---

## Abstract

This report constitutes the second part of the final course project dedicated to the LAPHIS application (Lifestyle AI Performance Health Integration System), continuing from the specification and modelling presented in the Project I report. While the first report focused on conception, requirements analysis, conceptual modelling and interface prototypes, this second report documents the **effective implementation** of the application, describing the architectural decisions taken, the technologies adopted, the developed features, the current state of the project and the planned future work.

The implementation followed an incremental and modular approach, in accordance with the architecture proposed in Project I. A backend based on FastAPI with an SQLite database and a React frontend with Vite were developed, constituting a responsive web application covering all functional modules identified in the specification: profile management, AI-powered personalised training and nutrition plan generation, activity logging, progress tracking, mental well-being (Zen Mode) and communication with an intelligent assistant.

**Keywords:** Implementation, React, FastAPI, Artificial Intelligence, Fitness, Nutrition, Well-being, Software Engineering.

---

## Índice

1. [Introdução](#1-introdução)
   - 1.1 [Contexto e Continuidade](#11-contexto-e-continuidade)
   - 1.2 [Objetivos do Projeto II](#12-objetivos-do-projeto-ii)
   - 1.3 [Estrutura do Documento](#13-estrutura-do-documento)
2. [Arquitetura e Tecnologias](#2-arquitetura-e-tecnologias)
   - 2.1 [Arquitetura Geral do Sistema](#21-arquitetura-geral-do-sistema)
   - 2.2 [Tecnologias do Backend](#22-tecnologias-do-backend)
   - 2.3 [Tecnologias do Frontend](#23-tecnologias-do-frontend)
   - 2.4 [Modelo de Dados Implementado](#24-modelo-de-dados-implementado)
3. [Funcionalidades Implementadas](#3-funcionalidades-implementadas)
   - 3.1 [Sistema de Autenticação](#31-sistema-de-autenticação)
   - 3.2 [Gestão de Perfil](#32-gestão-de-perfil)
   - 3.3 [Assistente de IA (AI Coach)](#33-assistente-de-ia-ai-coach)
   - 3.4 [Geração de Planos Personalizados](#34-geração-de-planos-personalizados)
   - 3.5 [Registo de Atividades](#35-registo-de-atividades)
   - 3.6 [Relatórios e Acompanhamento de Progresso](#36-relatórios-e-acompanhamento-de-progresso)
   - 3.7 [Modo Zen (Bem-Estar Mental)](#37-modo-zen-bem-estar-mental)
   - 3.8 [Funcionalidades Adicionais](#38-funcionalidades-adicionais)
4. [Análise de Requisitos — Estado de Implementação](#4-análise-de-requisitos--estado-de-implementação)
   - 4.1 [Requisitos Funcionais](#41-requisitos-funcionais)
   - 4.2 [Requisitos Não Funcionais](#42-requisitos-não-funcionais)
5. [Interface e Experiência do Utilizador](#5-interface-e-experiência-do-utilizador)
   - 5.1 [Design System e Identidade Visual](#51-design-system-e-identidade-visual)
   - 5.2 [Navegação e Estrutura de Ecrãs](#52-navegação-e-estrutura-de-ecrãs)
   - 5.3 [Componentes Reutilizáveis](#53-componentes-reutilizáveis)
6. [Estado Atual do Projeto](#6-estado-atual-do-projeto)
7. [Trabalho Futuro](#7-trabalho-futuro)
8. [Conclusão](#8-conclusão)
9. [Referências Bibliográficas](#9-referências-bibliográficas)

---

## 1. Introdução

### 1.1 Contexto e Continuidade

No relatório do Projeto I (1.º semestre), foi apresentada a conceção e especificação da aplicação LAPHIS, incluindo a análise do problema, o enquadramento do projeto, a análise de pertinência e viabilidade, a definição de requisitos funcionais e não funcionais, a modelação conceptual (diagramas entidade–relação, classes e componentes) e os protótipos de interface. Conforme referido na conclusão desse relatório, a implementação da aplicação foi identificada como trabalho futuro, constituindo o âmbito do presente Projeto II.

O presente relatório documenta, assim, a passagem da fase de especificação para a fase de implementação, descrevendo o processo de desenvolvimento, as decisões técnicas tomadas, as funcionalidades efetivamente construídas e o estado atual da aplicação. O objetivo é demonstrar que a solução implementada é coerente com a especificação definida no Projeto I, satisfazendo os requisitos funcionais e não funcionais identificados, e constituindo uma base funcional para evolução futura.

### 1.2 Objetivos do Projeto II

O objetivo geral do Projeto II é a **implementação funcional da aplicação LAPHIS**, transformando a especificação conceptual do Projeto I numa aplicação operacional. Os objetivos específicos são:

- Definir e implementar a arquitetura técnica do sistema, selecionando tecnologias adequadas para frontend e backend;
- Implementar o modelo de dados com base no diagrama entidade–relação proposto, adaptando-o às necessidades práticas da implementação;
- Desenvolver os módulos funcionais identificados nos requisitos: gestão de perfil, geração de planos de treino e nutrição, registo de atividades, acompanhamento de progresso, bem-estar mental e assistente de IA;
- Implementar um sistema de autenticação seguro com verificação de email;
- Desenvolver uma interface de utilizador responsiva, seguindo os princípios de usabilidade definidos nos requisitos não funcionais;
- Validar a coerência entre a implementação e a especificação original.

### 1.3 Estrutura do Documento

O presente relatório está organizado em oito capítulos. O Capítulo 1 apresenta o contexto e os objetivos. O Capítulo 2 descreve a arquitetura e as tecnologias adotadas. O Capítulo 3 detalha as funcionalidades implementadas. O Capítulo 4 mapeia o estado de implementação face aos requisitos definidos no Projeto I. O Capítulo 5 apresenta a interface e experiência do utilizador. O Capítulo 6 descreve o estado atual. O Capítulo 7 identifica o trabalho futuro. O Capítulo 8 apresenta as conclusões.

---

## 2. Arquitetura e Tecnologias

### 2.1 Arquitetura Geral do Sistema

A arquitetura da LAPHIS segue o modelo **cliente-servidor** com separação clara entre frontend e backend, em conformidade com o diagrama de componentes proposto no Projeto I. A aplicação é composta por dois módulos principais:

- **Frontend (laphis-frontend/)** — Aplicação web single-page (SPA) desenvolvida em React, responsável pela interface de utilizador, navegação e interação;
- **Backend (ai-service/)** — API RESTful desenvolvida em FastAPI (Python), responsável pela lógica de negócio, persistência de dados, autenticação e mecanismo de recomendação por IA.

A comunicação entre frontend e backend é realizada via HTTP/REST (JSON), com autenticação baseada em tokens JWT. Esta separação permite a independência entre camadas e facilita a manutenção, escalabilidade e eventual substituição de componentes.

```
┌─────────────────────────────────────────────────┐
│              Frontend (React + Vite)             │
│    SPA · React Router · Lucide Icons · Recharts  │
└────────────────────┬────────────────────────────┘
                     │  HTTP/REST (JSON)
                     │  JWT Authentication
┌────────────────────▼────────────────────────────┐
│              Backend (FastAPI)                    │
│   Routers · Schemas · Models · Recommender       │
└────────────────────┬────────────────────────────┘
                     │  SQLAlchemy ORM
┌────────────────────▼────────────────────────────┐
│              Base de Dados (SQLite)               │
│   users · profiles · plans · workout_logs · ...  │
└─────────────────────────────────────────────────┘
```

### 2.2 Tecnologias do Backend

O backend foi implementado em **Python**, utilizando as seguintes tecnologias e bibliotecas:

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **FastAPI** | 0.104.1 | Framework web assíncrono para APIs RESTful |
| **Uvicorn** | 0.24.0 | Servidor ASGI para execução da aplicação |
| **SQLAlchemy** | 2.0.23 | ORM para modelação e acesso à base de dados |
| **Pydantic** | 2.5.0 | Validação e serialização de dados (schemas) |
| **PyJWT** | — | Geração e validação de tokens JWT |
| **Passlib (Argon2)** | — | Hashing seguro de passwords |
| **SQLite** | — | Base de dados relacional embebida |

A escolha de FastAPI justifica-se pela sua performance, tipagem nativa com Pydantic, documentação automática (Swagger/OpenAPI) e facilidade de desenvolvimento. O SQLite foi selecionado pela simplicidade de configuração e pelo facto de a aplicação se encontrar em fase de desenvolvimento/protótipo, sendo facilmente substituível por PostgreSQL ou MySQL em produção.

A estrutura do backend segue uma organização modular:

```
ai-service/src/
├── main.py              # Configuração FastAPI, CORS, startup
├── config.py            # Configurações da aplicação
├── api/                 # Routers (endpoints por domínio)
│   ├── auth.py          # Autenticação (register, login, verify, reset)
│   ├── profile.py       # Gestão de perfil
│   ├── plans.py         # Geração e gestão de planos
│   ├── logs.py          # Registo de treinos e refeições
│   ├── chat.py          # Histórico de chat
│   ├── ask.py           # Endpoint de pergunta à IA
│   ├── zen.py           # Sessões de bem-estar mental
│   ├── reports.py       # Relatórios e estatísticas
│   ├── categories.py    # Categorias de planos
│   ├── water.py         # Registo de hidratação
│   └── weight.py        # Registo de peso corporal
├── core/                # Lógica central
│   ├── db.py            # Configuração SQLAlchemy/sessões
│   ├── models.py        # Modelos ORM (tabelas)
│   ├── schemas.py       # Schemas Pydantic (validação)
│   └── recommender.py   # Motor de recomendação IA
├── models/              # Modelos auxiliares
├── utils/               # Utilitários (email, helpers)
└── data/                # Ficheiros de dados (BD SQLite)
```

### 2.3 Tecnologias do Frontend

O frontend foi implementado em **JavaScript (React)**, utilizando as seguintes tecnologias:

| Tecnologia | Versão | Função |
|------------|--------|--------|
| **React** | 19.2.0 | Biblioteca para construção de interfaces |
| **React Router DOM** | 7.13.1 | Navegação SPA com rotas protegidas |
| **Vite** | 8.0.0-beta | Bundler e servidor de desenvolvimento |
| **Lucide React** | 0.577.0 | Biblioteca de ícones SVG |
| **Recharts** | 3.8.0 | Gráficos e visualizações de dados |
| **jsPDF** | 4.2.0 | Geração de relatórios em PDF |

A estrutura do frontend segue uma organização por responsabilidade:

```
laphis-frontend/src/
├── main.jsx              # Ponto de entrada
├── AppRouter.jsx         # Definição de rotas (públicas e protegidas)
├── app/
│   ├── Layout.jsx        # Layout principal (barra de navegação)
│   └── layout.css        # Estilos do layout
├── pages/                # Páginas da aplicação (15 ecrãs)
│   ├── Home.jsx          # Landing page
│   ├── Dashboard.jsx     # Painel principal
│   ├── Chat.jsx          # Assistente de IA
│   ├── Plans.jsx         # Listagem de planos
│   ├── PlanDetail.jsx    # Detalhe de um plano
│   ├── Logs.jsx          # Registo de atividades
│   ├── Reports.jsx       # Relatórios e progresso
│   ├── Profile.jsx       # Perfil do utilizador
│   ├── Zen.jsx           # Modo Zen (bem-estar)
│   ├── Settings.jsx      # Definições
│   ├── Login.jsx         # Autenticação
│   ├── Register.jsx      # Registo de conta
│   ├── VerifyEmail.jsx   # Verificação de email
│   ├── ForgotPassword.jsx # Recuperação de password
│   └── ResetPassword.jsx # Reset de password
├── components/           # Componentes reutilizáveis
│   ├── Button.jsx        # Botão parametrizável
│   ├── Card.jsx          # Card genérico
│   ├── Form.jsx          # Componentes de formulário
│   ├── Icon.jsx          # Wrapper de ícones
│   ├── Modal.jsx         # Modal genérico
│   ├── Skeleton.jsx      # Placeholder de carregamento
│   ├── Toast.jsx         # Notificações toast
│   └── AvatarPicker.jsx  # Seletor de avatares
├── contexts/             # Estado global (React Context)
│   ├── AppContext.jsx     # Dados da aplicação
│   └── ThemeContext.jsx   # Tema claro/escuro
├── hooks/                # Hooks personalizados
├── services/             # Comunicação com API
│   └── api.js            # Funções de acesso ao backend
└── utils/                # Utilitários
    ├── helpers.js         # Funções auxiliares
    └── notifications.js   # Sistema de notificações
```

### 2.4 Modelo de Dados Implementado

O modelo de dados implementado baseia-se no diagrama entidade–relação proposto no Projeto I, com adaptações práticas decorrentes da implementação. A base de dados SQLite contém as seguintes tabelas:

| Tabela | Descrição | Relação Principal |
|--------|-----------|-------------------|
| **users** | Utilizadores (email, password hash, verificação) | Central |
| **profiles** | Perfil pessoal (dados físicos, objetivo, nível, avatar) | 1:1 com users |
| **plans** | Planos de treino/nutrição (JSON estruturado) | N:1 com profiles |
| **categories** | Categorias para organização de planos | N:1 com users |
| **workout_logs** | Registo de treinos realizados | N:1 com profiles |
| **meal_logs** | Registo de refeições | N:1 com profiles |
| **water_logs** | Registo de hidratação diária | N:1 com users |
| **weight_entries** | Evolução do peso corporal | N:1 com users |
| **zen_sessions** | Sessões de meditação/respiração | N:1 com users |
| **chat_messages** | Histórico de conversa com IA | N:1 com users |

Face ao modelo proposto no Projeto I, foram adicionadas as tabelas `water_logs`, `weight_entries` e `categories`, respondendo a necessidades identificadas durante a implementação. A entidade `Utilizador` foi separada em duas tabelas (`users` para autenticação e `profiles` para dados pessoais), permitindo uma gestão mais clara entre credenciais e informação de perfil. Os planos (treino e nutrição) foram unificados numa única tabela `plans` com tipagem (`training`, `nutrition`, `combined`), simplificando a gestão e permitindo planos combinados.

---

## 3. Funcionalidades Implementadas

### 3.1 Sistema de Autenticação

Foi implementado um sistema completo de autenticação, incluindo:

- **Registo de utilizador** — Criação de conta com email e password, com hashing seguro (Argon2);
- **Verificação de email** — Envio de código de 6 dígitos por email, com expiração de 15 minutos;
- **Login com JWT** — Autenticação via tokens JWT com validade de 30 dias;
- **Recuperação de password** — Envio de código de reset por email e definição de nova password;
- **Rotas protegidas** — Componente `ProtectedRoute` no frontend que redireciona utilizadores não autenticados.

Embora o sistema de autenticação não estivesse explicitamente detalhado nos requisitos do Projeto I (por se tratar de uma especificação funcional e não técnica), a sua implementação é essencial para garantir os requisitos não funcionais de segurança (RNF-04 e RNF-05) e para suportar a individualização dos dados por utilizador.

### 3.2 Gestão de Perfil

O módulo de perfil permite ao utilizador configurar e atualizar as suas informações pessoais, em conformidade com o requisito RF-01:

- **Dados recolhidos:** Nome, idade, sexo, altura (cm), peso (kg), objetivo (perder gordura / ganhar massa / manter), nível de experiência (iniciante / intermédio / avançado), dias de treino por semana;
- **Sistema de avatares:** 10 avatares pré-definidos com ícones e gradientes únicos, mais a possibilidade de inserir um URL personalizado;
- **Operações:** Criação, consulta e atualização do perfil (padrão upsert);
- **Validação:** Regras de validação via Pydantic (idade 12–100, altura 120–230 cm, peso 35–250 kg, dias 1–7).

Os dados do perfil são utilizados por todo o sistema para personalizar planos, recomendações e relatórios.

### 3.3 Assistente de IA (AI Coach)

O assistente de IA constitui uma das funcionalidades centrais da LAPHIS, materializando a proposta de personalização contínua descrita no Projeto I. A implementação atual inclui:

- **Motor de recomendação** (`recommender.py`) — Algoritmo baseado em regras e heurísticas que analisa o perfil do utilizador e a pergunta colocada para gerar recomendações personalizadas;
- **Categorias de resposta:** Planos de treino estruturados (por frequência semanal), orientações nutricionais (cálculo de calorias, macronutrientes, planos alimentares), conselhos de suplementação, motivação e apoio, hidratação, recuperação e descanso, cálculo de IMC e métricas corporais;
- **Contextualização:** As respostas são adaptadas ao objetivo, nível, idade, peso e altura do utilizador, incluindo cálculo automático de IMC, taxa metabólica basal e necessidades calóricas;
- **Histórico de chat** — Todas as mensagens (utilizador e assistente) são persistidas na base de dados, permitindo consulta posterior e paginação;
- **Interface conversacional** — Ecrã de chat com design de mensagens, possibilidade de guardar respostas como plano, limpar histórico e acesso rápido a perguntas frequentes.

A abordagem inicial por regras e heurísticas está alinhada com o descrito na secção de viabilidade do Projeto I, que previa "recorrer inicialmente a regras e heurísticas baseadas nos dados do utilizador, evoluindo posteriormente para abordagens mais avançadas de inteligência artificial".

### 3.4 Geração de Planos Personalizados

O sistema de planos materializa os requisitos RF-02 (planos de treino), RF-03 (planos de nutrição) e parcialmente RF-04 (adaptação):

- **Tipos de plano:** Treino (`training`), Nutrição (`nutrition`) e Combinado (`combined`);
- **Geração por IA:** O utilizador pode gerar planos através do assistente de IA, que cria planos estruturados com base no perfil;
- **Armazenamento em JSON:** O conteúdo do plano é guardado em formato JSON estruturado, permitindo flexibilidade na representação;
- **Categorização:** Os utilizadores podem criar categorias personalizadas (com nome, ícone e cor) para organizar os seus planos;
- **Gestão completa:** Listagem, consulta detalhada, edição de notas/título, arquivamento e eliminação de planos;
- **Diferenciação visual:** Os planos apresentam bordas coloridas por tipo (treino: laranja, nutrição: roxo, combinado: dourado) e ícones diferenciados.

### 3.5 Registo de Atividades

O módulo de registos suporta o acompanhamento contínuo previsto nos requisitos RF-05, RF-06 e RF-08:

- **Registo de treinos:** Data, descrição, duração (minutos), calorias queimadas, notas;
- **Registo de refeições:** Data, tipo de refeição, alimentos, calorias, proteína (g), notas;
- **Registo de hidratação:** Copos de água diários, total em mililitros;
- **Registo de peso corporal:** Evolução do peso ao longo do tempo com data e notas;
- **API unificada:** Schema `UnifiedLog` que permite criar treinos e refeições através de um endpoint único, simplificando a interação frontend-backend;
- **Interface intuitiva:** Separação por abas (Treinos / Refeições) com formulários dedicados e listagem cronológica.

### 3.6 Relatórios e Acompanhamento de Progresso

O módulo de relatórios implementa o requisito RF-06 (acompanhamento contínuo), agregando dados de todas as tabelas:

- **Estatísticas globais:** Total de treinos, refeições, sessões zen, mensagens de chat;
- **Métricas de progresso:** Calorias totais queimadas, calorias consumidas, proteína total, tempo de exercício;
- **Cálculo de streaks:** Sequência de dias consecutivos com atividade registada;
- **Dados semanais:** Evolução por semana das últimas 8 semanas (treinos e refeições), apresentados em gráficos via Recharts;
- **Distribuição de humor:** Análise dos registos de mood antes e depois das sessões zen;
- **Secção de Atividade:** Planos ativos, treinos e refeições recentes, resumo de utilização;
- **4 abas temáticas:** Geral, Fitness, Zen e Atividade, cada uma com visualizações específicas;
- **Exportação PDF:** Possibilidade de gerar relatórios em formato PDF (via jsPDF).

### 3.7 Modo Zen (Bem-Estar Mental)

O Modo Zen implementa o requisito RF-07, integrando funcionalidades de bem-estar mental:

- **Tipos de sessão:** Respiração (`breathing`) e Meditação (`meditation`);
- **Registo de mood:** O utilizador pode indicar o seu estado emocional antes e depois de cada sessão (calmo, stressado, ansioso, etc.);
- **Duração flexível:** Sessões configuráveis em termos de duração;
- **Histórico completo:** Listagem das sessões realizadas, com possibilidade de consulta e eliminação;
- **Notas pessoais:** Campo livre para reflexão após cada sessão;
- **Integração com relatórios:** As sessões zen são contabilizadas nos relatórios gerais e na análise de distribuição de humor.

O Modo Zen corresponde ao "Modo Zeno" descrito nos protótipos do Projeto I, tendo sido implementado com a funcionalidade prevista de exercícios de respiração e registo de sessões de mindfulness.

### 3.8 Funcionalidades Adicionais

Para além dos módulos previstos na especificação, foram implementadas funcionalidades adicionais identificadas como necessárias durante o desenvolvimento:

- **Dashboard centralizado** — Ecrã principal com saudação personalizada (incluindo avatar), resumo de atividade diária, acesso rápido a funcionalidades principais e atalho para o assistente de IA;
- **Sistema de categorias** — Permitindo ao utilizador organizar planos em categorias personalizadas com ícone e cor;
- **Registo de hidratação** — Acompanhamento diário do consumo de água;
- **Registo de peso corporal** — Monitorização da evolução do peso ao longo do tempo;
- **Definições da aplicação** — Ecrã de configurações com gestão de categorias e preferências;
- **Landing page** — Página de apresentação da LAPHIS com informação sobre funcionalidades e apelos à ação.

---

## 4. Análise de Requisitos — Estado de Implementação

### 4.1 Requisitos Funcionais

A tabela seguinte apresenta o mapeamento entre os requisitos funcionais definidos no Projeto I e o seu estado de implementação atual:

| ID | Requisito Funcional | Prioridade | Estado | Observações |
|----|---------------------|------------|--------|-------------|
| RF-01 | Perfil pessoal (idade, objetivos, nível, disponibilidade) | Alta | ✅ Implementado | Inclui avatar, validação Pydantic |
| RF-02 | Planos de treino personalizados automáticos | Alta | ✅ Implementado | Geração via IA baseada no perfil |
| RF-03 | Planos de nutrição personalizados | Alta | ✅ Implementado | Geração via IA com cálculo calórico |
| RF-04 | Adaptação automática dos planos ao progresso | Alta | 🔄 Parcial | Regeneração manual; adaptação automática prevista para futuro |
| RF-05 | Registo de realização dos treinos | Média | ✅ Implementado | CRUD completo de workout_logs |
| RF-06 | Acompanhamento contínuo do progresso | Média | ✅ Implementado | Relatórios, streaks, gráficos semanais |
| RF-07 | Bem-estar mental (respiração, relaxamento) | Média | ✅ Implementado | Modo Zen com breathing e meditation |
| RF-08 | Visualização de rotinas semanais | Média | ✅ Implementado | Planos com vista detalhada |
| RF-09 | Personalização de preferências alimentares | Média | 🔄 Parcial | Categorias de planos; preferências detalhadas em desenvolvimento |
| RF-10 | Centralização numa única plataforma | Alta | ✅ Implementado | Todos os módulos integrados |
| RF-11 | Integração com dispositivos wearables | Baixa | ❌ Não iniciado | Previsto para fase futura |
| RF-12 | Evolução modular da aplicação | Baixa | ✅ Implementado | Arquitetura modular comprovada |

**Resumo:** Dos 12 requisitos funcionais, **9 estão totalmente implementados**, **2 estão parcialmente implementados** e **1 está previsto para fase futura** (wearables, conforme classificação de prioridade Baixa no Projeto I).

### 4.2 Requisitos Não Funcionais

| ID | Requisito Não Funcional | Categoria | Estado | Observações |
|----|------------------------|-----------|--------|-------------|
| RNF-01 | Interface simples, clara e intuitiva | Usabilidade | ✅ Satisfeito | Design minimalista premium (Apple Health/Calm) |
| RNF-02 | Navegação rápida e consistente | Usabilidade | ✅ Satisfeito | SPA com barra de navegação inferior fixa |
| RNF-03 | Tempo de resposta aceitável | Performance | ✅ Satisfeito | FastAPI assíncrono, respostas < 200ms |
| RNF-04 | Armazenamento seguro de dados pessoais | Segurança | ✅ Satisfeito | Argon2 hash, JWT, BD local |
| RNF-05 | Confidencialidade dos dados de saúde | Segurança | ✅ Satisfeito | Autenticação por token, dados por utilizador |
| RNF-06 | Arquitetura escalável para novos módulos | Escalabilidade | ✅ Satisfeito | 12 routers independentes, modular |
| RNF-07 | Compatibilidade com principais SO móveis | Portabilidade | ✅ Satisfeito | Aplicação web responsiva (qualquer browser) |
| RNF-08 | Design modular para manutenção | Manutenibilidade | ✅ Satisfeito | Separação frontend/backend, componentes reutilizáveis |

**Resumo:** Todos os 8 requisitos não funcionais são satisfeitos pela implementação atual.

---

## 5. Interface e Experiência do Utilizador

### 5.1 Design System e Identidade Visual

A interface da LAPHIS foi desenvolvida seguindo uma estética **minimalista e premium**, inspirada em aplicações de referência como Apple Health, Calm e Headspace, conforme descrito nos protótipos do Projeto I que mencionavam "estética minimalista, com cores terrosas e tons suaves, transmitindo calma, equilíbrio e bem-estar".

O design system implementado inclui:

- **Paleta cromática:** Tons terrosos e quentes — primário (#B5714D, cobre), acento (#8B7DB5, lavanda), fundo bege suave, tipografia escura;
- **Tipografia:** Sistema tipográfico hierárquico com pesos e tamanhos consistentes;
- **Ícones:** Biblioteca Lucide React (SVG, tree-shakeable) com ícones selecionados por contexto semântico;
- **Espaçamento:** Sistema de espaçamento consistente via CSS custom properties;
- **Sombras:** Sombras subtis para profundidade, sem efeitos excessivos.

### 5.2 Navegação e Estrutura de Ecrãs

A navegação implementada segue a estrutura proposta nos protótipos, com uma **barra de navegação inferior fixa** (bottom tab bar), padrão em aplicações móveis:

- **Início** (ícone Home) — Dashboard principal
- **Planos** (ícone Dumbbell) — Listagem e gestão de planos
- **AI Coach** (botão central flutuante, ícone Bot) — Assistente de IA
- **Registos** (ícone ClipboardList) — Registo de atividades
- **Perfil** (ícone User) — Perfil e avatar

Adicionalmente, o header contém acesso às **Definições** (ícone Settings). A aplicação contém **15 ecrãs** no total, cobrindo todas as funcionalidades do sistema.

### 5.3 Componentes Reutilizáveis

Foi desenvolvida uma biblioteca de componentes reutilizáveis que promovem consistência visual e facilitam a manutenção:

- **Button** — Botão parametrizável (variantes, tamanhos, estados);
- **Card** — Container genérico com estilos padronizados;
- **Form** — Componentes de formulário (inputs, selects, textareas);
- **Modal** — Janela modal com overlay e animação;
- **Toast** — Sistema de notificações (sucesso, erro, aviso, informação) com ícones contextuais;
- **Skeleton** — Placeholders de carregamento para feedback visual;
- **AvatarPicker** — Seletor de avatar com 10 presets e opção personalizada;
- **AvatarDisplay** — Componente de exibição de avatar reutilizável em todo o sistema.

---

## 6. Estado Atual do Projeto

A aplicação LAPHIS encontra-se atualmente num **estado funcional e operacional**, com os seguintes marcos alcançados:

**Backend:**
- API RESTful funcional com 12 routers e mais de 30 endpoints;
- Base de dados SQLite com 10 tabelas e migração automática;
- Sistema de autenticação completo (registo, login, verificação email, reset password);
- Motor de recomendação por IA com respostas contextualizadas;
- Servidor em execução via Uvicorn na porta 8000.

**Frontend:**
- 15 ecrãs implementados com design consistente;
- Navegação SPA com rotas protegidas;
- Integração completa com todos os endpoints da API;
- Biblioteca de componentes reutilizáveis;
- Build sem erros (verificado via Vite);
- Servidor de desenvolvimento na porta 5174.

**Qualidade:**
- Validação de dados via Pydantic em todos os endpoints;
- Tratamento de erros (HTTP exceptions, feedback visual);
- Código documentado com docstrings (Python) e estrutura organizada;
- Zero erros de build no frontend.

---

## 7. Trabalho Futuro

Apesar do progresso significativo alcançado, identificam-se as seguintes áreas para evolução futura da LAPHIS:

### Curto Prazo (Próximas Iterações)

- **Adaptação automática de planos (RF-04):** Implementar lógica que analise os registos de treino e ajuste automaticamente os planos com base no progresso, fadiga ou alteração de objetivos;
- **Preferências alimentares detalhadas (RF-09):** Adicionar módulo de preferências/restrições alimentares (vegetariano, intolerâncias, alergias) para integração na geração de planos nutricionais;
- **Evolução do motor de IA:** Migrar de regras e heurísticas para modelos de machine learning ou integração com LLMs (Large Language Models) para respostas mais sofisticadas e personalizadas;
- **Testes automatizados:** Implementar suíte de testes unitários e de integração para backend e frontend.

### Médio Prazo

- **Integração com wearables (RF-11):** Integração com APIs de dispositivos como Fitbit, Apple Watch, Garmin para recolha automática de dados de saúde (passos, frequência cardíaca, sono);
- **Aplicação móvel nativa:** Conversão para aplicação nativa (React Native ou equivalente) para distribuição via App Store e Google Play;
- **Notificações push:** Sistema de lembretes para treinos, refeições e hidratação;
- **Gamificação:** Introdução de badges, conquistas e sistema de pontos para aumentar a motivação.

### Longo Prazo

- **Comunidade e partilha:** Funcionalidades sociais para partilha de progresso e planos entre utilizadores;
- **Profissionais integrados:** Possibilidade de nutricionistas e personal trainers validarem e ajustarem planos gerados pela IA;
- **Análise preditiva:** Utilização de dados históricos para prever tendências de progresso e sugerir ajustes proativamente;
- **Monetização:** Implementação de modelo freemium com funcionalidades premium, conforme identificado na análise de oportunidade de negócio do Projeto I.

---

## 8. Conclusão

O presente relatório documenta a implementação da aplicação LAPHIS, concretizando a transição da especificação conceptual (Projeto I) para uma solução funcional e operacional (Projeto II). A implementação demonstra a viabilidade técnica da proposta apresentada, satisfazendo a maioria dos requisitos funcionais e a totalidade dos requisitos não funcionais definidos anteriormente.

A aplicação conta com um backend robusto em FastAPI com 12 módulos de API, um motor de recomendação baseado em IA, e um frontend em React com 15 ecrãs e uma experiência de utilizador cuidada e minimalista. A arquitetura modular adotada confirma a escalabilidade prevista, tendo sido possível adicionar funcionalidades não previstas inicialmente (hidratação, peso corporal, avatares, categorias) sem comprometer a coerência do sistema.

Dos 12 requisitos funcionais identificados no Projeto I, 9 foram totalmente implementados, 2 foram parcialmente implementados e 1 (integração com wearables) permanece como trabalho futuro, em conformidade com a sua classificação de prioridade baixa. Todos os 8 requisitos não funcionais são satisfeitos pela implementação atual.

O trabalho realizado valida a proposta da LAPHIS enquanto plataforma integrada de treino, nutrição e bem-estar, suportada por mecanismos de personalização baseados em IA. O projeto apresenta uma base sólida para as evoluções futuras identificadas, nomeadamente a adaptação automática de planos, a integração com wearables e a evolução do motor de inteligência artificial.

Conforme referido no Projeto I, o conceito LAPHIS e a arquitetura do sistema resultam de uma iniciativa do autor com perspetiva de aplicação em contexto real, mantendo-se a titularidade dos direitos de propriedade intelectual e a intenção de continuidade do desenvolvimento após a conclusão do ciclo de estudos.

---

## 9. Referências Bibliográficas

Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review*, 84(2), 191–215.

Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits: Human needs and the self-determination of behavior. *Psychological Inquiry*, 11(4), 227–268.

FastAPI. (2024). FastAPI documentation. https://fastapi.tiangolo.com

ISO. (2018). ISO 9241-11: Ergonomics of human-system interaction — Part 11: Usability: Definitions and concepts. International Organization for Standardization.

Lucide. (2024). Lucide Icons – Beautiful & consistent open-source icons. https://lucide.dev

McKinsey & Company. (2023). The future of digital health and wellness. https://www.mckinsey.com

Nielsen, J. (1994). *Usability engineering*. Morgan Kaufmann.

Pydantic. (2024). Pydantic V2 documentation. https://docs.pydantic.dev

Pressman, R. S., & Maxim, B. R. (2019). *Software engineering: A practitioner's approach* (9th ed.). McGraw-Hill Education.

React. (2024). React documentation. https://react.dev

SQLAlchemy. (2024). SQLAlchemy 2.0 documentation. https://docs.sqlalchemy.org

Statista. (2024). Fitness app usage worldwide. https://www.statista.com

Vite. (2024). Vite – Next generation frontend tooling. https://vitejs.dev

World Health Organization. (2022). Guidelines on physical activity and sedentary behaviour. https://www.who.int
