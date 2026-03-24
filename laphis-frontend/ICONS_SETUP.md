# 🚀 Guia Rápido — Sistema de Ícones

## O que foi criado?

✅ **Pasta de ícones**: `/src/assets/icons/`
✅ **17 ícones SVG**: dashboard, water, zen, nutrition, profile, reports, chat, weight, breathing, energize, target, fire, dumbbell, heart, apple, bell, settings
✅ **Componente Icon.jsx**: Componente reutilizável para renderizar ícones
✅ **Integração**: Layout.jsx agora usa ícones em vez de emojis

## Como Usar

### 1. Importar o Componente
```jsx
import { Icon } from "../components";
```

### 2. Renderizar um Ícone
```jsx
<Icon name="water" size={24} color="var(--accent-sport)" />
```

### 3. Substituir Emojis no Seu Código
**Antes:**
```jsx
<span>💧 Água</span>
```

**Depois:**
```jsx
<Icon name="water" size={20} /> Água
```

## Tamanhos Recomendados

- **Nav tabs**: 20px
- **Headers/Títulos**: 24-32px
- **Cards/Badges**: 16-24px
- **Small badges**: 14px

## Cores

Use uma destas opções:
```jsx
<Icon name="zen" color="var(--accent-zen)" />           {/* Tema atual */}
<Icon name="water" color="#B5714D" />                   {/* Hex */}
<Icon name="nutrition" color="currentColor" />          {/* Herda cor pai */}
```

## Próximos Passos

1. **Ir buscar mais ícones** (adicione mais SVGs em `/src/assets/icons/`)
2. **Substituir emojis** em Dashboard.jsx, Zen.jsx, Plans.jsx, etc.
3. **Customizar ícones** — edite os ficheiros SVG diretamente

## Ficheiros Modificados

- `/src/assets/icons/` — Pasta com todos os SVGs (NOVA)
- `/src/components/Icon.jsx` — Componente (NOVO)
- `/src/components/index.js` — Exports (ACTUALIZADO)
- `/src/app/Layout.jsx` — Usa ícones agora (ACTUALIZADO)

## Onde Substituir Emojis Next?

Vê o ficheiro `/src/assets/icons/README.md` para lista completa de ícones e exemplos de uso!
