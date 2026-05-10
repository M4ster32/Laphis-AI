/**
 * MonsterLogo — mascote LAPHIS em estilo outline/stick.
 * Corpo oval, dois cornos, olhos, sorriso dentado, braços.
 */
export default function MonsterLogo({ size = 32, color = "currentColor", strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      {/* Corpo */}
      <ellipse cx="16" cy="21" rx="10.5" ry="9.5" />

      {/* Corno esquerdo */}
      <path d="M9 13 L6 3 L13 11" />

      {/* Corno direito */}
      <path d="M23 13 L26 3 L19 11" />

      {/* Sobrancelhas (expressão feroz) */}
      <path d="M10.5 16 L14 15" strokeWidth={strokeWidth * 0.85} />
      <path d="M18 15 L21.5 16" strokeWidth={strokeWidth * 0.85} />

      {/* Olhos (pontos sólidos) */}
      <circle cx="12" cy="19.5" r="1.8" fill={color} stroke="none" />
      <circle cx="20" cy="19.5" r="1.8" fill={color} stroke="none" />

      {/* Sorriso dentado */}
      <path d="M10 24.5 L12.5 22 L16 24.5 L19.5 22 L22 24.5" />

      {/* Braço esquerdo */}
      <line x1="5.5" y1="21" x2="8.5" y2="22.5" />

      {/* Braço direito */}
      <line x1="26.5" y1="21" x2="23.5" y2="22.5" />

      {/* Mãos */}
      <circle cx="4.5" cy="20.5" r="1.3" fill={color} stroke="none" />
      <circle cx="27.5" cy="20.5" r="1.3" fill={color} stroke="none" />
    </svg>
  );
}
