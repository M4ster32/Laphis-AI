/**
 * StickmanAnimations.jsx
 *
 * Animacoes SVG de "stickman" para exercicios — sem fotografias de pessoas,
 * apenas figuras esquematicas (cabeca + tronco + membros) que ilustram o
 * movimento. Cada animacao e um subgrafo SVG auto-contido, com SMIL.
 *
 * Uso:
 *   const Anim = resolveStickmanAnimation(name, category);
 *   <svg viewBox="0 0 200 200"><Anim accent="#fff" /></svg>
 *
 * Resolucao:
 *   1) match exato pelo nome normalizado (PT/EN)
 *   2) match por substring no mapa PT_TO_KEY
 *   3) fallback por categoria (peito → bench_press, costas → row, etc.)
 *   4) default (jumping jacks)
 */

// ==========================================================================
// PRIMITIVAS GRAFICAS
// ==========================================================================

const STROKE_W = 4;

/** Circulo simples para cabecas e juntas. */
function Joint({ cx, cy, r = 7, fill }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} />;
}

/** Linha grossa para membros (com cap arredondado). */
function Limb({ x1, y1, x2, y2, color, w = STROKE_W }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
}

/** Halter pequeno para varios exercicios de bracos. */
function MiniDumbbell({ x, y, scale = 1, color, rotation = 0 }) {
  const w = 18 * scale;
  const r = 5 * scale;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <rect
        x={-w / 2}
        y={-1.5}
        width={w}
        height={3}
        rx={1.5}
        fill={color}
      />
      <circle cx={-w / 2} cy={0} r={r} fill={color} />
      <circle cx={w / 2} cy={0} r={r} fill={color} />
    </g>
  );
}

/** Barra olimpica com discos. */
function Barbell({ x, y, scale = 1, color, rotation = 0 }) {
  const w = 90 * scale;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <rect
        x={-w / 2}
        y={-2}
        width={w}
        height={4}
        rx={2}
        fill={color}
      />
      <rect
        x={-w / 2 - 5}
        y={-12}
        width={5}
        height={24}
        rx={2}
        fill={color}
      />
      <rect
        x={w / 2}
        y={-12}
        width={5}
        height={24}
        rx={2}
        fill={color}
      />
    </g>
  );
}

/** Chao / linha de referencia. */
function Floor({ y = 175, color, opacity = 0.3 }) {
  return (
    <line
      x1={10}
      y1={y}
      x2={190}
      y2={y}
      stroke={color}
      strokeWidth={2}
      opacity={opacity}
    />
  );
}

// ==========================================================================
// ANIMACOES (cada uma e uma <g> auto-contida)
// ==========================================================================

/** SUPINO — deitado, bracos a empurrar barra para cima. */
function BenchPress({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Banco */}
      <rect x="35" y="125" width="120" height="6" rx="2" fill={accent} opacity="0.5" />
      <rect x="42" y="131" width="6" height="20" fill={accent} opacity="0.4" />
      <rect x="142" y="131" width="6" height="20" fill={accent} opacity="0.4" />

      {/* Stickman deitado de costas */}
      <Joint cx={45} cy={115} fill={accent} />
      {/* Tronco horizontal */}
      <Limb x1={51} y1={117} x2={130} y2={120} color={accent} />
      {/* Pernas dobradas para baixo */}
      <Limb x1={130} y1={120} x2={148} y2={140} color={accent} />
      <Limb x1={148} y1={140} x2={155} y2={155} color={accent} />
      <Limb x1={130} y1={120} x2={142} y2={142} color={accent} />
      <Limb x1={142} y1={142} x2={150} y2={155} color={accent} />

      {/* Bracos + barra que sobe e desce */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 18; 0 0"
          dur="2.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        {/* Bracos a apontar para cima */}
        <Limb x1={85} y1={117} x2={85} y2={75} color={accent} />
        <Limb x1={95} y1={117} x2={95} y2={75} color={accent} />
        {/* Barra horizontal */}
        <Barbell x={90} y={70} scale={0.85} color={accent} />
      </g>
    </g>
  );
}

/** SUPINO INCLINADO — banco em angulo, mesma logica. */
function InclineBench({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Banco inclinado */}
      <rect
        x="50"
        y="105"
        width="100"
        height="6"
        rx="2"
        fill={accent}
        opacity="0.5"
        transform="rotate(-22 100 108)"
      />
      <rect x="60" y="135" width="6" height="30" fill={accent} opacity="0.4" />
      <rect x="135" y="115" width="6" height="50" fill={accent} opacity="0.4" />

      {/* Stickman inclinado */}
      <g transform="rotate(-22 100 110)">
        <Joint cx={55} cy={97} fill={accent} />
        <Limb x1={61} y1={99} x2={140} y2={102} color={accent} />
        <Limb x1={140} y1={102} x2={156} y2={120} color={accent} />
        <Limb x1={156} y1={120} x2={162} y2={138} color={accent} />
        <Limb x1={140} y1={102} x2={150} y2={122} color={accent} />
        <Limb x1={150} y1={122} x2={158} y2={138} color={accent} />

        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 16; 0 0"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={90} y1={98} x2={90} y2={58} color={accent} />
          <Limb x1={100} y1={98} x2={100} y2={58} color={accent} />
          <Barbell x={95} y={54} scale={0.85} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** FLEXOES — prancha, corpo desce e sobe. */
function PushUp({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 12; 0 0"
          dur="2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        {/* Cabeca */}
        <Joint cx={45} cy={120} fill={accent} />
        {/* Corpo em prancha */}
        <Limb x1={51} y1={122} x2={155} y2={132} color={accent} />
        {/* Bracos verticais */}
        <Limb x1={70} y1={122} x2={70} y2={170} color={accent} />
        <Limb x1={80} y1={123} x2={80} y2={170} color={accent} />
        {/* Pernas estendidas */}
        <Limb x1={155} y1={132} x2={175} y2={170} color={accent} />
        <Limb x1={155} y1={132} x2={170} y2={170} color={accent} />
      </g>
    </g>
  );
}

/** PRESS MILITAR — em pe, bracos empurram barra acima da cabeca. */
function OverheadPress({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Stickman de pe */}
      <Joint cx={100} cy={70} fill={accent} />
      <Limb x1={100} y1={77} x2={100} y2={130} color={accent} />
      <Limb x1={100} y1={130} x2={88} y2={170} color={accent} />
      <Limb x1={100} y1={130} x2={112} y2={170} color={accent} />

      {/* Bracos + barra que sobe (de altura do peito ate acima da cabeca) */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -32; 0 0"
          dur="2.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Limb x1={85} y1={85} x2={75} y2={75} color={accent} />
        <Limb x1={115} y1={85} x2={125} y2={75} color={accent} />
        <Barbell x={100} y={70} scale={0.95} color={accent} />
      </g>
    </g>
  );
}

/** ROSCA / CURL — em pe, antebraco roda do lado para o ombro. */
function BicepCurl({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Stickman base */}
      <Joint cx={100} cy={60} fill={accent} />
      <Limb x1={100} y1={67} x2={100} y2={120} color={accent} />
      <Limb x1={100} y1={120} x2={88} y2={170} color={accent} />
      <Limb x1={100} y1={120} x2={112} y2={170} color={accent} />
      {/* Bracos superiores fixos (descem do ombro ao cotovelo) */}
      <Limb x1={88} y1={75} x2={84} y2={108} color={accent} />
      <Limb x1={112} y1={75} x2={116} y2={108} color={accent} />

      {/* Antebraco esquerdo + halter — rotaciona no cotovelo */}
      <g transform="translate(84 108)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -120; 0"
            dur="2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={0} y2={28} color={accent} />
          <MiniDumbbell x={0} y={32} scale={1} color={accent} />
        </g>
      </g>

      {/* Antebraco direito + halter (espelhado) */}
      <g transform="translate(116 108)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; 120; 0"
            dur="2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={0} y2={28} color={accent} />
          <MiniDumbbell x={0} y={32} scale={1} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** EXTENSAO TRICEP — bracos por cima da cabeca, antebracos descem. */
function TricepExtension({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Joint cx={100} cy={75} fill={accent} />
      <Limb x1={100} y1={82} x2={100} y2={130} color={accent} />
      <Limb x1={100} y1={130} x2={88} y2={170} color={accent} />
      <Limb x1={100} y1={130} x2={112} y2={170} color={accent} />
      {/* Bracos sobem verticais ate ao alto */}
      <Limb x1={92} y1={85} x2={88} y2={48} color={accent} />
      <Limb x1={108} y1={85} x2={112} y2={48} color={accent} />

      {/* Antebraco + halter — flete e estende para tras da cabeca */}
      <g transform="translate(100 48)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-25; 80; -25"
            dur="2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={-12} y1={0} x2={-12} y2={-28} color={accent} />
          <Limb x1={12} y1={0} x2={12} y2={-28} color={accent} />
          <MiniDumbbell x={0} y={-30} scale={1.2} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** ELEVACAO LATERAL — bracos sobem laterais ate ombros. */
function LateralRaise({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Joint cx={100} cy={65} fill={accent} />
      <Limb x1={100} y1={72} x2={100} y2={125} color={accent} />
      <Limb x1={100} y1={125} x2={88} y2={170} color={accent} />
      <Limb x1={100} y1={125} x2={112} y2={170} color={accent} />

      {/* Braco esquerdo a abrir lateralmente */}
      <g transform="translate(88 78)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -90; 0"
            dur="2.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={0} y2={42} color={accent} />
          <MiniDumbbell x={0} y={48} scale={1} color={accent} />
        </g>
      </g>

      {/* Braco direito a abrir lateralmente */}
      <g transform="translate(112 78)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; 90; 0"
            dur="2.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={0} y2={42} color={accent} />
          <MiniDumbbell x={0} y={48} scale={1} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** ELEVACAO FRONTAL — bracos sobem pela frente. */
function FrontRaise({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Joint cx={100} cy={65} fill={accent} />
      <Limb x1={100} y1={72} x2={100} y2={125} color={accent} />
      <Limb x1={100} y1={125} x2={88} y2={170} color={accent} />
      <Limb x1={100} y1={125} x2={112} y2={170} color={accent} />

      {/* Bracos a subir pela frente — rotacionam de 0 (para baixo) ate -90 (frente) */}
      <g transform="translate(88 78)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-15; -100; -15"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={0} y2={36} color={accent} />
          <MiniDumbbell x={0} y={40} scale={0.9} color={accent} />
        </g>
      </g>
      <g transform="translate(112 78)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="15; 100; 15"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={0} y2={36} color={accent} />
          <MiniDumbbell x={0} y={40} scale={0.9} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** PULL UP — pendurado em barra, corpo sobe e desce. */
function PullUp({ accent }) {
  return (
    <g>
      {/* Barra fixa */}
      <line x1="50" y1="35" x2="150" y2="35" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="20" x2="50" y2="35" stroke={accent} strokeWidth="2" />
      <line x1="150" y1="20" x2="150" y2="35" stroke={accent} strokeWidth="2" />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 18; 0 -2; 0 18"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        {/* Bracos verticais agarrados na barra */}
        <Limb x1={85} y1={37} x2={85} y2={75} color={accent} />
        <Limb x1={115} y1={37} x2={115} y2={75} color={accent} />
        {/* Cabeca + tronco */}
        <Joint cx={100} cy={68} fill={accent} />
        <Limb x1={100} y1={75} x2={100} y2={130} color={accent} />
        {/* Pernas levemente fletidas */}
        <Limb x1={100} y1={130} x2={88} y2={160} color={accent} />
        <Limb x1={100} y1={130} x2={112} y2={160} color={accent} />
      </g>
    </g>
  );
}

/** LAT PULLDOWN — sentado, puxa barra para baixo. */
function LatPulldown({ accent }) {
  return (
    <g>
      {/* Polia em cima */}
      <circle cx="100" cy="25" r="6" fill={accent} opacity="0.6" />
      <Floor color={accent} />
      {/* Banco */}
      <rect x="80" y="135" width="40" height="6" rx="2" fill={accent} opacity="0.5" />
      <rect x="85" y="141" width="4" height="20" fill={accent} opacity="0.4" />
      <rect x="111" y="141" width="4" height="20" fill={accent} opacity="0.4" />

      {/* Stickman sentado */}
      <Joint cx={100} cy={70} fill={accent} />
      <Limb x1={100} y1={77} x2={100} y2={130} color={accent} />
      {/* Pernas em angulo (joelhos para a frente) */}
      <Limb x1={100} y1={130} x2={130} y2={140} color={accent} />
      <Limb x1={130} y1={140} x2={130} y2={165} color={accent} />
      <Limb x1={100} y1={130} x2={70} y2={140} color={accent} />
      <Limb x1={70} y1={140} x2={70} y2={165} color={accent} />

      {/* Bracos + barra que desce verticalmente */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 -32; 0 0; 0 -32"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Limb x1={88} y1={80} x2={75} y2={102} color={accent} />
        <Limb x1={112} y1={80} x2={125} y2={102} color={accent} />
        <Barbell x={100} y={102} scale={1} color={accent} />
        {/* Cabos */}
        <line x1="75" y1="102" x2="75" y2="35" stroke={accent} strokeWidth="1.5" opacity="0.5" />
        <line x1="125" y1="102" x2="125" y2="35" stroke={accent} strokeWidth="1.5" opacity="0.5" />
      </g>
    </g>
  );
}

/** REMADA — inclinado, puxa barra ate ao tronco. */
function Row({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Stickman inclinado para a frente */}
      <g transform="translate(100 100) rotate(60)">
        <Joint cx={0} cy={-50} fill={accent} />
        <Limb x1={0} y1={-43} x2={0} y2={10} color={accent} />
      </g>
      {/* Pernas em pe ligeiramente fletidas */}
      <Limb x1={120} y1={130} x2={108} y2={170} color={accent} />
      <Limb x1={120} y1={130} x2={130} y2={170} color={accent} />

      {/* Bracos + barra que vai e vem para o tronco */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -22; 0 0"
          dur="2.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Limb x1={75} y1={100} x2={75} y2={155} color={accent} />
        <Limb x1={92} y1={108} x2={92} y2={155} color={accent} />
        <Barbell x={84} y={158} scale={0.85} color={accent} />
      </g>
    </g>
  );
}

/** DEADLIFT — em pe, ergue barra do chao. */
function Deadlift({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas (em pe) */}
      <Limb x1={100} y1={120} x2={88} y2={165} color={accent} />
      <Limb x1={100} y1={120} x2={112} y2={165} color={accent} />

      {/* Tronco que se inclina e endireita */}
      <g style={{ transformOrigin: "100px 120px" }}>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 100 120; -55 100 120; 0 100 120"
          dur="3s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Joint cx={100} cy={70} fill={accent} />
        <Limb x1={100} y1={77} x2={100} y2={120} color={accent} />
        {/* Bracos verticais segurando a barra */}
        <Limb x1={88} y1={80} x2={88} y2={130} color={accent} />
        <Limb x1={112} y1={80} x2={112} y2={130} color={accent} />
        <Barbell x={100} y={132} scale={1.05} color={accent} />
      </g>
    </g>
  );
}

/** AGACHAMENTO / SQUAT — em pe, desce e sobe. */
function Squat({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 28; 0 0"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        {/* Stickman em pe com barra nos ombros */}
        <Joint cx={100} cy={55} fill={accent} />
        <Limb x1={100} y1={62} x2={100} y2={110} color={accent} />
        {/* Pernas */}
        <Limb x1={100} y1={110} x2={86} y2={150} color={accent} />
        <Limb x1={100} y1={110} x2={114} y2={150} color={accent} />
        {/* Bracos a segurar a barra atras dos ombros */}
        <Limb x1={88} y1={68} x2={75} y2={75} color={accent} />
        <Limb x1={112} y1={68} x2={125} y2={75} color={accent} />
        <Barbell x={100} y={70} scale={1.1} color={accent} />
      </g>
    </g>
  );
}

/** AFUNDO / LUNGE — uma perna a frente, baixa o corpo. */
function Lunge({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 18; 0 0"
          dur="2.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        {/* Cabeca + tronco vertical */}
        <Joint cx={100} cy={60} fill={accent} />
        <Limb x1={100} y1={67} x2={100} y2={115} color={accent} />
        {/* Bracos relaxados */}
        <Limb x1={92} y1={75} x2={88} y2={105} color={accent} />
        <Limb x1={108} y1={75} x2={112} y2={105} color={accent} />
        {/* Perna da frente — joelho a 90 */}
        <Limb x1={100} y1={115} x2={70} y2={130} color={accent} />
        <Limb x1={70} y1={130} x2={70} y2={155} color={accent} />
        {/* Perna de tras — esticada */}
        <Limb x1={100} y1={115} x2={130} y2={140} color={accent} />
        <Limb x1={130} y1={140} x2={155} y2={155} color={accent} />
      </g>
    </g>
  );
}

/** ROMANIAN DEADLIFT / STIFF — hip hinge com pernas direitas. */
function RomanianDeadlift({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas quase rectas */}
      <Limb x1={100} y1={120} x2={92} y2={165} color={accent} />
      <Limb x1={100} y1={120} x2={108} y2={165} color={accent} />

      <g style={{ transformOrigin: "100px 120px" }}>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 100 120; -65 100 120; 0 100 120"
          dur="3s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Joint cx={100} cy={70} fill={accent} />
        <Limb x1={100} y1={77} x2={100} y2={120} color={accent} />
        <Limb x1={88} y1={80} x2={88} y2={120} color={accent} />
        <Limb x1={112} y1={80} x2={112} y2={120} color={accent} />
        <Barbell x={100} y={123} scale={1} color={accent} />
      </g>
    </g>
  );
}

/** LEG PRESS — sentado/inclinado, empurra plataforma com pernas. */
function LegPress({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Banco inclinado */}
      <line x1="35" y1="155" x2="100" y2="115" stroke={accent} strokeWidth="3" opacity="0.5" />
      <line x1="35" y1="150" x2="35" y2="170" stroke={accent} strokeWidth="2" opacity="0.4" />

      {/* Stickman deitado em angulo */}
      <g transform="rotate(-30 75 130)">
        <Joint cx={50} cy={130} fill={accent} />
        <Limb x1={56} y1={132} x2={100} y2={130} color={accent} />
        {/* Bracos para o lado */}
        <Limb x1={70} y1={132} x2={70} y2={155} color={accent} />
        <Limb x1={85} y1={132} x2={85} y2={155} color={accent} />
      </g>

      {/* Pernas que empurram a plataforma — animam horizontal */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; -25 14; 0 0"
          dur="2.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        {/* Pernas estendidas para cima e para a direita */}
        <Limb x1={113} y1={108} x2={155} y2={75} color={accent} />
        <Limb x1={120} y1={115} x2={162} y2={82} color={accent} />
        {/* Plataforma */}
        <line
          x1={150}
          y1={50}
          x2={170}
          y2={95}
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </g>
  );
}

/** LEG EXTENSION — sentado, pernas estendem na maquina. */
function LegExtension({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Banco */}
      <rect x="35" y="115" width="55" height="6" rx="2" fill={accent} opacity="0.5" />
      <rect x="40" y="121" width="4" height="40" fill={accent} opacity="0.4" />
      <rect x="80" y="121" width="4" height="40" fill={accent} opacity="0.4" />

      {/* Stickman sentado */}
      <Joint cx={62} cy={70} fill={accent} />
      <Limb x1={62} y1={77} x2={62} y2={113} color={accent} />
      {/* Bracos relaxados */}
      <Limb x1={55} y1={85} x2={50} y2={108} color={accent} />
      <Limb x1={69} y1={85} x2={74} y2={108} color={accent} />
      {/* Coxa horizontal */}
      <Limb x1={62} y1={113} x2={108} y2={115} color={accent} />

      {/* Tibia + pe — rotacionam ate ficar horizontal */}
      <g transform="translate(108 115)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="90; 0; 90"
            dur="2.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={45} y2={0} color={accent} />
          <Joint cx={50} cy={0} r={4} fill={accent} />
        </g>
      </g>
    </g>
  );
}

/** LEG CURL — deitado de bruco, pernas dobram. */
function LegCurl({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Banco */}
      <rect x="30" y="125" width="130" height="6" rx="2" fill={accent} opacity="0.5" />

      {/* Stickman deitado de bruco */}
      <Joint cx={42} cy={120} fill={accent} />
      <Limb x1={48} y1={122} x2={140} y2={123} color={accent} />
      {/* Bracos para a frente */}
      <Limb x1={62} y1={122} x2={45} y2={108} color={accent} />
      <Limb x1={75} y1={122} x2={58} y2={108} color={accent} />

      {/* Pernas — coxa fixa, tibia rotaciona para cima */}
      <g transform="translate(140 123)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -110; 0"
            dur="2.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={40} y2={0} color={accent} />
          <Joint cx={45} cy={0} r={4} fill={accent} />
        </g>
      </g>
    </g>
  );
}

/** CALF RAISE — sobe nas pontas dos pes. */
function CalfRaise({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 6; 0 -8; 0 6"
          dur="1.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Joint cx={100} cy={60} fill={accent} />
        <Limb x1={100} y1={67} x2={100} y2={120} color={accent} />
        <Limb x1={92} y1={78} x2={88} y2={108} color={accent} />
        <Limb x1={108} y1={78} x2={112} y2={108} color={accent} />
        <Limb x1={100} y1={120} x2={92} y2={160} color={accent} />
        <Limb x1={100} y1={120} x2={108} y2={160} color={accent} />
        {/* Pes — pequenos triangulos a apontar para baixo/frente */}
        <line
          x1={92}
          y1={160}
          x2={82}
          y2={160}
          stroke={accent}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
        />
        <line
          x1={108}
          y1={160}
          x2={118}
          y2={160}
          stroke={accent}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

/** PRANCHA / PLANK — posicao estatica com leve oscilacao. */
function Plank({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 2; 0 0"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <Joint cx={45} cy={120} fill={accent} />
        <Limb x1={51} y1={122} x2={155} y2={132} color={accent} />
        {/* Antebracos no chao */}
        <Limb x1={70} y1={122} x2={60} y2={170} color={accent} />
        <Limb x1={60} y1={170} x2={80} y2={170} color={accent} w={STROKE_W} />
        <Limb x1={80} y1={122} x2={75} y2={170} color={accent} />
        {/* Pernas estendidas */}
        <Limb x1={155} y1={132} x2={175} y2={170} color={accent} />
        <Limb x1={155} y1={132} x2={170} y2={170} color={accent} />
      </g>
    </g>
  );
}

/** CRUNCH / ABDOMINAL — deitado, tronco enrola. */
function Crunch({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas dobradas (fixas) */}
      <Limb x1={130} y1={130} x2={150} y2={150} color={accent} />
      <Limb x1={130} y1={130} x2={155} y2={155} color={accent} />
      <Limb x1={150} y1={150} x2={170} y2={150} color={accent} />
      <Limb x1={155} y1={155} x2={170} y2={155} color={accent} />

      {/* Tronco + cabeca — rota a partir da anca */}
      <g transform="translate(130 130)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -45; 0"
            dur="1.6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={-65} y2={0} color={accent} />
          <Joint cx={-72} cy={0} fill={accent} />
          {/* Bracos cruzados sobre o peito */}
          <Limb x1={-30} y1={0} x2={-40} y2={-10} color={accent} />
          <Limb x1={-50} y1={0} x2={-60} y2={-10} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** LEG RAISE — deitado de costas, pernas sobem. */
function LegRaise({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Tronco horizontal fixo */}
      <Joint cx={45} cy={140} fill={accent} />
      <Limb x1={51} y1={142} x2={130} y2={140} color={accent} />
      {/* Bracos ao lado */}
      <Limb x1={75} y1={142} x2={75} y2={170} color={accent} />
      <Limb x1={95} y1={142} x2={95} y2={170} color={accent} />

      {/* Pernas — rotacionam a partir das ancas */}
      <g transform="translate(130 140)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -85; 0"
            dur="2.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={40} y2={0} color={accent} />
          <Limb x1={0} y1={0} x2={42} y2={6} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** RUSSIAN TWIST — sentado, tronco roda lateralmente. */
function RussianTwist({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas levantadas (fixas, em V) */}
      <Limb x1={100} y1={130} x2={70} y2={108} color={accent} />
      <Limb x1={100} y1={130} x2={130} y2={108} color={accent} />

      {/* Tronco que roda lateralmente */}
      <g transform="translate(100 130)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-35; 35; -35"
            dur="2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Joint cx={0} cy={-50} fill={accent} />
          <Limb x1={0} y1={-43} x2={0} y2={0} color={accent} />
          {/* Bracos juntos a frente */}
          <Limb x1={-8} y1={-32} x2={0} y2={-10} color={accent} />
          <Limb x1={8} y1={-32} x2={0} y2={-10} color={accent} />
          <MiniDumbbell x={0} y={-8} scale={1.1} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** BURPEE — agacha-se, salta para prancha, salta para o ar. Simplificacao: dois estados. */
function Burpee({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Stickman que alterna entre prancha e em pe (com escala) */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -10; 0 0"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <Joint cx={100} cy={70} fill={accent}>
          <animate
            attributeName="cy"
            values="70; 60; 70"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </Joint>
        <Limb x1={100} y1={77} x2={100} y2={130} color={accent} />
        <Limb x1={100} y1={130} x2={88} y2={170} color={accent} />
        <Limb x1={100} y1={130} x2={112} y2={170} color={accent} />
        {/* Bracos sobem no salto */}
        <g transform="translate(100 80)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0; 160; 0"
              dur="1.6s"
              repeatCount="indefinite"
              additive="sum"
            />
            <Limb x1={-10} y1={0} x2={-10} y2={30} color={accent} />
            <Limb x1={10} y1={0} x2={10} y2={30} color={accent} />
          </g>
        </g>
      </g>

      {/* Setas de movimento (decorativas) */}
      <path
        d="M 60 120 Q 70 90 80 100"
        stroke={accent}
        strokeWidth="2"
        fill="none"
        opacity="0.45"
        strokeDasharray="3 3"
      />
    </g>
  );
}

/** MOUNTAIN CLIMBER — prancha com joelhos a alternar. */
function MountainClimber({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Tronco em prancha */}
      <Joint cx={45} cy={105} fill={accent} />
      <Limb x1={51} y1={107} x2={155} y2={120} color={accent} />
      {/* Bracos verticais */}
      <Limb x1={70} y1={107} x2={70} y2={170} color={accent} />
      <Limb x1={80} y1={108} x2={80} y2={170} color={accent} />

      {/* Perna 1 — joelho a chegar ao peito */}
      <g transform="translate(155 120)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; -50 10; 0 0"
            dur="0.8s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={20} y2={45} color={accent} />
        </g>
      </g>
      {/* Perna 2 — alterna (offset) */}
      <g transform="translate(155 120)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; -50 10; 0 0"
            dur="0.8s"
            begin="0.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={0} y1={0} x2={15} y2={50} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** JUMPING JACKS — bracos e pernas abrem/fecham no salto. */
function JumpingJacks({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -8; 0 0"
          dur="0.8s"
          repeatCount="indefinite"
        />
        <Joint cx={100} cy={60} fill={accent} />
        <Limb x1={100} y1={67} x2={100} y2={120} color={accent} />

        {/* Braco esquerdo abre */}
        <g transform="translate(100 75)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-15; -160; -15"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <Limb x1={0} y1={0} x2={0} y2={36} color={accent} />
          </g>
        </g>
        {/* Braco direito abre */}
        <g transform="translate(100 75)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="15; 160; 15"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <Limb x1={0} y1={0} x2={0} y2={36} color={accent} />
          </g>
        </g>

        {/* Perna esquerda abre */}
        <g transform="translate(100 120)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-5; -25; -5"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <Limb x1={0} y1={0} x2={0} y2={45} color={accent} />
          </g>
        </g>
        {/* Perna direita abre */}
        <g transform="translate(100 120)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="5; 25; 5"
              dur="0.8s"
              repeatCount="indefinite"
            />
            <Limb x1={0} y1={0} x2={0} y2={45} color={accent} />
          </g>
        </g>
      </g>
    </g>
  );
}

/** KETTLEBELL SWING — hip hinge com kettlebell a oscilar. */
function KettlebellSwing({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas em pe ligeiramente abertas */}
      <Limb x1={100} y1={120} x2={86} y2={165} color={accent} />
      <Limb x1={100} y1={120} x2={114} y2={165} color={accent} />

      {/* Tronco que se inclina ligeiramente */}
      <g style={{ transformOrigin: "100px 120px" }}>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 100 120; -25 100 120; 0 100 120"
          dur="2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Joint cx={100} cy={70} fill={accent} />
        <Limb x1={100} y1={77} x2={100} y2={120} color={accent} />
      </g>

      {/* Bracos + kettlebell a oscilar como pendulo */}
      <g transform="translate(100 80)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-90; 30; -90"
            dur="2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <Limb x1={-8} y1={0} x2={0} y2={48} color={accent} />
          <Limb x1={8} y1={0} x2={0} y2={48} color={accent} />
          {/* Kettlebell */}
          <ellipse cx={0} cy={56} rx={10} ry={11} fill={accent} />
          <path
            d="M -7 50 Q -7 44 0 44 Q 7 44 7 50"
            stroke={accent}
            strokeWidth="2.5"
            fill="none"
          />
        </g>
      </g>
    </g>
  );
}

/** CARDIO RUN — corre no lugar (pernas alternam). */
function RunInPlace({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Joint cx={100} cy={60} fill={accent} />
      <Limb x1={100} y1={67} x2={100} y2={115} color={accent} />

      {/* Bracos a alternar */}
      <g transform="translate(100 75)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-50; 30; -50"
            dur="0.7s"
            repeatCount="indefinite"
          />
          <Limb x1={0} y1={0} x2={0} y2={32} color={accent} />
        </g>
      </g>
      <g transform="translate(100 75)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="30; -50; 30"
            dur="0.7s"
            repeatCount="indefinite"
          />
          <Limb x1={0} y1={0} x2={0} y2={32} color={accent} />
        </g>
      </g>

      {/* Pernas a alternar */}
      <g transform="translate(100 115)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-25; 35; -25"
            dur="0.7s"
            repeatCount="indefinite"
          />
          <Limb x1={0} y1={0} x2={0} y2={45} color={accent} />
        </g>
      </g>
      <g transform="translate(100 115)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="35; -25; 35"
            dur="0.7s"
            repeatCount="indefinite"
          />
          <Limb x1={0} y1={0} x2={0} y2={45} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** DIPS — bracos paralelos, corpo desce e sobe. */
function Dips({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Barras paralelas */}
      <line x1="55" y1="90" x2="55" y2="170" stroke={accent} strokeWidth="3" opacity="0.5" />
      <line x1="145" y1="90" x2="145" y2="170" stroke={accent} strokeWidth="3" opacity="0.5" />
      <line x1="50" y1="90" x2="80" y2="90" stroke={accent} strokeWidth="3" />
      <line x1="120" y1="90" x2="150" y2="90" stroke={accent} strokeWidth="3" />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 22; 0 0"
          dur="2.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Joint cx={100} cy={75} fill={accent} />
        <Limb x1={100} y1={82} x2={100} y2={130} color={accent} />
        <Limb x1={88} y1={88} x2={70} y2={92} color={accent} />
        <Limb x1={112} y1={88} x2={130} y2={92} color={accent} />
        {/* Pernas dobradas atras */}
        <Limb x1={100} y1={130} x2={92} y2={150} color={accent} />
        <Limb x1={100} y1={130} x2={108} y2={150} color={accent} />
      </g>
    </g>
  );
}

/** SHRUG — encolhe ombros, halteres ao lado. */
function Shrug({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Joint cx={100} cy={60} fill={accent} />
      <Limb x1={100} y1={67} x2={100} y2={120} color={accent} />
      <Limb x1={100} y1={120} x2={88} y2={170} color={accent} />
      <Limb x1={100} y1={120} x2={112} y2={170} color={accent} />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -8; 0 0"
          dur="1.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Limb x1={88} y1={75} x2={84} y2={130} color={accent} />
        <Limb x1={112} y1={75} x2={116} y2={130} color={accent} />
        <MiniDumbbell x={84} y={135} scale={1.1} color={accent} rotation={90} />
        <MiniDumbbell x={116} y={135} scale={1.1} color={accent} rotation={90} />
      </g>
    </g>
  );
}

/** FACE PULL — cabo para a cara, abrir cotovelos. */
function FacePull({ accent }) {
  return (
    <g>
      {/* Polia */}
      <circle cx="100" cy="35" r="6" fill={accent} opacity="0.6" />
      <Floor color={accent} />

      <Joint cx={100} cy={75} fill={accent} />
      <Limb x1={100} y1={82} x2={100} y2={130} color={accent} />
      <Limb x1={100} y1={130} x2={88} y2={170} color={accent} />
      <Limb x1={100} y1={130} x2={112} y2={170} color={accent} />

      {/* Bracos + corda — cotovelos sobem aos lados */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 -8; 0 8; 0 -8"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Limb x1={88} y1={88} x2={70} y2={75} color={accent} />
        <Limb x1={112} y1={88} x2={130} y2={75} color={accent} />
        <line x1="70" y1="75" x2="100" y2="40" stroke={accent} strokeWidth="1.5" opacity="0.55" />
        <line x1="130" y1="75" x2="100" y2="40" stroke={accent} strokeWidth="1.5" opacity="0.55" />
      </g>
    </g>
  );
}

/** HIP THRUST — costas no banco, ancas sobem e descem. */
function HipThrust({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Banco */}
      <rect x="30" y="105" width="60" height="6" rx="2" fill={accent} opacity="0.5" />
      <rect x="34" y="111" width="4" height="40" fill={accent} opacity="0.4" />
      <rect x="80" y="111" width="4" height="40" fill={accent} opacity="0.4" />

      {/* Ombros apoiados no banco */}
      <Joint cx={50} cy={100} fill={accent} />

      {/* Tronco + ancas — sobem e descem */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 12; 0 -6; 0 12"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Limb x1={56} y1={102} x2={130} y2={120} color={accent} />
        {/* Pernas dobradas — pes apoiados */}
        <Limb x1={130} y1={120} x2={150} y2={160} color={accent} />
        <Limb x1={130} y1={120} x2={155} y2={155} color={accent} />
        {/* Barra no quadril */}
        <Barbell x={120} y={120} scale={0.9} color={accent} />
      </g>
    </g>
  );
}

/** GLUTE BRIDGE — deitado, ancas sobem (sem peso). */
function GluteBridge({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Stickman deitado, ombros no chao */}
      <Joint cx={45} cy={140} fill={accent} />
      <Limb x1={51} y1={142} x2={75} y2={150} color={accent} />
      {/* Bracos ao lado no chao */}
      <Limb x1={60} y1={143} x2={45} y2={170} color={accent} />
      <Limb x1={60} y1={143} x2={70} y2={170} color={accent} />

      {/* Anca sobe e desce */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -22; 0 0"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <Limb x1={75} y1={150} x2={130} y2={150} color={accent} />
        <Limb x1={130} y1={150} x2={145} y2={170} color={accent} />
        <Limb x1={130} y1={150} x2={155} y2={170} color={accent} />
      </g>
    </g>
  );
}

// ==========================================================================
// MAPEAMENTO PT/EN → CHAVE DE ANIMACAO
// ==========================================================================

/** Lista de pares [substring, key]. Match por inclusao no nome normalizado. */
const PT_PATTERNS = [
  // Peito
  ["supino reto", "bench_press"],
  ["supino plano", "bench_press"],
  ["supino com barra", "bench_press"],
  ["bench press", "bench_press"],
  ["supino inclinado", "incline_bench"],
  ["incline bench", "incline_bench"],
  ["supino declinado", "bench_press"],
  ["supino", "bench_press"],
  ["flexao", "push_up"],
  ["flexoes", "push_up"],
  ["push up", "push_up"],
  ["push-up", "push_up"],
  ["pushup", "push_up"],
  ["crucifixo", "lateral_raise"],
  ["fly", "lateral_raise"],
  ["peck deck", "lateral_raise"],
  ["dips", "dips"],
  ["mergulho", "dips"],
  ["fundos", "dips"],
  ["paralelas", "dips"],

  // Costas
  ["pull up", "pull_up"],
  ["pull-up", "pull_up"],
  ["pullup", "pull_up"],
  ["barra fixa", "pull_up"],
  ["chin up", "pull_up"],
  ["elevac", "pull_up"],
  ["puxada", "lat_pulldown"],
  ["pulldown", "lat_pulldown"],
  ["lat pull", "lat_pulldown"],
  ["remada baixa", "row"],
  ["remada", "row"],
  ["row", "row"],
  ["levantamento terra", "deadlift"],
  ["deadlift", "deadlift"],
  ["terra", "deadlift"],
  ["face pull", "face_pull"],
  ["hiperextensao", "deadlift"],

  // Ombros
  ["press militar", "overhead_press"],
  ["desenvolvimento militar", "overhead_press"],
  ["desenvolvimento", "overhead_press"],
  ["overhead press", "overhead_press"],
  ["military press", "overhead_press"],
  ["arnold press", "overhead_press"],
  ["elevacao lateral", "lateral_raise"],
  ["lateral raise", "lateral_raise"],
  ["elevacao frontal", "front_raise"],
  ["front raise", "front_raise"],
  ["encolhimento", "shrug"],
  ["shrug", "shrug"],

  // Bracos
  ["rosca direta", "bicep_curl"],
  ["rosca alternada", "bicep_curl"],
  ["rosca martelo", "bicep_curl"],
  ["rosca scott", "bicep_curl"],
  ["rosca concentrada", "bicep_curl"],
  ["rosca inversa", "bicep_curl"],
  ["rosca", "bicep_curl"],
  ["curl", "bicep_curl"],
  ["bicep", "bicep_curl"],
  ["biceps", "bicep_curl"],
  ["extensao tricep", "tricep_extension"],
  ["extensao de tricep", "tricep_extension"],
  ["tricep extension", "tricep_extension"],
  ["tricep pulley", "tricep_extension"],
  ["tricep polia", "tricep_extension"],
  ["tricep corda", "tricep_extension"],
  ["tricep testa", "tricep_extension"],
  ["skull crusher", "tricep_extension"],
  ["frances", "tricep_extension"],
  ["pushdown", "tricep_extension"],
  ["tricep", "tricep_extension"],
  ["triceps", "tricep_extension"],

  // Pernas
  ["agachamento", "squat"],
  ["squat", "squat"],
  ["hack squat", "squat"],
  ["sumo", "squat"],
  ["leg press", "leg_press"],
  ["pressao de pernas", "leg_press"],
  ["extensao de pernas", "leg_extension"],
  ["leg extension", "leg_extension"],
  ["cadeira extensora", "leg_extension"],
  ["flexao de pernas", "leg_curl"],
  ["leg curl", "leg_curl"],
  ["mesa flexora", "leg_curl"],
  ["stiff", "romanian_deadlift"],
  ["romanian deadlift", "romanian_deadlift"],
  ["romeno", "romanian_deadlift"],
  ["afundo", "lunge"],
  ["avanco", "lunge"],
  ["lunge", "lunge"],
  ["bulgarian", "lunge"],
  ["panturrilha", "calf_raise"],
  ["gemeos", "calf_raise"],
  ["calf", "calf_raise"],
  ["hip thrust", "hip_thrust"],
  ["elevacao pelvica", "hip_thrust"],
  ["ponte gluteo", "glute_bridge"],
  ["ponte glute", "glute_bridge"],
  ["glute bridge", "glute_bridge"],
  ["glute", "glute_bridge"],

  // Abdomen / Core
  ["prancha", "plank"],
  ["plank", "plank"],
  ["abdominal bicicleta", "crunch"],
  ["abdominal", "crunch"],
  ["crunch", "crunch"],
  ["sit up", "crunch"],
  ["situp", "crunch"],
  ["elevacao de pernas", "leg_raise"],
  ["leg raise", "leg_raise"],
  ["hanging leg raise", "leg_raise"],
  ["dead bug", "leg_raise"],
  ["russian twist", "russian_twist"],
  ["torcao russa", "russian_twist"],
  ["obliquos", "russian_twist"],

  // Cardio / Full body
  ["burpee", "burpee"],
  ["mountain climber", "mountain_climber"],
  ["escalador", "mountain_climber"],
  ["jumping jack", "jumping_jacks"],
  ["polichinelo", "jumping_jacks"],
  ["box jump", "jumping_jacks"],
  ["high knee", "run_in_place"],
  ["corrida", "run_in_place"],
  ["correr", "run_in_place"],
  ["running", "run_in_place"],
  ["jump rope", "run_in_place"],
  ["saltar a corda", "run_in_place"],
  ["kettlebell swing", "kettlebell_swing"],
  ["swing", "kettlebell_swing"],
  ["clean and press", "overhead_press"],
  ["thruster", "squat"],
  ["turkish", "kettlebell_swing"],
];

// ==========================================================================
// FALLBACK POR CATEGORIA
// ==========================================================================

const CATEGORY_FALLBACK = {
  peito: "bench_press",
  costas: "lat_pulldown",
  pernas: "squat",
  ombros: "overhead_press",
  biceps: "bicep_curl",
  triceps: "tricep_extension",
  abdomen: "crunch",
  cardio: "jumping_jacks",
  full_body: "kettlebell_swing",
};

// ==========================================================================
// REGISTO DE ANIMACOES
// ==========================================================================

export const STICKMAN_ANIMATIONS = {
  bench_press: BenchPress,
  incline_bench: InclineBench,
  push_up: PushUp,
  overhead_press: OverheadPress,
  bicep_curl: BicepCurl,
  tricep_extension: TricepExtension,
  lateral_raise: LateralRaise,
  front_raise: FrontRaise,
  pull_up: PullUp,
  lat_pulldown: LatPulldown,
  row: Row,
  deadlift: Deadlift,
  squat: Squat,
  lunge: Lunge,
  romanian_deadlift: RomanianDeadlift,
  leg_press: LegPress,
  leg_extension: LegExtension,
  leg_curl: LegCurl,
  calf_raise: CalfRaise,
  plank: Plank,
  crunch: Crunch,
  leg_raise: LegRaise,
  russian_twist: RussianTwist,
  burpee: Burpee,
  mountain_climber: MountainClimber,
  jumping_jacks: JumpingJacks,
  kettlebell_swing: KettlebellSwing,
  run_in_place: RunInPlace,
  dips: Dips,
  shrug: Shrug,
  face_pull: FacePull,
  hip_thrust: HipThrust,
  glute_bridge: GluteBridge,
};

// ==========================================================================
// RESOLUCAO
// ==========================================================================

/** Normaliza o nome para comparacao (lower, sem acentos, sem pontuacao). */
function normalize(s) {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Devolve a chave da animacao mais apropriada para um nome+categoria.
 * Cascata: nome exato → substring no PT_PATTERNS → categoria → default.
 */
export function resolveAnimationKey(name, category) {
  const norm = normalize(name);

  // Match exato
  if (norm && STICKMAN_ANIMATIONS[norm]) {
    return norm;
  }

  // Match por substring no PT_PATTERNS
  if (norm) {
    for (const [pattern, key] of PT_PATTERNS) {
      if (norm.includes(pattern)) return key;
    }
  }

  // Fallback por categoria
  if (category && CATEGORY_FALLBACK[category]) {
    return CATEGORY_FALLBACK[category];
  }

  // Default global
  return "jumping_jacks";
}

/** Devolve o componente React para um nome+categoria. */
export function resolveStickmanAnimation(name, category) {
  const key = resolveAnimationKey(name, category);
  return STICKMAN_ANIMATIONS[key] || JumpingJacks;
}
