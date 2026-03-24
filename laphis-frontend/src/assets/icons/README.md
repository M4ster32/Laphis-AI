# 🎨 Sistema de Ícones LAPHIS

## Localização
Os ícones SVG estão em `/src/assets/icons/`

## Ícones Disponíveis

| Nome | Uso |
|------|-----|
| `dashboard` | Dashboard principal |
| `water` | Hidratação / Água |
| `zen` | Meditação / Respiração |
| `nutrition` | Nutrição / Comida |
| `profile` | Perfil do utilizador |
| `reports` | Relatórios |
| `chat` | Chat / AI Coach |
| `weight` | Peso / Balança |
| `breathing` | Exercícios de respiração |
| `energize` | Energia / Força |
| `target` | Alvo / Meta |
| `fire` | Intensidade / Calorias |
| `dumbbell` | Exercício / Treino |
| `heart` | Saúde / Bem-estar |
| `apple` | Alimento / Snack |
| `bell` | Notificações |
| `settings` | Configurações |

## Como Usar

### Componente Icon

```jsx
import { Icon } from "../components";

// Uso básico
<Icon name="water" size={24} color="var(--accent-sport)" />

// Com cor customizada
<Icon name="zen" size={32} color="#B5714D" />

// Com classe CSS
<Icon name="dashboard" size={20} color="currentColor" className="my-icon" />
```

### Propriedades

- `name` (string, obrigatório): Nome do ícone (ver tabela acima)
- `size` (number, default: 24): Tamanho em pixels
- `color` (string, default: "currentColor"): Cor (hex, rgb, var(--), etc.)
- `className` (string, default: ""): Classes CSS adicionais

### Funções Auxiliares

```jsx
import { getIconSrc, listAvailableIcons } from "../components";

// Obter caminho do ícone
const src = getIconSrc("zen");

// Listar todos os ícones disponíveis
const icons = listAvailableIcons();
// Retorna: ["dashboard", "water", "zen", ...]
```

## Adicionar Novos Ícones

1. Crie o ficheiro `.svg` em `/src/assets/icons/`
2. Importe em `Icon.jsx`:
   ```jsx
   import myIcon from "../assets/icons/my-icon.svg";
   ```
3. Adicione ao objeto `ICONS`:
   ```jsx
   const ICONS = {
     // ... existing icons
     myIcon: myIcon,
   };
   ```
4. Use no seu código:
   ```jsx
   <Icon name="myIcon" size={24} />
   ```

## Exemplo Completo

### Antes (com Emoji)
```jsx
<button>
  <span>🧘</span>
  <span>Zen</span>
</button>
```

### Depois (com Ícones)
```jsx
import { Icon } from "../components";

<button>
  <Icon name="zen" size={20} color="var(--accent-zen)" />
  <span>Zen</span>
</button>
```

## Estilo SVG

Todos os SVGs seguem as mesmas convenções:
- `stroke="currentColor"` para herdar cor do elemento pai
- `stroke-width="2"` para consistência
- Viewbox padrão: `0 0 24 24` (format padrão)
- Sem preenchimento (fill="none") — design minimalista

Você pode customizar qualquer SVG editando diretamente o ficheiro `.svg`
