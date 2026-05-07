/**
 * StickmanAnimations.jsx
 *
 * Animacoes anatomicas (cabeca + tronco + bracos articulados em ombro/cotovelo
 * + pernas articuladas em anca/joelho/tornozelo) que ilustram cada exercicio
 * de forma realista. Sem fotografias nem GIFs externos — SVG puro com SMIL.
 *
 * Hierarquia tipica:
 *
 *   <g translate(pelvis)>           ← move o corpo
 *     <g rotate(spine bend)>        ← inclina tronco no quadril
 *       spine + head + shoulders
 *       <g translate(shoulder L)>   ← origem do braco esquerdo
 *         <g rotate(upper arm L)>   ← roda braco no ombro
 *           upper arm
 *           <g translate(elbow)>    ← origem do antebraco
 *             <g rotate(forearm)>   ← roda antebraco no cotovelo
 *               forearm + hand
 *
 *   <g translate(hip L)>
 *     <g rotate(thigh L)>
 *       thigh
 *       <g translate(knee)>
 *         <g rotate(shin L)>
 *           shin + foot
 *
 * Cada nivel pode ter o seu proprio <animateTransform>, sincronizado com
 * os outros pela mesma duracao.
 */

// ==========================================================================
// PROPORCOES ANATOMICAS (em unidades do viewBox 200x200)
// ==========================================================================

const P = {
  HEAD_R: 7.5,
  NECK: 4,
  TORSO: 36,
  SHOULDER_W: 11,   // metade da largura entre ombros
  HIP_W: 7,         // metade da largura entre ancas
  UPPER_ARM: 22,
  FOREARM: 22,
  HAND: 5,
  THIGH: 28,
  SHIN: 26,
  FOOT_LEN: 9,
  STROKE_BODY: 5,
  STROKE_LIMB: 4.5,
  JOINT_R: 2.6,
};

// Curvas de easing reaproveitadas
const EASE = "0.42 0 0.58 1; 0.42 0 0.58 1";
const EASE_OUT = "0.16 1 0.3 1; 0.16 1 0.3 1";

// ==========================================================================
// PRIMITIVAS GRAFICAS
// ==========================================================================

function Head({ cx = 0, cy = 0, color, eyes = false }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={P.HEAD_R} fill={color} />
      {eyes && (
        <circle cx={cx + 2.5} cy={cy - 0.5} r={1} fill="rgba(0,0,0,0.4)" />
      )}
    </g>
  );
}

function Joint({ cx = 0, cy = 0, r = P.JOINT_R, color }) {
  return <circle cx={cx} cy={cy} r={r} fill={color} />;
}

function Bone({ x1, y1, x2, y2, color, w = P.STROKE_LIMB }) {
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

function Hand({ cx = 0, cy = 0, color, scale = 1 }) {
  return <circle cx={cx} cy={cy} r={P.HAND * scale * 0.55} fill={color} />;
}

/** Pe — pequena elipse a apontar para a frente. */
function Foot({ cx = 0, cy = 0, color, angle = 0, scale = 1 }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
      <ellipse
        cx={P.FOOT_LEN * scale * 0.4}
        cy={0}
        rx={P.FOOT_LEN * scale * 0.55}
        ry={2.5 * scale}
        fill={color}
      />
    </g>
  );
}

/**
 * Braco articulado em 2 segmentos:
 * <g translate(pivot)> rotate(upper) [upper bone + elbow] <g translate(elbow)> rotate(forearm) [forearm + hand]
 *
 * As animacoes sao opcionais — se passares `upperAngles`/`forearmAngles`,
 * cada segmento ganha o seu animateTransform de rotacao.
 */
function ArticulatedArm({
  pivotX,
  pivotY,
  upperAngle = 0,
  forearmAngle = 0,
  upperLen = P.UPPER_ARM,
  forearmLen = P.FOREARM,
  upperAngles, // string SMIL "a; b; a"
  forearmAngles,
  duration = "2.4s",
  begin,
  keySplines = EASE,
  color,
  hand = true,
  endItem,
}) {
  return (
    <g transform={`translate(${pivotX} ${pivotY})`}>
      <Joint color={color} r={P.JOINT_R + 0.4} />
      <g transform={`rotate(${upperAngle})`}>
        {upperAngles && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={upperAngles}
            dur={duration}
            begin={begin}
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={keySplines}
          />
        )}
        <Bone x1={0} y1={0} x2={0} y2={upperLen} color={color} />
        <g transform={`translate(0 ${upperLen})`}>
          <Joint color={color} />
          <g transform={`rotate(${forearmAngle})`}>
            {forearmAngles && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={forearmAngles}
                dur={duration}
                begin={begin}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines={keySplines}
              />
            )}
            <Bone x1={0} y1={0} x2={0} y2={forearmLen} color={color} />
            {hand && <Hand cx={0} cy={forearmLen} color={color} />}
            {endItem && (
              <g transform={`translate(0 ${forearmLen})`}>{endItem}</g>
            )}
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * Perna articulada em 2 segmentos com pe.
 */
function ArticulatedLeg({
  pivotX,
  pivotY,
  thighAngle = 0,
  shinAngle = 0,
  thighLen = P.THIGH,
  shinLen = P.SHIN,
  thighAngles,
  shinAngles,
  duration = "2.4s",
  begin,
  keySplines = EASE,
  color,
  footAngle = 0,
  showFoot = true,
}) {
  return (
    <g transform={`translate(${pivotX} ${pivotY})`}>
      <Joint color={color} r={P.JOINT_R + 0.4} />
      <g transform={`rotate(${thighAngle})`}>
        {thighAngles && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={thighAngles}
            dur={duration}
            begin={begin}
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={keySplines}
          />
        )}
        <Bone x1={0} y1={0} x2={0} y2={thighLen} color={color} w={P.STROKE_BODY} />
        <g transform={`translate(0 ${thighLen})`}>
          <Joint color={color} />
          <g transform={`rotate(${shinAngle})`}>
            {shinAngles && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={shinAngles}
                dur={duration}
                begin={begin}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines={keySplines}
              />
            )}
            <Bone x1={0} y1={0} x2={0} y2={shinLen} color={color} w={P.STROKE_BODY} />
            {showFoot && <Foot cx={0} cy={shinLen} color={color} angle={footAngle} />}
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * Tronco — coluna + cabeca + indicacao dos ombros.
 * Pode receber `bendAngles` se o tronco se inclina (RDL, deadlift, row, etc.).
 */
function Torso({
  pelvisX,
  pelvisY,
  bendAngle = 0,
  bendAngles,
  duration = "2.4s",
  begin,
  keySplines = EASE,
  color,
  showShoulders = true,
}) {
  return (
    <g transform={`translate(${pelvisX} ${pelvisY})`}>
      <g transform={`rotate(${bendAngle})`}>
        {bendAngles && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={bendAngles}
            dur={duration}
            begin={begin}
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={keySplines}
          />
        )}
        {/* coluna */}
        <Bone x1={0} y1={0} x2={0} y2={-P.TORSO} color={color} w={P.STROKE_BODY} />
        {/* linha dos ombros */}
        {showShoulders && (
          <Bone
            x1={-P.SHOULDER_W}
            y1={-P.TORSO}
            x2={P.SHOULDER_W}
            y2={-P.TORSO}
            color={color}
            w={P.STROKE_BODY}
          />
        )}
        {/* pescoco + cabeca */}
        <Bone x1={0} y1={-P.TORSO} x2={0} y2={-P.TORSO - P.NECK} color={color} w={P.STROKE_BODY * 0.7} />
        <Head cx={0} cy={-P.TORSO - P.NECK - P.HEAD_R} color={color} />
      </g>
    </g>
  );
}

/** Equipamento: barra olimpica simples. */
function Barbell({ x = 0, y = 0, scale = 1, color, rotation = 0 }) {
  const w = 90 * scale;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <rect x={-w / 2} y={-2} width={w} height={4} rx={2} fill={color} />
      <rect x={-w / 2 - 6} y={-13} width={6} height={26} rx={2} fill={color} />
      <rect x={w / 2} y={-13} width={6} height={26} rx={2} fill={color} />
    </g>
  );
}

/** Halter pequeno (curl, lateral raise). */
function Dumbbell({ x = 0, y = 0, scale = 1, color, rotation = 0 }) {
  const w = 18 * scale;
  const r = 5.5 * scale;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
      <rect x={-w / 2} y={-2} width={w} height={4} rx={2} fill={color} />
      <circle cx={-w / 2} cy={0} r={r} fill={color} />
      <circle cx={w / 2} cy={0} r={r} fill={color} />
    </g>
  );
}

/** Kettlebell. */
function Kettlebell({ color, scale = 1 }) {
  return (
    <g transform={`scale(${scale})`}>
      <ellipse cx={0} cy={6} rx={12} ry={13} fill={color} />
      <path
        d="M -8 -2 Q -8 -10 0 -10 Q 8 -10 8 -2"
        stroke={color}
        strokeWidth={3}
        fill="none"
      />
      <rect x={-9} y={-4} width={18} height={5} rx={2} fill={color} />
      <ellipse cx={-3} cy={2} rx={3.5} ry={2} fill="rgba(255,255,255,0.25)" />
    </g>
  );
}

/** Linha de chao. */
function Floor({ y = 178, color, opacity = 0.32 }) {
  return (
    <line
      x1={6}
      y1={y}
      x2={194}
      y2={y}
      stroke={color}
      strokeWidth={2}
      opacity={opacity}
    />
  );
}

/** Banco (horizontal). */
function Bench({ x = 50, y = 130, w = 100, h = 7, color }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={color} opacity={0.55} />
      <rect x={x + 6} y={y + h} width={5} height={28} fill={color} opacity={0.4} />
      <rect x={x + w - 11} y={y + h} width={5} height={28} fill={color} opacity={0.4} />
    </g>
  );
}

// ==========================================================================
// ANIMACOES — cada exercicio e uma <g> auto-contida
// ==========================================================================

/**
 * SUPINO RETO — deitado de costas; bracos rodam no ombro e flectem
 * no cotovelo em sincronia para mover a barra na vertical.
 */
function BenchPress({ accent }) {
  // Pivot dos ombros (deitado, pessoa orientada para a esquerda)
  const shoulderL_X = 80;
  const shoulderR_X = 80;
  const shoulderY_top = 113;     // ombro lado de cima
  const shoulderY_bot = 121;     // ombro lado de baixo
  return (
    <g>
      <Floor color={accent} />
      <Bench x={28} y={130} w={130} color={accent} />
      <Joint cx={50} cy={117} color={accent} r={P.HEAD_R} />
      {/* coluna deitada */}
      <Bone x1={57} y1={117} x2={120} y2={117} color={accent} w={P.STROKE_BODY} />
      {/* anca */}
      <Joint cx={120} cy={117} color={accent} r={P.JOINT_R + 0.4} />
      {/* perna direita (frente, dobrada) */}
      <ArticulatedLeg
        pivotX={120}
        pivotY={117}
        thighAngle={62}
        shinAngle={-42}
        thighLen={P.THIGH * 0.75}
        shinLen={P.SHIN * 0.95}
        color={accent}
        footAngle={-90}
      />
      {/* perna tras (atras, mais dobrada para implicar profundidade) */}
      <ArticulatedLeg
        pivotX={120}
        pivotY={117}
        thighAngle={70}
        shinAngle={-50}
        thighLen={P.THIGH * 0.75}
        shinLen={P.SHIN * 0.85}
        color={accent}
        footAngle={-90}
      />

      {/* Bracos articulados — empurram para cima */}
      <ArticulatedArm
        pivotX={shoulderL_X}
        pivotY={shoulderY_top}
        upperAngles="-105; -90; -105"
        forearmAngles="50; 0; 50"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      <ArticulatedArm
        pivotX={shoulderR_X}
        pivotY={shoulderY_bot}
        upperAngles="-75; -90; -75"
        forearmAngles="-50; 0; -50"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />

      {/* Barra que oscila vertical (sincronizada com bracos) */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 28; 0 -10; 0 28"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Barbell x={80} y={50} scale={0.85} color={accent} rotation={90} />
      </g>
    </g>
  );
}

/** SUPINO INCLINADO — banco em angulo, mesma cinematica mas inclinada. */
function InclineBench({ accent }) {
  return (
    <g transform="rotate(-22 100 110)">
      <BenchPress accent={accent} />
    </g>
  );
}

/** FLEXOES — prancha; corpo desce e sobe, ombros aproximam-se do chao. */
function PushUp({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        {/* corpo desce ~10px */}
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 12; 0 0"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        {/* cabeca e ombros */}
        <Head cx={48} cy={120} color={accent} />
        {/* coluna inclinada (ombros mais altos, ancas mais baixas) */}
        <Bone x1={55} y1={122} x2={150} y2={134} color={accent} w={P.STROKE_BODY} />
        <Joint cx={150} cy={134} color={accent} r={P.JOINT_R + 0.4} />
        {/* pernas estendidas para tras */}
        <Bone x1={150} y1={134} x2={185} y2={172} color={accent} w={P.STROKE_BODY} />
        <Joint cx={167} cy={153} color={accent} />
        <Foot cx={185} cy={172} color={accent} angle={-30} />

        {/* Bracos articulados — flectem no cotovelo */}
        <ArticulatedArm
          pivotX={62}
          pivotY={123}
          upperAngles="120; 100; 120"
          forearmAngles="-90; -60; -90"
          duration="2.2s"
          keySplines={EASE}
          color={accent}
          upperLen={P.UPPER_ARM * 0.95}
          forearmLen={P.FOREARM * 0.95}
        />
        <ArticulatedArm
          pivotX={70}
          pivotY={125}
          upperAngles="120; 100; 120"
          forearmAngles="-90; -60; -90"
          duration="2.2s"
          keySplines={EASE}
          color={accent}
          upperLen={P.UPPER_ARM * 0.95}
          forearmLen={P.FOREARM * 0.95}
        />
      </g>
    </g>
  );
}

/** PRESS MILITAR — em pe, bracos empurram barra acima da cabeca. */
function OverheadPress({ accent }) {
  // pelvis em (100, 130)
  const pelvisY = 130;
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas (em pe, ligeiramente abertas) */}
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={177} shinAngle={2} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={183} shinAngle={-2} color={accent} footAngle={5} />
      {/* Tronco vertical */}
      <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />

      {/* Bracos — partem do ombro, empurram para cima
          Em baixo: upper a ~135° (cotovelos ao lado), forearm 90° (a 45°)
          Em cima: upper a 180° (vertical), forearm 0° (vertical) */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="135; 175; 135"
        forearmAngles="-50; -5; -50"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="-135; -175; -135"
        forearmAngles="50; 5; 50"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />

      {/* Barra que sobe e desce */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -38; 0 0"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Barbell x={100} y={pelvisY - P.TORSO + 4} scale={0.95} color={accent} />
      </g>
    </g>
  );
}

/** ROSCA / CURL — em pe; antebracos rodam no cotovelo. */
function BicepCurl({ accent }) {
  const pelvisY = 132;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={178} shinAngle={2} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={182} shinAngle={-2} color={accent} footAngle={5} />
      <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />

      {/* Bracos — upper fixo ao lado, antebraco roda 0 (estendido para baixo)
          ate 145 (forearm a apontar para cima, halter perto do ombro). */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngle={170}
        forearmAngles="0; 145; 0"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        hand={false}
        endItem={<Dumbbell scale={1.1} color={accent} rotation={90} />}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngle={-170}
        forearmAngles="0; -145; 0"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        hand={false}
        endItem={<Dumbbell scale={1.1} color={accent} rotation={90} />}
      />
    </g>
  );
}

/** EXTENSAO TRICEP — bracos por cima da cabeca, antebracos descem para tras. */
function TricepExtension({ accent }) {
  const pelvisY = 138;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={178} shinAngle={2} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={182} shinAngle={-2} color={accent} footAngle={5} />
      <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />

      {/* Upper arm vertical para cima; antebraco desce para tras (rotacao no cotovelo) */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngle={172}
        forearmAngles="170; 70; 170"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngle={-172}
        forearmAngles="-170; -70; -170"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      {/* Halter unico segurado por ambas as maos no topo */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 30; 0 0"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Dumbbell x={100} y={pelvisY - P.TORSO - P.UPPER_ARM - P.FOREARM + 4} scale={1.3} color={accent} rotation={90} />
      </g>
    </g>
  );
}

/** ELEVACAO LATERAL — bracos sobem laterais ate ombros. */
function LateralRaise({ accent }) {
  const pelvisY = 132;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={178} shinAngle={2} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={182} shinAngle={-2} color={accent} footAngle={5} />
      <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />

      {/* Upper arm roda de 170 (lado) ate 90 (horizontal), com forearm levemente flectido */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="170; 95; 170"
        forearmAngle={-15}
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        endItem={<Dumbbell scale={1} color={accent} rotation={90} />}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="-170; -95; -170"
        forearmAngle={15}
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        endItem={<Dumbbell scale={1} color={accent} rotation={90} />}
        hand={false}
      />
    </g>
  );
}

/** ELEVACAO FRONTAL — bracos sobem pela frente. */
function FrontRaise({ accent }) {
  const pelvisY = 132;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={178} shinAngle={2} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={182} shinAngle={-2} color={accent} footAngle={5} />
      <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />

      {/* Upper arm sobe ate vertical (180), forearm fica relativo */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="170; 5; 170"
        forearmAngle={0}
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        endItem={<Dumbbell scale={0.95} color={accent} rotation={90} />}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="-170; -5; -170"
        forearmAngle={0}
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        endItem={<Dumbbell scale={0.95} color={accent} rotation={90} />}
        hand={false}
      />
    </g>
  );
}

/** PULL UP — pendurado em barra; corpo sobe e desce, cotovelos flectem. */
function PullUp({ accent }) {
  return (
    <g>
      {/* Barra fixa */}
      <line x1="40" y1="32" x2="160" y2="32" stroke={accent} strokeWidth={5} strokeLinecap="round" />
      <line x1="40" y1="14" x2="40" y2="32" stroke={accent} strokeWidth={3} />
      <line x1="160" y1="14" x2="160" y2="32" stroke={accent} strokeWidth={3} />

      {/* Corpo inteiro: bracos esticados em cima (180 - vertical), corpo solto em baixo
          No topo: cotovelos flectem (~80), corpo sobe ate o queixo passar a barra. */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 22; 0 -8; 0 22"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        {/* Bracos invertidos — pivot no ombro, mas o ombro esta abaixo da mao
            Modela-se com upper a apontar para CIMA (rotacao 0 no ombro = vertical para cima),
            forearm continua para CIMA (esticado) ou para o lado (flectido). */}
        {/* Ombros do stickman */}
        <Torso pelvisX={100} pelvisY={140} color={accent} bendAngle={0} />
        {/* Pernas levemente fletidas */}
        <ArticulatedLeg pivotX={94} pivotY={140} thighAngle={175} shinAngle={5} color={accent} footAngle={-90} />
        <ArticulatedLeg pivotX={106} pivotY={140} thighAngle={185} shinAngle={-5} color={accent} footAngle={-90} />

        {/* Bracos a segurar a barra */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={140 - P.TORSO}
          upperAngles="-15; 5; -15"
          forearmAngles="0; -85; 0"
          duration="2.6s"
          keySplines={EASE}
          color={accent}
          hand
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={140 - P.TORSO}
          upperAngles="15; -5; 15"
          forearmAngles="0; 85; 0"
          duration="2.6s"
          keySplines={EASE}
          color={accent}
          hand
        />
      </g>
    </g>
  );
}

/** LAT PULLDOWN — sentado; bracos puxam barra para baixo. */
function LatPulldown({ accent }) {
  const pelvisY = 142;
  return (
    <g>
      <Floor color={accent} />
      {/* Polia no topo */}
      <circle cx={100} cy={28} r={5.5} fill={accent} opacity={0.6} />
      <line x1={100} y1={14} x2={100} y2={28} stroke={accent} strokeWidth={2} opacity={0.4} />

      {/* Banco/almofada das coxas */}
      <rect x={75} y={pelvisY + 4} width={50} height={6} rx={2} fill={accent} opacity={0.5} />
      <rect x={86} y={pelvisY + 10} width={4} height={28} fill={accent} opacity={0.4} />
      <rect x={110} y={pelvisY + 10} width={4} height={28} fill={accent} opacity={0.4} />

      {/* Tronco vertical (sentado) */}
      <Torso pelvisX={100} pelvisY={pelvisY} color={accent} bendAngle={0} />
      {/* Pernas a 90 (coxa para a frente, tibia para baixo) */}
      <ArticulatedLeg
        pivotX={94}
        pivotY={pelvisY}
        thighAngle={120}
        shinAngle={-120}
        color={accent}
        footAngle={-15}
      />
      <ArticulatedLeg
        pivotX={106}
        pivotY={pelvisY}
        thighAngle={120}
        shinAngle={-120}
        color={accent}
        footAngle={-15}
      />

      {/* Bracos esticados para cima (a segurar a barra) — flectem ate ~90 */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="-15; -25; -15"
        forearmAngles="0; -65; 0"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="15; 25; 15"
        forearmAngles="0; 65; 0"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      {/* Barra puxada (sincronizada — animateTransform translate) */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 36; 0 0"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Barbell x={100} y={pelvisY - P.TORSO - P.UPPER_ARM - P.FOREARM + 8} scale={1.05} color={accent} />
      </g>
      {/* Cabos */}
      <line x1="76" y1="32" x2="76" y2="80" stroke={accent} strokeWidth={1.5} opacity={0.4} />
      <line x1="124" y1="32" x2="124" y2="80" stroke={accent} strokeWidth={1.5} opacity={0.4} />
    </g>
  );
}

/** REMADA — inclinado para a frente; cotovelos puxam para tras. */
function Row({ accent }) {
  const pelvisY = 130;
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas em pe ligeiramente fletidas */}
      <ArticulatedLeg pivotX={pelvisX(94)} pivotY={pelvisY} thighAngle={170} shinAngle={10} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={pelvisX(106)} pivotY={pelvisY} thighAngle={185} shinAngle={-10} color={accent} footAngle={5} />

      {/* Tronco inclinado para a frente (~50°) */}
      <Torso pelvisX={100} pelvisY={pelvisY} bendAngle={50} color={accent} />

      {/* Bracos partem dos ombros (que estao agora avancados pela inclinacao)
          Como o tronco esta rodado, os ombros estao a ~ (100 + sin(50°)*36, pelvisY - cos(50°)*36)
          Vamos hardcodar a posicao final dos ombros. */}
      {/* sen(50°)≈0.766, cos(50°)≈0.643. Ombro direito = 100 + 36*0.766 = ~127.6, y = 130 - 36*0.643 ≈ 106.8 */}
      <ArticulatedArm
        pivotX={123}
        pivotY={102}
        upperAngles="-50; -50; -50"
        forearmAngles="-30; -120; -30"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        hand={false}
        endItem={<Dumbbell scale={1.05} color={accent} rotation={90} />}
      />
      <ArticulatedArm
        pivotX={130}
        pivotY={108}
        upperAngles="-55; -55; -55"
        forearmAngles="-30; -120; -30"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        hand={false}
        endItem={<Dumbbell scale={1.05} color={accent} rotation={90} />}
      />
    </g>
  );
}
function pelvisX(x) { return x; } // util para legibilidade

/** DEADLIFT — em pe; tronco inclina, joelhos flectem, barra sobe. */
function Deadlift({ accent }) {
  const pelvisY = 132;
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas — flectem ligeiramente quando o tronco se inclina */}
      <ArticulatedLeg
        pivotX={94}
        pivotY={pelvisY}
        thighAngles="178; 165; 178"
        shinAngles="2; 12; 2"
        duration="3s"
        keySplines={EASE}
        color={accent}
        footAngle={-5}
      />
      <ArticulatedLeg
        pivotX={106}
        pivotY={pelvisY}
        thighAngles="182; 195; 182"
        shinAngles="-2; -12; -2"
        duration="3s"
        keySplines={EASE}
        color={accent}
        footAngle={5}
      />
      {/* Tronco — inclina a frente ate ~55° */}
      <Torso
        pelvisX={100}
        pelvisY={pelvisY}
        bendAngles="0; 55; 0"
        duration="3s"
        keySplines={EASE}
        color={accent}
      />
      {/* Bracos — partem dos ombros (que rodam com o tronco). Modelados como
          sempre a apontar para baixo: upper=180, forearm=0. Porque o ombro
          esta dentro do <Torso> rotation, os bracos seguem a inclinacao. Mas
          como ArticulatedArm pega coordenadas absolutas, vamos animar a
          posicao do pivot tambem. Aqui usamos uma versao simplificada com
          translacao animada. */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 24; 0 0"
          dur="3s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        {/* dois bracos rectos a apontar para baixo */}
        <Bone x1={100 - P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 - P.SHOULDER_W - 1} y2={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM} color={accent} w={P.STROKE_LIMB} />
        <Bone x1={100 + P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 + P.SHOULDER_W + 1} y2={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM} color={accent} w={P.STROKE_LIMB} />
        <Joint cx={100 - P.SHOULDER_W - 0.5} cy={pelvisY - P.TORSO + P.UPPER_ARM} color={accent} />
        <Joint cx={100 + P.SHOULDER_W + 0.5} cy={pelvisY - P.TORSO + P.UPPER_ARM} color={accent} />
        <Barbell x={100} y={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM + 1} scale={1.1} color={accent} />
      </g>
    </g>
  );
}

/** AGACHAMENTO — pelvis desce, joelhos e ancas flectem, tronco inclina. */
function Squat({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        {/* pelvis translada para baixo */}
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 26; 0 0"
          dur="2.8s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        {/* Pernas — joelhos flectem ate ~85° (thigh~150, shin~50 para baixo do joelho) */}
        <ArticulatedLeg
          pivotX={94}
          pivotY={130}
          thighAngles="178; 145; 178"
          shinAngles="2; 50; 2"
          duration="2.8s"
          keySplines={EASE}
          color={accent}
          footAngle={-5}
        />
        <ArticulatedLeg
          pivotX={106}
          pivotY={130}
          thighAngles="182; 215; 182"
          shinAngles="-2; -50; -2"
          duration="2.8s"
          keySplines={EASE}
          color={accent}
          footAngle={5}
        />
        {/* Tronco inclina ligeiramente para a frente */}
        <Torso
          pelvisX={100}
          pelvisY={130}
          bendAngles="0; 18; 0"
          duration="2.8s"
          keySplines={EASE}
          color={accent}
        />
        {/* Bracos — segurar barra atras dos ombros */}
        <Bone x1={100 - P.SHOULDER_W} y1={130 - P.TORSO} x2={100 - P.SHOULDER_W - 14} y2={130 - P.TORSO + 8} color={accent} />
        <Bone x1={100 + P.SHOULDER_W} y1={130 - P.TORSO} x2={100 + P.SHOULDER_W + 14} y2={130 - P.TORSO + 8} color={accent} />
        <Barbell x={100} y={130 - P.TORSO + 4} scale={1.15} color={accent} />
      </g>
    </g>
  );
}

/** AFUNDO — uma perna a frente flexiona, perna de tras estende para tras. */
function Lunge({ accent }) {
  const pelvisY = 130;
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 16; 0 0"
          dur="2.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        {/* Perna da frente — joelho a ~90 */}
        <ArticulatedLeg
          pivotX={97}
          pivotY={pelvisY}
          thighAngles="155; 130; 155"
          shinAngles="20; 55; 20"
          duration="2.4s"
          keySplines={EASE}
          color={accent}
          footAngle={-90}
        />
        {/* Perna de tras — esticada para tras */}
        <ArticulatedLeg
          pivotX={103}
          pivotY={pelvisY}
          thighAngles="210; 230; 210"
          shinAngles="-20; -50; -20"
          duration="2.4s"
          keySplines={EASE}
          color={accent}
          footAngle={-90}
        />
        <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />
        {/* Bracos relaxados ao lado */}
        <Bone x1={100 - P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 - P.SHOULDER_W - 4} y2={pelvisY - P.TORSO + P.UPPER_ARM} color={accent} />
        <Bone x1={100 + P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 + P.SHOULDER_W + 4} y2={pelvisY - P.TORSO + P.UPPER_ARM} color={accent} />
      </g>
    </g>
  );
}

/** STIFF / ROMANIAN DEADLIFT — pernas quase rectas, tronco rota no quadril. */
function RomanianDeadlift({ accent }) {
  const pelvisY = 130;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={175} shinAngle={5} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={185} shinAngle={-5} color={accent} footAngle={5} />
      <Torso
        pelvisX={100}
        pelvisY={pelvisY}
        bendAngles="0; 70; 0"
        duration="3s"
        keySplines={EASE}
        color={accent}
      />
      {/* Bracos rectos a apontar para baixo (relativo ao tronco). Como o tronco roda, simulamos com translate animado da barra */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 28; 0 0"
          dur="3s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Bone x1={100 - P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 - P.SHOULDER_W} y2={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM} color={accent} />
        <Bone x1={100 + P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 + P.SHOULDER_W} y2={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM} color={accent} />
        <Joint cx={100 - P.SHOULDER_W} cy={pelvisY - P.TORSO + P.UPPER_ARM} color={accent} />
        <Joint cx={100 + P.SHOULDER_W} cy={pelvisY - P.TORSO + P.UPPER_ARM} color={accent} />
        <Barbell x={100} y={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM + 2} scale={1.05} color={accent} />
      </g>
    </g>
  );
}

/** LEG PRESS — deitado em angulo, pernas empurram plataforma. */
function LegPress({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Banco inclinado */}
      <line x1="22" y1="170" x2="100" y2="120" stroke={accent} strokeWidth={4} opacity={0.5} strokeLinecap="round" />
      <line x1="20" y1="155" x2="20" y2="178" stroke={accent} strokeWidth={3} opacity={0.4} />

      {/* Stickman deitado em angulo (-30°) */}
      <g transform="rotate(-30 75 130)">
        <Head cx={50} cy={130} color={accent} />
        <Bone x1={57} y1={132} x2={110} y2={132} color={accent} w={P.STROKE_BODY} />
        {/* bracos ao lado */}
        <Bone x1={70} y1={132} x2={70} y2={155} color={accent} />
        <Bone x1={88} y1={132} x2={88} y2={155} color={accent} />
        <Joint cx={70} cy={144} color={accent} />
        <Joint cx={88} cy={144} color={accent} />
      </g>

      {/* Pernas empurrando plataforma — estendem (180) → flexionam (90) */}
      <g transform="translate(115 110)">
        <ArticulatedLeg
          pivotX={0}
          pivotY={0}
          thighAngles="-50; -10; -50"
          shinAngles="-20; -50; -20"
          duration="2.6s"
          keySplines={EASE}
          color={accent}
          footAngle={-30}
        />
        <ArticulatedLeg
          pivotX={6}
          pivotY={6}
          thighAngles="-50; -10; -50"
          shinAngles="-20; -50; -20"
          duration="2.6s"
          keySplines={EASE}
          color={accent}
          footAngle={-30}
        />
      </g>
      {/* Plataforma */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; -28 16; 0 0"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <line x1="155" y1="50" x2="178" y2="100" stroke={accent} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
      </g>
    </g>
  );
}

/** LEG EXTENSION — sentado, tibia roda no joelho. */
function LegExtension({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Bench x={28} y={120} w={62} color={accent} />
      <Torso pelvisX={62} pelvisY={120} color={accent} />
      {/* coxa horizontal ate ao joelho */}
      <Bone x1={62} y1={120} x2={108} y2={122} color={accent} w={P.STROKE_BODY} />
      <Joint cx={108} cy={122} color={accent} r={P.JOINT_R + 0.5} />
      {/* tibia roda 90 → 0 (do baixo para horizontal) */}
      <g transform="translate(108 122)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="90; 0; 90"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={0} y1={0} x2={0} y2={P.SHIN} color={accent} w={P.STROKE_BODY} />
          <Foot cx={0} cy={P.SHIN} color={accent} angle={-15} />
        </g>
      </g>
      {/* segunda perna (mesma animacao) */}
      <Bone x1={62} y1={126} x2={108} y2={128} color={accent} w={P.STROKE_BODY} />
      <Joint cx={108} cy={128} color={accent} r={P.JOINT_R + 0.5} />
      <g transform="translate(108 128)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="90; 0; 90"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={0} y1={0} x2={0} y2={P.SHIN} color={accent} w={P.STROKE_BODY} />
          <Foot cx={0} cy={P.SHIN} color={accent} angle={-15} />
        </g>
      </g>
    </g>
  );
}

/** LEG CURL — deitado de bruco, tibia flecte para cima. */
function LegCurl({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <rect x="25" y="125" width="135" height="7" rx="2" fill={accent} opacity={0.5} />
      <Head cx={37} cy={120} color={accent} />
      <Bone x1={43} y1={122} x2={140} y2={123} color={accent} w={P.STROKE_BODY} />
      {/* bracos para a frente (apoiados) */}
      <Bone x1={60} y1={122} x2={48} y2={108} color={accent} />
      <Bone x1={75} y1={122} x2={62} y2={108} color={accent} />
      <Joint cx={140} cy={123} color={accent} />
      {/* tibia roda 0 → -100 (de horizontal para vertical para cima) */}
      <g transform="translate(140 123)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -110; 0"
            dur="2.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={0} y1={0} x2={P.SHIN} y2={0} color={accent} w={P.STROKE_BODY} />
          <Foot cx={P.SHIN} cy={0} color={accent} angle={0} />
        </g>
      </g>
    </g>
  );
}

/** PANTURRILHA — sobe nas pontas dos pes. */
function CalfRaise({ accent }) {
  const pelvisY = 130;
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 4; 0 -10; 0 4"
          dur="1.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />
        <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={178} shinAngle={2} color={accent} footAngle={-30} />
        <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={182} shinAngle={-2} color={accent} footAngle={-30} />
        {/* bracos relaxados */}
        <Bone x1={100 - P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 - P.SHOULDER_W - 4} y2={pelvisY - P.TORSO + P.UPPER_ARM + 4} color={accent} />
        <Bone x1={100 + P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 + P.SHOULDER_W + 4} y2={pelvisY - P.TORSO + P.UPPER_ARM + 4} color={accent} />
      </g>
    </g>
  );
}

/** PRANCHA — posicao estatica com leve respiracao. */
function Plank({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 1.5; 0 0"
          dur="2s"
          repeatCount="indefinite"
        />
        <Head cx={48} cy={120} color={accent} />
        <Bone x1={55} y1={122} x2={150} y2={134} color={accent} w={P.STROKE_BODY} />
        {/* antebracos a apoiar no chao (de baixo) */}
        <Bone x1={65} y1={123} x2={62} y2={158} color={accent} />
        <Bone x1={62} y1={158} x2={82} y2={170} color={accent} />
        <Joint cx={62} cy={158} color={accent} />
        <Bone x1={75} y1={125} x2={72} y2={158} color={accent} />
        <Bone x1={72} y1={158} x2={90} y2={170} color={accent} />
        <Joint cx={72} cy={158} color={accent} />
        {/* pernas estendidas ate aos pes */}
        <Joint cx={150} cy={134} color={accent} />
        <Bone x1={150} y1={134} x2={185} y2={172} color={accent} w={P.STROKE_BODY} />
        <Foot cx={185} cy={172} color={accent} angle={-30} />
      </g>
    </g>
  );
}

/** CRUNCH — deitado, tronco enrola subindo da anca. */
function Crunch({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas dobradas (fixas) */}
      <ArticulatedLeg pivotX={130} pivotY={140} thighAngle={45} shinAngle={45} color={accent} footAngle={-90} />
      <ArticulatedLeg pivotX={130} pivotY={146} thighAngle={45} shinAngle={45} color={accent} footAngle={-90} />
      {/* Tronco — rota no quadril */}
      <g transform="translate(130 140)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="180; 135; 180"
            dur="1.8s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={0} y1={0} x2={0} y2={P.TORSO} color={accent} w={P.STROKE_BODY} />
          {/* head */}
          <Head cx={0} cy={P.TORSO + P.NECK + P.HEAD_R} color={accent} />
          {/* bracos cruzados sobre o peito */}
          <Bone x1={-6} y1={P.TORSO * 0.55} x2={4} y2={P.TORSO * 0.7} color={accent} />
          <Bone x1={6} y1={P.TORSO * 0.55} x2={-4} y2={P.TORSO * 0.7} color={accent} />
        </g>
      </g>
    </g>
  );
}

/** LEG RAISE — deitado de costas, pernas sobem juntas. */
function LegRaise({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Tronco horizontal */}
      <Head cx={42} cy={140} color={accent} />
      <Bone x1={49} y1={142} x2={130} y2={142} color={accent} w={P.STROKE_BODY} />
      {/* bracos ao lado, palmas no chao */}
      <Bone x1={75} y1={142} x2={72} y2={172} color={accent} />
      <Bone x1={95} y1={142} x2={92} y2={172} color={accent} />

      {/* Pernas — coxa rota da anca */}
      <g transform="translate(130 142)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -90; 0"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={0} y1={0} x2={P.THIGH} y2={0} color={accent} w={P.STROKE_BODY} />
          <Joint cx={P.THIGH} cy={0} color={accent} />
          <Bone x1={P.THIGH} y1={0} x2={P.THIGH + P.SHIN} y2={2} color={accent} w={P.STROKE_BODY} />
          <Foot cx={P.THIGH + P.SHIN} cy={2} color={accent} angle={0} />
        </g>
      </g>
    </g>
  );
}

/** RUSSIAN TWIST — sentado em V; tronco roda lateral. */
function RussianTwist({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas levantadas em V (fixas) */}
      <Bone x1={100} y1={130} x2={68} y2={108} color={accent} w={P.STROKE_BODY} />
      <Bone x1={100} y1={130} x2={132} y2={108} color={accent} w={P.STROKE_BODY} />
      <Joint cx={100} cy={130} color={accent} r={P.JOINT_R + 0.5} />
      {/* Foot tips */}
      <Foot cx={68} cy={108} color={accent} angle={180} />
      <Foot cx={132} cy={108} color={accent} angle={0} />

      {/* Tronco — roda lateralmente */}
      <g transform="translate(100 130)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-30; 30; -30"
            dur="2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={0} y1={0} x2={0} y2={-P.TORSO} color={accent} w={P.STROKE_BODY} />
          <Head cx={0} cy={-P.TORSO - P.NECK - P.HEAD_R} color={accent} />
          {/* bracos juntos a frente */}
          <Bone x1={-7} y1={-P.TORSO + 4} x2={0} y2={-12} color={accent} />
          <Bone x1={7} y1={-P.TORSO + 4} x2={0} y2={-12} color={accent} />
          <Dumbbell x={0} y={-10} scale={1.2} color={accent} rotation={90} />
        </g>
      </g>
    </g>
  );
}

/** BURPEE — squat → prancha → salto. Simplificado em duas fases. */
function Burpee({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -22; 0 0"
          dur="1.8s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        {/* corpo em pe (no salto) */}
        <ArticulatedLeg pivotX={94} pivotY={130} thighAngle={178} shinAngle={2} color={accent} footAngle={-5} />
        <ArticulatedLeg pivotX={106} pivotY={130} thighAngle={182} shinAngle={-2} color={accent} footAngle={5} />
        <Torso pelvisX={100} pelvisY={130} color={accent} />
        {/* bracos sobem no salto */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={130 - P.TORSO}
          upperAngles="170; 5; 170"
          forearmAngle={0}
          duration="1.8s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={130 - P.TORSO}
          upperAngles="-170; -5; -170"
          forearmAngle={0}
          duration="1.8s"
          keySplines={EASE}
          color={accent}
        />
      </g>
      {/* setas de movimento */}
      <path
        d="M 60 100 Q 50 70 75 60"
        stroke={accent}
        strokeWidth={2}
        fill="none"
        opacity={0.45}
        strokeDasharray="3 3"
      />
      <path
        d="M 140 100 Q 150 70 125 60"
        stroke={accent}
        strokeWidth={2}
        fill="none"
        opacity={0.45}
        strokeDasharray="3 3"
      />
    </g>
  );
}

/** MOUNTAIN CLIMBER — prancha com joelhos a alternar para o peito. */
function MountainClimber({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Head cx={48} cy={118} color={accent} />
      <Bone x1={55} y1={120} x2={150} y2={132} color={accent} w={P.STROKE_BODY} />
      {/* Bracos verticais (apoiados) */}
      <Bone x1={68} y1={120} x2={68} y2={172} color={accent} />
      <Joint cx={68} cy={146} color={accent} />
      <Bone x1={80} y1={122} x2={80} y2={172} color={accent} />
      <Joint cx={80} cy={147} color={accent} />
      <Joint cx={150} cy={132} color={accent} r={P.JOINT_R + 0.5} />

      {/* Pernas a alternar */}
      <g transform="translate(150 132)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -75; 0"
            dur="0.7s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={0} y1={0} x2={P.THIGH * 0.85} y2={0} color={accent} w={P.STROKE_BODY} />
          <Joint cx={P.THIGH * 0.85} cy={0} color={accent} />
          <Bone x1={P.THIGH * 0.85} y1={0} x2={P.THIGH * 0.85 + 6} y2={P.SHIN * 0.7} color={accent} w={P.STROKE_BODY} />
          <Foot cx={P.THIGH * 0.85 + 6} cy={P.SHIN * 0.7} color={accent} angle={-90} />
        </g>
      </g>
      <g transform="translate(150 138)">
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-75; 0; -75"
            dur="0.7s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={0} y1={0} x2={P.THIGH * 0.85} y2={0} color={accent} w={P.STROKE_BODY} />
          <Joint cx={P.THIGH * 0.85} cy={0} color={accent} />
          <Bone x1={P.THIGH * 0.85} y1={0} x2={P.THIGH * 0.85 + 6} y2={P.SHIN * 0.7} color={accent} w={P.STROKE_BODY} />
          <Foot cx={P.THIGH * 0.85 + 6} cy={P.SHIN * 0.7} color={accent} angle={-90} />
        </g>
      </g>
    </g>
  );
}

/** POLICHINELOS — bracos abrem por cima, pernas afastam-se. */
function JumpingJacks({ accent }) {
  const pelvisY = 130;
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
        <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />
        {/* Bracos */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={pelvisY - P.TORSO}
          upperAngles="170; 10; 170"
          forearmAngle={0}
          duration="0.8s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={pelvisY - P.TORSO}
          upperAngles="-170; -10; -170"
          forearmAngle={0}
          duration="0.8s"
          keySplines={EASE}
          color={accent}
        />
        {/* Pernas */}
        <ArticulatedLeg
          pivotX={94}
          pivotY={pelvisY}
          thighAngles="178; 158; 178"
          shinAngles="2; 0; 2"
          duration="0.8s"
          keySplines={EASE}
          color={accent}
          footAngle={-12}
        />
        <ArticulatedLeg
          pivotX={106}
          pivotY={pelvisY}
          thighAngles="182; 202; 182"
          shinAngles="-2; 0; -2"
          duration="0.8s"
          keySplines={EASE}
          color={accent}
          footAngle={12}
        />
      </g>
    </g>
  );
}

/** KETTLEBELL SWING — hip hinge com kettlebell a oscilar. */
function KettlebellSwing({ accent }) {
  const pelvisY = 132;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={170} shinAngle={10} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={185} shinAngle={-10} color={accent} footAngle={5} />

      <Torso
        pelvisX={100}
        pelvisY={pelvisY}
        bendAngles="0; -40; 0"
        duration="2s"
        keySplines={EASE}
        color={accent}
      />

      {/* Bracos a oscilar com kettlebell */}
      <g transform={`translate(100 ${pelvisY - 4})`}>
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-90; 50; -90"
            dur="2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines={EASE}
          />
          <Bone x1={-7} y1={0} x2={0} y2={P.UPPER_ARM + P.FOREARM - 4} color={accent} />
          <Bone x1={7} y1={0} x2={0} y2={P.UPPER_ARM + P.FOREARM - 4} color={accent} />
          <g transform={`translate(0 ${P.UPPER_ARM + P.FOREARM + 6})`}>
            <Kettlebell color={accent} scale={1} />
          </g>
        </g>
      </g>
    </g>
  );
}

/** RUN IN PLACE — corre no lugar; bracos e pernas alternam. */
function RunInPlace({ accent }) {
  const pelvisY = 130;
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -3; 0 0"
          dur="0.45s"
          repeatCount="indefinite"
        />
        <Torso pelvisX={100} pelvisY={pelvisY} bendAngle={5} color={accent} />
        {/* Bracos a alternar */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={pelvisY - P.TORSO}
          upperAngles="-130; 70; -130"
          forearmAngles="-80; -80; -80"
          duration="0.7s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={pelvisY - P.TORSO}
          upperAngles="130; -70; 130"
          forearmAngles="80; 80; 80"
          duration="0.7s"
          keySplines={EASE}
          color={accent}
        />
        {/* Pernas a alternar — uma sobe (anca flecte), outra estica para tras */}
        <ArticulatedLeg
          pivotX={94}
          pivotY={pelvisY}
          thighAngles="160; 230; 160"
          shinAngles="20; -90; 20"
          duration="0.7s"
          keySplines={EASE}
          color={accent}
          footAngle={-30}
        />
        <ArticulatedLeg
          pivotX={106}
          pivotY={pelvisY}
          thighAngles="200; 130; 200"
          shinAngles="-20; 90; -20"
          duration="0.7s"
          keySplines={EASE}
          color={accent}
          footAngle={30}
        />
      </g>
    </g>
  );
}

/** DIPS — bracos paralelos, corpo desce e sobe. */
function Dips({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <line x1="48" y1="80" x2="48" y2="178" stroke={accent} strokeWidth={3} opacity={0.5} />
      <line x1="152" y1="80" x2="152" y2="178" stroke={accent} strokeWidth={3} opacity={0.5} />
      <line x1="40" y1="80" x2="80" y2="80" stroke={accent} strokeWidth={4} />
      <line x1="120" y1="80" x2="160" y2="80" stroke={accent} strokeWidth={4} />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 22; 0 0"
          dur="2.4s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Torso pelvisX={100} pelvisY={130} bendAngle={10} color={accent} />
        {/* Bracos — flectem no cotovelo, mao fixa nas barras */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={130 - P.TORSO}
          upperAngles="-30; -90; -30"
          forearmAngles="20; 90; 20"
          duration="2.4s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={130 - P.TORSO}
          upperAngles="30; 90; 30"
          forearmAngles="-20; -90; -20"
          duration="2.4s"
          keySplines={EASE}
          color={accent}
        />
        {/* Pernas dobradas atras */}
        <ArticulatedLeg
          pivotX={94}
          pivotY={130}
          thighAngle={205}
          shinAngle={-90}
          color={accent}
          footAngle={-30}
        />
        <ArticulatedLeg
          pivotX={106}
          pivotY={130}
          thighAngle={195}
          shinAngle={-80}
          color={accent}
          footAngle={-30}
        />
      </g>
    </g>
  );
}

/** ENCOLHIMENTO / SHRUG — sobe ombros segurando halteres. */
function Shrug({ accent }) {
  const pelvisY = 132;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={178} shinAngle={2} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={182} shinAngle={-2} color={accent} footAngle={5} />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -7; 0 0"
          dur="1.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />
        {/* bracos rectos para baixo com halteres */}
        <Bone x1={100 - P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 - P.SHOULDER_W} y2={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM} color={accent} />
        <Bone x1={100 + P.SHOULDER_W} y1={pelvisY - P.TORSO} x2={100 + P.SHOULDER_W} y2={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM} color={accent} />
        <Joint cx={100 - P.SHOULDER_W} cy={pelvisY - P.TORSO + P.UPPER_ARM} color={accent} />
        <Joint cx={100 + P.SHOULDER_W} cy={pelvisY - P.TORSO + P.UPPER_ARM} color={accent} />
        <Dumbbell x={100 - P.SHOULDER_W} y={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM + 4} scale={1.1} color={accent} rotation={90} />
        <Dumbbell x={100 + P.SHOULDER_W} y={pelvisY - P.TORSO + P.UPPER_ARM + P.FOREARM + 4} scale={1.1} color={accent} rotation={90} />
      </g>
    </g>
  );
}

/** FACE PULL — cabos puxam para a face, cotovelos altos. */
function FacePull({ accent }) {
  const pelvisY = 138;
  return (
    <g>
      <circle cx="100" cy="30" r="5" fill={accent} opacity={0.6} />
      <Floor color={accent} />
      <ArticulatedLeg pivotX={94} pivotY={pelvisY} thighAngle={178} shinAngle={2} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={106} pivotY={pelvisY} thighAngle={182} shinAngle={-2} color={accent} footAngle={5} />
      <Torso pelvisX={100} pelvisY={pelvisY} color={accent} />

      {/* Bracos: upper rota -90 (horizontal), forearm flecte para a face */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="-110; -100; -110"
        forearmAngles="-30; -100; -30"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={pelvisY - P.TORSO}
        upperAngles="110; 100; 110"
        forearmAngles="30; 100; 30"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
      />
      {/* cabos */}
      <line x1="80" y1="85" x2="100" y2="32" stroke={accent} strokeWidth={1.5} opacity={0.5} />
      <line x1="120" y1="85" x2="100" y2="32" stroke={accent} strokeWidth={1.5} opacity={0.5} />
    </g>
  );
}

/** HIP THRUST — costas no banco, ancas sobem com barra. */
function HipThrust({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Bench x={28} y={108} w={50} color={accent} />
      <Head cx={48} cy={102} color={accent} />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 14; 0 -6; 0 14"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        {/* Tronco horizontal-ish */}
        <Bone x1={55} y1={104} x2={130} y2={120} color={accent} w={P.STROKE_BODY} />
        <Joint cx={130} cy={120} color={accent} r={P.JOINT_R + 0.5} />
        {/* Pernas dobradas, pes no chao */}
        <ArticulatedLeg
          pivotX={130}
          pivotY={120}
          thighAngle={42}
          shinAngle={48}
          color={accent}
          footAngle={-90}
        />
        <ArticulatedLeg
          pivotX={130}
          pivotY={126}
          thighAngle={42}
          shinAngle={48}
          color={accent}
          footAngle={-90}
        />
        {/* Barra na anca */}
        <Barbell x={130} y={120} scale={0.95} color={accent} />
      </g>
    </g>
  );
}

/** GLUTE BRIDGE — deitado, anca sobe sem peso. */
function GluteBridge({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Head cx={42} cy={140} color={accent} />
      <Bone x1={49} y1={142} x2={75} y2={148} color={accent} w={P.STROKE_BODY} />
      {/* bracos ao lado (no chao) */}
      <Bone x1={62} y1={143} x2={48} y2={170} color={accent} />
      <Bone x1={62} y1={143} x2={70} y2={170} color={accent} />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -22; 0 0"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Bone x1={75} y1={148} x2={130} y2={148} color={accent} w={P.STROKE_BODY} />
        <Joint cx={130} cy={148} color={accent} r={P.JOINT_R + 0.5} />
        <ArticulatedLeg pivotX={130} pivotY={148} thighAngle={42} shinAngle={48} color={accent} footAngle={-90} />
        <ArticulatedLeg pivotX={130} pivotY={154} thighAngle={42} shinAngle={48} color={accent} footAngle={-90} />
      </g>
    </g>
  );
}

// ==========================================================================
// MAPEAMENTO PT/EN
// ==========================================================================

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

export function resolveAnimationKey(name, category) {
  const norm = normalize(name);
  if (norm && STICKMAN_ANIMATIONS[norm]) return norm;
  if (norm) {
    for (const [pattern, key] of PT_PATTERNS) {
      if (norm.includes(pattern)) return key;
    }
  }
  if (category && CATEGORY_FALLBACK[category]) {
    return CATEGORY_FALLBACK[category];
  }
  return "jumping_jacks";
}

export function resolveStickmanAnimation(name, category) {
  const key = resolveAnimationKey(name, category);
  return STICKMAN_ANIMATIONS[key] || JumpingJacks;
}
