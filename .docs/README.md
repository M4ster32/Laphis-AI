# 📚 Documentação do Projeto LAPHIS

## Índice

### 🎯 Começar Aqui
1. **[Mapa Mental](./00-mapa-mental.md)** - Visão geral rápida do projeto
   - O que é LAPHIS
   - Arquitetura em 3 camadas
   - Fluxo típico de uso
   - Comandos essenciais

### 📁 Estrutura e Organização
2. **[Estrutura de Pastas](./01-estrutura-pastas.md)** - Guia detalhado de cada pasta
   - O que cada pasta contém
   - Por que está organizada assim
   - Fluxo de dados entre componentes

### 📝 Código e Boas Práticas
3. **[Convenções de Código](./02-convencoes-codigo.md)** - Padrões a seguir
   - Nomenclatura (Python e JavaScript)
   - Estrutura de componentes
   - Exemplos de código bom vs ruim
   - Checklist de qualidade

### 🚀 Setup e Execução
4. **[Setup e Execução](./03-setup-execucao.md)** - Como configurar e rodar
   - Pré-requisitos
   - Setup inicial
   - Executar em desenvolvimento
   - Troubleshooting

### 📊 Documentação Original do Projeto
- `docs/01-visao.md` - Visão do produto
- `docs/02-ai-rules.md` - Regras do sistema de IA
- `docs/03-data-model.md` - Modelo de dados
- `docs/04-imprevistos.md` - Problemas conhecidos

---

## 🎓 Guias Rápidos

### Para Iniciantes
1. Ler: [Mapa Mental](./00-mapa-mental.md)
2. Setup: [Setup e Execução](./03-setup-execucao.md)
3. Explorar o código

### Para Desenvolvimento
1. Entender: [Estrutura de Pastas](./01-estrutura-pastas.md)
2. Seguir: [Convenções de Código](./02-convencoes-codigo.md)
3. Código novo deve estar organizado conforme a estrutura

### Para Troubleshooting
- Ver seção "Troubleshooting" em [Setup e Execução](./03-setup-execucao.md)
- Ou ver "Mapa Mental" → Troubleshooting Rápido

---

## 🗂️ Estrutura Visual

```
.docs/
├── 00-mapa-mental.md              ← Comece aqui
├── 01-estrutura-pastas.md         ← Depois aqui
├── 02-convencoes-codigo.md        ← Referência para código
├── 03-setup-execucao.md           ← Setup e troubleshooting
└── README.md                       ← Este ficheiro

docs/                              ← Documentação original
├── 01-visao.md
├── 02-ai-rules.md
├── 03-data-model.md
└── 04-imprevistos.md
```

---

## ✅ Checklist de Compreensão

Depois de ler a documentação, você deve ser capaz de:

- [ ] Explicar o que é LAPHIS e como funciona
- [ ] Navegar facilmente entre as pastas do projeto
- [ ] Saber onde adicionar novo código (qual pasta/ficheiro)
- [ ] Seguir as convenções de código do projeto
- [ ] Setup e executar o projeto localmente
- [ ] Resolver problemas básicos (portas em uso, dependências, etc)
- [ ] Entender o fluxo Frontend → API → Database

---

## 🔗 Links Importantes

- **Repositório**: `/home/m4ster/Laphis`
- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

---

## 💡 Dicas

1. **Sempre ativar o ambiente virtual Python antes de trabalhar no backend**
   ```bash
   source /home/m4ster/Laphis/.venv/bin/activate
   ```

2. **Manter dois terminais abertos**: um para backend, um para frontend

3. **Usar `/docs` da API para testar endpoints**
   ```
   http://localhost:8000/docs
   ```

4. **Lê os comentários nos ficheiros** - costumam ter explicações úteis

5. **Quando adicionar nova funcionalidade, siga a estrutura existente**

---

## 📞 Dúvidas Frequentes

**P: Onde devo adicionar uma nova página?**
A: Em `laphis-frontend/src/pages/`

**P: Onde adicionar um novo endpoint da API?**
A: Em `ai-service/src/api/` (cria novo ficheiro ou adiciona a um existente)

**P: Onde colocar funções auxiliares?**
A: Em `src/utils/` (backend ou frontend conforme apropriado)

**P: Como colocar componentes reutilizáveis?**
A: Em `laphis-frontend/src/components/`

**P: Como fazer a BD funcionar?**
A: Execute `uvicorn src.main:app --reload` uma vez - cria a BD automaticamente

---

## 🚀 Próximos Passos

1. Ler a documentação (comece pelo Mapa Mental)
2. Setup o projeto (ver Setup e Execução)
3. Explorar o código existente
4. Começar a adicionar funcionalidades
5. Manter as convenções de código

---

**Última atualização**: 26 de fevereiro de 2026
**Versão do Projeto**: 0.1.0
