/**
 * StickmanAnimations.jsx
 *
 * Figura humana esquematica com articulacoes anatomicas (ombro/cotovelo,
 * anca/joelho/tornozelo) animada em SVG SMIL.
 *
 * Convencao de angulos (CRITICO):
 *   Cada osso e desenhado de (0,0) a (0,L) — i.e. apontando para BAIXO.
 *   A rotacao SVG e CW visualmente (Y invertido):
 *     0    = baixo (sul)
 *     +90  = esquerda (oeste)
 *     180  = cima (norte)
 *     -90  = direita (este)
 *
 *   Stickman em pe: thighAngle=0, shinAngle=0, upperAngle=0, forearmAngle=0
 *   Stickman com bracos lateralmente: upperAngle = +90 (esq) / -90 (dir)
 *   Stickman com bracos para cima: upperAngle = +/- 180
 */

const P = {
  HEAD_R: 7.5,
  NECK: 4,
  TORSO: 36,
  SHOULDER_W: 11,
  HIP_W: 7,
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

const EASE = "0.42 0 0.58 1; 0.42 0 0.58 1";

// ==========================================================================
// PRIMITIVAS
// ==========================================================================

function Head({ cx = 0, cy = 0, color }) {
  return <circle cx={cx} cy={cy} r={P.HEAD_R} fill={color} />;
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
 * Braco articulado: pivot do ombro -> upper rotation -> cotovelo -> forearm rotation
 * upperAngles/forearmAngles: opcional, string SMIL "a; b; a"
 */
function ArticulatedArm({
  pivotX,
  pivotY,
  upperAngle = 0,
  forearmAngle = 0,
  upperLen = P.UPPER_ARM,
  forearmLen = P.FOREARM,
  upperAngles,
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
        {/* coluna sobe da pelvis (negativa em y porque "cima" e -y) */}
        <Bone x1={0} y1={0} x2={0} y2={-P.TORSO} color={color} w={P.STROKE_BODY} />
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
        <Bone
          x1={0}
          y1={-P.TORSO}
          x2={0}
          y2={-P.TORSO - P.NECK}
          color={color}
          w={P.STROKE_BODY * 0.7}
        />
        <Head cx={0} cy={-P.TORSO - P.NECK - P.HEAD_R} color={color} />
      </g>
    </g>
  );
}

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
// HELPERS PARA POSES COMUNS
// ==========================================================================

/** Stickman em pe simples — duas pernas direitas, tronco vertical, sem bracos. */
function StandingBody({ x = 100, y = 130, accent, bendAngle = 0, bendAngles, duration }) {
  return (
    <>
      <ArticulatedLeg pivotX={x - P.HIP_W} pivotY={y} thighAngle={0} shinAngle={0} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={x + P.HIP_W} pivotY={y} thighAngle={0} shinAngle={0} color={accent} footAngle={5} />
      <Torso pelvisX={x} pelvisY={y} color={accent} bendAngle={bendAngle} bendAngles={bendAngles} duration={duration} />
    </>
  );
}

// ==========================================================================
// EXERCICIOS
// ==========================================================================

/** SUPINO RETO — vista lateral; cabeca a esquerda, pes a direita.
 *  Movimento amplo: upper sweep 180->95 (UP -> UP-LEFT-far), forearm 0->150
 *  para o hand cair de y=86 (extendido) ate y~118 (perto do peito).
 *  Geometria validada: foot encosta no chao com thigh=-30, shin=+3. */
function BenchPress({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <rect x={32} y={140} width={130} height={6} rx={2} fill={accent} opacity={0.55} />
      <rect x={42} y={146} width={5} height={32} fill={accent} opacity={0.4} />
      <rect x={148} y={146} width={5} height={32} fill={accent} opacity={0.4} />

      <Head cx={52} cy={130} color={accent} />
      <Bone x1={59} y1={130} x2={132} y2={130} color={accent} w={P.STROKE_BODY} />
      <Joint cx={132} cy={130} color={accent} r={P.JOINT_R + 0.4} />

      {/* Perna dobrada com pe no chao (calculado: foot y ≈ 177.4) */}
      <ArticulatedLeg
        pivotX={132}
        pivotY={130}
        thighAngle={-30}
        shinAngle={3}
        color={accent}
        footAngle={-90}
      />

      {/* Braco com barra ligada ao hand via endItem */}
      <ArticulatedArm
        pivotX={78}
        pivotY={128}
        upperAngles="180; 95; 180"
        forearmAngles="0; 150; 0"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
        endItem={
          <g>
            <circle cx={0} cy={0} r={5.5} fill={accent} />
            <circle cx={0} cy={0} r={3} fill="rgba(0,0,0,0.25)" />
          </g>
        }
      />
    </g>
  );
}

function InclineBench({ accent }) {
  return (
    <g transform="rotate(-22 100 110)">
      <BenchPress accent={accent} />
    </g>
  );
}

/** FLEXOES — vista lateral; corpo em prancha. Corpo deslocado para BAIXO 11px
 *  para hands e foot tocarem no chao no estado de repouso (era a flutuar 11px).
 *  Geometria: shoulder y=135, hand y=179 (44px abaixo) ≈ floor (178). ✓
 *  Foot: pelvis (150, 146), thigh=-55, shin=+5 → foot y ≈ 178.8. ✓ */
function PushUp({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 8; 0 0"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Head cx={48} cy={132} color={accent} />
        <Bone x1={55} y1={134} x2={150} y2={146} color={accent} w={P.STROKE_BODY} />
        <Joint cx={150} cy={146} color={accent} r={P.JOINT_R + 0.4} />
        {/* Pernas extendidas para tras com foot no chao */}
        <ArticulatedLeg
          pivotX={150}
          pivotY={146}
          thighAngle={-55}
          shinAngle={5}
          color={accent}
          footAngle={-90}
        />
        {/* Bracos: ao descer 8px, distancia shoulder-hand = 36; triangulo 22-22-36
            implica upper=-35.1, forearm=+70.2 (hand fica planted no chao) */}
        <ArticulatedArm
          pivotX={62}
          pivotY={135}
          upperAngles="0; -35; 0"
          forearmAngles="0; 70; 0"
          duration="2.2s"
          keySplines={EASE}
          color={accent}
          upperLen={P.UPPER_ARM * 0.95}
          forearmLen={P.FOREARM * 0.95}
        />
        <ArticulatedArm
          pivotX={70}
          pivotY={137}
          upperAngles="0; -35; 0"
          forearmAngles="0; 70; 0"
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

/** PRESS MILITAR — vista frontal; bracos sobem ao alto. */
function OverheadPress({ accent }) {
  const PELV_Y = 130;
  const ShoulderL_X = 100 - P.SHOULDER_W;
  const ShoulderR_X = 100 + P.SHOULDER_W;
  const ShoulderY = PELV_Y - P.TORSO;

  return (
    <g>
      <Floor color={accent} />
      <StandingBody x={100} y={PELV_Y} accent={accent} />

      {/* LEFT arm: upper from horizontal-LEFT (90) to UP (180); forearm
          starts vertical UP relative to global (i.e. local 90), ends aligned (0) */}
      <ArticulatedArm
        pivotX={ShoulderL_X}
        pivotY={ShoulderY}
        upperAngles="90; 180; 90"
        forearmAngles="90; 0; 90"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      <ArticulatedArm
        pivotX={ShoulderR_X}
        pivotY={ShoulderY}
        upperAngles="-90; -180; -90"
        forearmAngles="-90; 0; -90"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />

      {/* Barra que sobe do peito ate acima da cabeca */}
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
        <Barbell x={100} y={ShoulderY + 8} scale={0.95} color={accent} />
      </g>
    </g>
  );
}

/** ROSCA / CURL — vista de lado (perfil), pessoa virada para a direita.
 *  Tronco vertical sem ombros bilaterais; um braco visivel a curvar.
 *  pelvisY=124 garante foot a y=178 (124 + thigh 28 + shin 26 = 178). */
function BicepCurl({ accent }) {
  const PELV_Y = 124;
  const SHOULDER_X = 105;
  const SHOULDER_Y = PELV_Y - P.TORSO;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={98} pivotY={PELV_Y} thighAngle={0} shinAngle={0} color={accent} footAngle={-30} />
      <ArticulatedLeg pivotX={102} pivotY={PELV_Y} thighAngle={0} shinAngle={0} color={accent} footAngle={-30} />

      <Bone x1={100} y1={PELV_Y} x2={100} y2={PELV_Y - P.TORSO} color={accent} w={P.STROKE_BODY} />
      <Bone x1={100} y1={PELV_Y - P.TORSO} x2={100} y2={PELV_Y - P.TORSO - P.NECK} color={accent} w={P.STROKE_BODY * 0.7} />
      <Head cx={100} cy={PELV_Y - P.TORSO - P.NECK - P.HEAD_R} color={accent} />

      <ArticulatedArm
        pivotX={SHOULDER_X}
        pivotY={SHOULDER_Y}
        upperAngle={0}
        forearmAngles="0; 175; 0"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        hand={false}
        endItem={<Dumbbell scale={1.1} color={accent} rotation={90} />}
      />
    </g>
  );
}

/** EXTENSAO TRICEP OVERHEAD — bracos ao alto; antebracos descem por tras. */
function TricepExtension({ accent }) {
  const PELV_Y = 138;
  const ShoulderY = PELV_Y - P.TORSO;
  return (
    <g>
      <Floor color={accent} />
      <StandingBody x={100} y={PELV_Y} accent={accent} />

      {/* Upper arms vertical UP (180); forearm flexes for/back from continuing.
          For LEFT: forearm goes to -120 in local (= global 180-120 = 60 = down-LEFT) */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngle={180}
        forearmAngles="0; -120; 0"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngle={180}
        forearmAngles="0; 120; 0"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      {/* Halter unico segurado por ambas as maos */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 26; 0 0"
          dur="2.2s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Dumbbell
          x={100}
          y={ShoulderY - P.UPPER_ARM - P.FOREARM}
          scale={1.3}
          color={accent}
          rotation={90}
        />
      </g>
    </g>
  );
}

/** ELEVACAO LATERAL — bracos sobem laterais ate horizontal. */
function LateralRaise({ accent }) {
  const PELV_Y = 132;
  const ShoulderY = PELV_Y - P.TORSO;
  return (
    <g>
      <Floor color={accent} />
      <StandingBody x={100} y={PELV_Y} accent={accent} />

      {/* upperAngles: 5 (down at side) -> 90 (horizontal LEFT) -> 5 */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngles="5; 90; 5"
        forearmAngle={-12}
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        endItem={<Dumbbell scale={1} color={accent} rotation={90} />}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngles="-5; -90; -5"
        forearmAngle={12}
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
  const PELV_Y = 132;
  const ShoulderY = PELV_Y - P.TORSO;
  return (
    <g>
      <Floor color={accent} />
      <StandingBody x={100} y={PELV_Y} accent={accent} />

      {/* Bracos sobem ate vertical para a frente; forearm continua aliniado */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngles="5; 175; 5"
        forearmAngle={0}
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        endItem={<Dumbbell scale={0.95} color={accent} rotation={90} />}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngles="-5; -175; -5"
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

/** PULL UP — pendurado em barra. Corpo sobe ate o queixo passar a barra.
 *  Bar a y=32. Para queixo a passar bar (head center ~y=40), pelvisY=87.5.
 *  Bracos ARM length 44: shoulder = bar+44 = 76 (extendido), pelvisY=112.
 *  Translate "0 0; 0 -25; 0 0" leva pelvis de 112 a 87. */
function PullUp({ accent }) {
  const PELVIS_Y_BASE = 112; // posicao com bracos esticados (extended hang)
  return (
    <g>
      {/* Barra fixa */}
      <line x1="40" y1="32" x2="160" y2="32" stroke={accent} strokeWidth={5} strokeLinecap="round" />
      <line x1="40" y1="14" x2="40" y2="32" stroke={accent} strokeWidth={3} />
      <line x1="160" y1="14" x2="160" y2="32" stroke={accent} strokeWidth={3} />

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -25; 0 0"
          dur="2.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        <Torso pelvisX={100} pelvisY={PELVIS_Y_BASE} color={accent} />
        {/* Pernas pendulando (slight bend) */}
        <ArticulatedLeg
          pivotX={100 - P.HIP_W}
          pivotY={PELVIS_Y_BASE}
          thighAngle={5}
          shinAngle={-8}
          color={accent}
          footAngle={-90}
        />
        <ArticulatedLeg
          pivotX={100 + P.HIP_W}
          pivotY={PELVIS_Y_BASE}
          thighAngle={-5}
          shinAngle={8}
          color={accent}
          footAngle={-90}
        />
        {/* Bracos: angulos calculados geometricamente.
            No topo (translate -25): shoulder y=51, bar y=32, distancia=19.
            Triangulo upper=22, forearm=22, hyp=19:
              elbow_perp_dist = sqrt(22^2 - 9.5^2) = 19.84
              elbow LEFT em (69.16, 41.5)
              upper angle = 116° (UP-LEFT)
              forearm cumulative angle = -115.6 → forearm local = 129°
            Estes angulos garantem hand exatamente na barra. */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={PELVIS_Y_BASE - P.TORSO}
          upperAngles="180; 116; 180"
          forearmAngles="0; 129; 0"
          duration="2.6s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={PELVIS_Y_BASE - P.TORSO}
          upperAngles="-180; -116; -180"
          forearmAngles="0; -129; 0"
          duration="2.6s"
          keySplines={EASE}
          color={accent}
        />
      </g>
    </g>
  );
}

/** LAT PULLDOWN — sentado; bracos puxam barra para baixo. */
function LatPulldown({ accent }) {
  const PELV_Y = 142;
  const ShoulderY = PELV_Y - P.TORSO;
  return (
    <g>
      <Floor color={accent} />
      {/* Polia */}
      <circle cx={100} cy={28} r={5.5} fill={accent} opacity={0.6} />
      <line x1={100} y1={14} x2={100} y2={28} stroke={accent} strokeWidth={2} opacity={0.4} />
      {/* Banco */}
      <rect x={75} y={PELV_Y + 4} width={50} height={6} rx={2} fill={accent} opacity={0.5} />
      <rect x={86} y={PELV_Y + 10} width={4} height={28} fill={accent} opacity={0.4} />
      <rect x={110} y={PELV_Y + 10} width={4} height={28} fill={accent} opacity={0.4} />

      <Torso pelvisX={100} pelvisY={PELV_Y} color={accent} />
      {/* Pernas sentadas: thigh horizontal forward (-90), shin vertical down */}
      {/* shin local angle = 90 (rotated 90 from continuing thigh => shin global = 0) */}
      <ArticulatedLeg
        pivotX={100 - P.HIP_W}
        pivotY={PELV_Y}
        thighAngle={-90}
        shinAngle={90}
        color={accent}
        footAngle={-15}
      />
      <ArticulatedLeg
        pivotX={100 + P.HIP_W}
        pivotY={PELV_Y}
        thighAngle={-90}
        shinAngle={90}
        color={accent}
        footAngle={-15}
      />

      {/* Bracos: upper from "almost vertical UP" (160 / -160) to "more lateral" (110 / -110) */}
      {/* Forearm: continues straight (0) -> flects (-30) */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngles="160; 130; 160"
        forearmAngles="0; -50; 0"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngles="-160; -130; -160"
        forearmAngles="0; 50; 0"
        duration="2.6s"
        keySplines={EASE}
        color={accent}
        hand={false}
      />
      {/* Barra puxada (de cima para baixo) */}
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
        <Barbell x={100} y={ShoulderY - P.UPPER_ARM - P.FOREARM + 10} scale={1.05} color={accent} />
      </g>
      <line x1="76" y1="32" x2="76" y2="80" stroke={accent} strokeWidth={1.5} opacity={0.4} />
      <line x1="124" y1="32" x2="124" y2="80" stroke={accent} strokeWidth={1.5} opacity={0.4} />
    </g>
  );
}

/** REMADA — inclinado para a frente (hip hinge); cotovelos puxam para tras. */
function Row({ accent }) {
  const PELV_Y = 130;
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas em pe ligeiramente fletidas */}
      <ArticulatedLeg
        pivotX={100 - P.HIP_W}
        pivotY={PELV_Y}
        thighAngle={-8}
        shinAngle={12}
        color={accent}
        footAngle={-5}
      />
      <ArticulatedLeg
        pivotX={100 + P.HIP_W}
        pivotY={PELV_Y}
        thighAngle={8}
        shinAngle={-12}
        color={accent}
        footAngle={5}
      />
      {/* Tronco inclinado para a frente (rotacao no quadril ~ -50° para frente) */}
      <Torso
        pelvisX={100}
        pelvisY={PELV_Y}
        bendAngle={-50}
        color={accent}
      />

      {/* Calcula posicao dos ombros apos rotacao do tronco em torno da pelvis (100, 130).
          torso original aponta para -y (cima). Depois de rotate(-50), aponta para -50° de cima.
          shoulder offset a partir da pelvis = (sin(-50)*TORSO, -cos(-50)*TORSO) = (-27.6, -23.1)
          Ombros em ~ (72, 107). Hombros laterais: (61, 107) e (83, 107) */}
      <ArticulatedArm
        pivotX={61}
        pivotY={107}
        upperAngles="0; 90; 0"
        forearmAngles="0; 35; 0"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        hand={false}
        endItem={<Dumbbell scale={1.05} color={accent} rotation={90} />}
      />
      <ArticulatedArm
        pivotX={83}
        pivotY={107}
        upperAngles="0; 90; 0"
        forearmAngles="0; 35; 0"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        hand={false}
        endItem={<Dumbbell scale={1.05} color={accent} rotation={90} />}
      />
    </g>
  );
}

/** DEADLIFT — em pe; tronco inclina, joelhos flectem, barra sobe. */
function Deadlift({ accent }) {
  const PELV_Y = 132;
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas — flectem ligeiramente quando o tronco se inclina */}
      <ArticulatedLeg
        pivotX={100 - P.HIP_W}
        pivotY={PELV_Y}
        thighAngles="0; -15; 0"
        shinAngles="0; 18; 0"
        duration="3s"
        keySplines={EASE}
        color={accent}
        footAngle={-5}
      />
      <ArticulatedLeg
        pivotX={100 + P.HIP_W}
        pivotY={PELV_Y}
        thighAngles="0; 15; 0"
        shinAngles="0; -18; 0"
        duration="3s"
        keySplines={EASE}
        color={accent}
        footAngle={5}
      />
      {/* Tronco inclina ate -50 (para a frente) */}
      <Torso
        pelvisX={100}
        pelvisY={PELV_Y}
        bendAngles="0; -50; 0"
        duration="3s"
        keySplines={EASE}
        color={accent}
      />
      {/* Bracos rectos a apontar globalmente para baixo. Como o tronco roda,
          modelamos com translacao animada (compromisso) */}
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
        <Bone
          x1={100 - P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 - P.SHOULDER_W}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM}
          color={accent}
        />
        <Bone
          x1={100 + P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 + P.SHOULDER_W}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM}
          color={accent}
        />
        <Joint cx={100 - P.SHOULDER_W} cy={PELV_Y - P.TORSO + P.UPPER_ARM} color={accent} />
        <Joint cx={100 + P.SHOULDER_W} cy={PELV_Y - P.TORSO + P.UPPER_ARM} color={accent} />
        <Barbell
          x={100}
          y={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM + 1}
          scale={1.1}
          color={accent}
        />
      </g>
    </g>
  );
}

/** AGACHAMENTO — vista de lado, pernas para o mesmo lado. Pelvis desce 18 px,
 *  thigh roda 0->-46 (forward tilt), shin local 0->+97 (compensa para foot
 *  ficar planted). Numeros calculados para hip-foot = 36 (squat moderado). */
function Squat({ accent }) {
  // pelvisY=124 standing -> 142 squat. Floor at 178. Foot at 178 (planted).
  return (
    <g>
      <Floor color={accent} />
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 18; 0 0"
          dur="2.8s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={EASE}
        />
        {/* Pernas vista de lado, AMBAS para o mesmo lado (frente). Pivots
            ligeiramente offset para sugerir profundidade (3D em 2D). */}
        <ArticulatedLeg
          pivotX={98}
          pivotY={124}
          thighAngles="0; -46; 0"
          shinAngles="0; 97; 0"
          duration="2.8s"
          keySplines={EASE}
          color={accent}
          footAngle={-30}
        />
        <ArticulatedLeg
          pivotX={102}
          pivotY={124}
          thighAngles="0; -46; 0"
          shinAngles="0; 97; 0"
          duration="2.8s"
          keySplines={EASE}
          color={accent}
          footAngle={-30}
        />
        {/* Tronco inclina forward (-22°) para manter o centro de massa */}
        <Torso
          pelvisX={100}
          pelvisY={124}
          bendAngles="0; -22; 0"
          duration="2.8s"
          keySplines={EASE}
          color={accent}
        />
        {/* Sem barra — animacao usada tanto para squat com barra como peso corporal */}
      </g>
    </g>
  );
}

/** AFUNDO / LUNGE. */
function Lunge({ accent }) {
  const PELV_Y = 124;
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
        {/* Perna da frente (LEFT step): thigh forward-LEFT (+30), shin vertical down */}
        <ArticulatedLeg
          pivotX={100 - P.HIP_W + 3}
          pivotY={PELV_Y}
          thighAngles="0; 30; 0"
          shinAngles="0; -30; 0"
          duration="2.4s"
          keySplines={EASE}
          color={accent}
          footAngle={-90}
        />
        {/* Perna de tras: thigh back-RIGHT (-25), shin angled forward */}
        <ArticulatedLeg
          pivotX={100 + P.HIP_W - 3}
          pivotY={PELV_Y}
          thighAngles="0; -30; 0"
          shinAngles="0; 50; 0"
          duration="2.4s"
          keySplines={EASE}
          color={accent}
          footAngle={-90}
        />
        <Torso pelvisX={100} pelvisY={PELV_Y} color={accent} />
        {/* Bracos relaxados ao lado */}
        <Bone
          x1={100 - P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 - P.SHOULDER_W - 3}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM}
          color={accent}
        />
        <Bone
          x1={100 + P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 + P.SHOULDER_W + 3}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM}
          color={accent}
        />
      </g>
    </g>
  );
}

/** ROMANIAN DEADLIFT / STIFF. */
function RomanianDeadlift({ accent }) {
  const PELV_Y = 130;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg
        pivotX={100 - P.HIP_W}
        pivotY={PELV_Y}
        thighAngle={0}
        shinAngle={0}
        color={accent}
        footAngle={-5}
      />
      <ArticulatedLeg
        pivotX={100 + P.HIP_W}
        pivotY={PELV_Y}
        thighAngle={0}
        shinAngle={0}
        color={accent}
        footAngle={5}
      />
      <Torso
        pelvisX={100}
        pelvisY={PELV_Y}
        bendAngles="0; -65; 0"
        duration="3s"
        keySplines={EASE}
        color={accent}
      />
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
        <Bone
          x1={100 - P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 - P.SHOULDER_W}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM}
          color={accent}
        />
        <Bone
          x1={100 + P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 + P.SHOULDER_W}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM}
          color={accent}
        />
        <Joint cx={100 - P.SHOULDER_W} cy={PELV_Y - P.TORSO + P.UPPER_ARM} color={accent} />
        <Joint cx={100 + P.SHOULDER_W} cy={PELV_Y - P.TORSO + P.UPPER_ARM} color={accent} />
        <Barbell
          x={100}
          y={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM + 2}
          scale={1.05}
          color={accent}
        />
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
      <line
        x1="22"
        y1="170"
        x2="100"
        y2="120"
        stroke={accent}
        strokeWidth={4}
        opacity={0.5}
        strokeLinecap="round"
      />
      <line x1="20" y1="155" x2="20" y2="178" stroke={accent} strokeWidth={3} opacity={0.4} />

      {/* Stickman deitado em angulo */}
      <g transform="rotate(-30 75 130)">
        <Head cx={50} cy={130} color={accent} />
        <Bone x1={57} y1={132} x2={110} y2={132} color={accent} w={P.STROKE_BODY} />
        <Bone x1={70} y1={132} x2={70} y2={155} color={accent} />
        <Bone x1={88} y1={132} x2={88} y2={155} color={accent} />
        <Joint cx={70} cy={144} color={accent} />
        <Joint cx={88} cy={144} color={accent} />
      </g>

      {/* Pernas pressam plataforma (movem-se entre flexao e extensao) */}
      <g transform="translate(115 110)">
        <ArticulatedLeg
          pivotX={0}
          pivotY={0}
          thighAngles="-50; -10; -50"
          shinAngles="-30; -50; -30"
          duration="2.6s"
          keySplines={EASE}
          color={accent}
          footAngle={-30}
        />
        <ArticulatedLeg
          pivotX={6}
          pivotY={6}
          thighAngles="-50; -10; -50"
          shinAngles="-30; -50; -30"
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
        <line
          x1="155"
          y1="50"
          x2="178"
          y2="100"
          stroke={accent}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={0.75}
        />
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
      {/* Coxa horizontal (thigh -90 = right). */}
      {/* Shin starts pointing DOWN (local 90), extends to horizontal RIGHT (local 0). */}
      <ArticulatedLeg
        pivotX={62}
        pivotY={120}
        thighAngle={-90}
        shinAngles="90; 0; 90"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        footAngle={-15}
      />
      <ArticulatedLeg
        pivotX={62}
        pivotY={126}
        thighAngle={-90}
        shinAngles="90; 0; 90"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        footAngle={-15}
      />
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
      <Bone x1={60} y1={122} x2={48} y2={108} color={accent} />
      <Bone x1={75} y1={122} x2={62} y2={108} color={accent} />

      {/* Thigh horizontal RIGHT (-90). Shin starts continuing right (local 0),
          curls UP (local -110: global = -90 + -110 = -200 = 160 = up-LEFT). */}
      <ArticulatedLeg
        pivotX={140}
        pivotY={123}
        thighAngle={-90}
        shinAngles="0; -110; 0"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
        footAngle={0}
      />
    </g>
  );
}

/** PANTURRILHA / CALF RAISE. */
function CalfRaise({ accent }) {
  const PELV_Y = 130;
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
        <StandingBody x={100} y={PELV_Y} accent={accent} />
        {/* Bracos relaxados */}
        <Bone
          x1={100 - P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 - P.SHOULDER_W - 4}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM + 4}
          color={accent}
        />
        <Bone
          x1={100 + P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 + P.SHOULDER_W + 4}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM + 4}
          color={accent}
        />
      </g>
    </g>
  );
}

/** PRANCHA / PLANK — corpo deslocado para baixo igual a PushUp para hand/foot
 *  no chao. */
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
        <Head cx={48} cy={132} color={accent} />
        <Bone x1={55} y1={134} x2={150} y2={146} color={accent} w={P.STROKE_BODY} />
        {/* Antebracos apoiados no chao */}
        <Bone x1={65} y1={135} x2={62} y2={170} color={accent} />
        <Bone x1={62} y1={170} x2={82} y2={178} color={accent} />
        <Joint cx={62} cy={170} color={accent} />
        <Bone x1={75} y1={137} x2={72} y2={170} color={accent} />
        <Bone x1={72} y1={170} x2={90} y2={178} color={accent} />
        <Joint cx={72} cy={170} color={accent} />
        {/* Pernas estendidas com foot no chao */}
        <Joint cx={150} cy={146} color={accent} r={P.JOINT_R + 0.4} />
        <ArticulatedLeg
          pivotX={150}
          pivotY={146}
          thighAngle={-55}
          shinAngle={5}
          color={accent}
          footAngle={-90}
        />
      </g>
    </g>
  );
}

/** CRUNCH / ABDOMINAL — deitado de costas no chao (pelvis y=175, perto do chao).
 *  Joelhos UP (above body): thigh=-135 (UP-RIGHT), shin local=+105 (perpendicular).
 *  Tronco enrola: rotate(-90) base (spine LEFT) animado 0->+45 (head curls UP-RIGHT). */
function Crunch({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas com knees UP (joelho mais alto que pelvis) e foot no chao */}
      <ArticulatedLeg
        pivotX={128}
        pivotY={175}
        thighAngle={-135}
        shinAngle={105}
        color={accent}
        footAngle={-90}
      />
      <ArticulatedLeg
        pivotX={132}
        pivotY={175}
        thighAngle={-135}
        shinAngle={105}
        color={accent}
        footAngle={-90}
      />
      {/* Tronco curl-up. Pelvis no chao a (130, 175).
          rotate(-90) inicial = spine LEFT (head deitada).
          animation 0->+45 leva spine para UP-RIGHT (head em direcao aos joelhos). */}
      <g transform="translate(130 175)">
        <g transform="rotate(-90)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0; 45; 0"
              dur="1.8s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines={EASE}
            />
            <Bone x1={0} y1={0} x2={0} y2={-P.TORSO} color={accent} w={P.STROKE_BODY} />
            <Head cx={0} cy={-P.TORSO - P.NECK - P.HEAD_R} color={accent} />
            <Bone x1={-6} y1={-P.TORSO * 0.55} x2={4} y2={-P.TORSO * 0.7} color={accent} />
            <Bone x1={6} y1={-P.TORSO * 0.55} x2={-4} y2={-P.TORSO * 0.7} color={accent} />
          </g>
        </g>
      </g>
    </g>
  );
}

/** LEG RAISE — deitado, pernas sobem juntas. */
function LegRaise({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Head cx={42} cy={140} color={accent} />
      <Bone x1={49} y1={142} x2={130} y2={142} color={accent} w={P.STROKE_BODY} />
      <Bone x1={75} y1={142} x2={72} y2={172} color={accent} />
      <Bone x1={95} y1={142} x2={92} y2={172} color={accent} />

      {/* Pernas: thigh horizontal RIGHT (-90), shin continues. Animation rotates
          thigh from -90 (right) to 0 (down) — mas isto e leg raise, sobem para cima.
          Anatomicamente: thigh from horizontal to vertical UP. -90 -> 180.
          Mais simples: thigh starts -90 (right horizontal, pernas estendidas),
          rota para 180 (pernas verticais cima). */}
      <ArticulatedLeg
        pivotX={130}
        pivotY={142}
        thighAngles="-90; 180; -90"
        shinAngles="0; 0; 0"
        duration="2.4s"
        keySplines={EASE}
        color={accent}
        footAngle={0}
      />
    </g>
  );
}

/** RUSSIAN TWIST — sentado em V; tronco roda lateral. */
function RussianTwist({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      {/* Pernas levantadas em V (fixas) */}
      <ArticulatedLeg
        pivotX={100}
        pivotY={130}
        thighAngle={130}
        shinAngle={0}
        color={accent}
        footAngle={180}
      />
      <ArticulatedLeg
        pivotX={100}
        pivotY={130}
        thighAngle={-130}
        shinAngle={0}
        color={accent}
        footAngle={0}
      />
      <Joint cx={100} cy={130} color={accent} r={P.JOINT_R + 0.5} />

      {/* Tronco vertical UP rotacionando lateralmente */}
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
          <Bone x1={-7} y1={-P.TORSO + 4} x2={0} y2={-12} color={accent} />
          <Bone x1={7} y1={-P.TORSO + 4} x2={0} y2={-12} color={accent} />
          <Dumbbell x={0} y={-10} scale={1.2} color={accent} rotation={90} />
        </g>
      </g>
    </g>
  );
}

/** BURPEE — agacha + prancha + salto. Simplificado: salto vertical. */
function Burpee({ accent }) {
  const PELV_Y = 130;
  const ShoulderY = PELV_Y - P.TORSO;
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
        <StandingBody x={100} y={PELV_Y} accent={accent} />
        {/* Bracos sobem do lado para cima durante o salto */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={ShoulderY}
          upperAngles="5; 175; 5"
          forearmAngle={0}
          duration="1.8s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={ShoulderY}
          upperAngles="-5; -175; -5"
          forearmAngle={0}
          duration="1.8s"
          keySplines={EASE}
          color={accent}
        />
      </g>
      {/* Setas de movimento decorativas */}
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

/** MOUNTAIN CLIMBER. */
function MountainClimber({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Head cx={48} cy={118} color={accent} />
      <Bone x1={55} y1={120} x2={150} y2={132} color={accent} w={P.STROKE_BODY} />
      <Bone x1={68} y1={120} x2={68} y2={172} color={accent} />
      <Joint cx={68} cy={146} color={accent} />
      <Bone x1={80} y1={122} x2={80} y2={172} color={accent} />
      <Joint cx={80} cy={147} color={accent} />
      <Joint cx={150} cy={132} color={accent} r={P.JOINT_R + 0.5} />

      {/* Pernas alternam: uma estendida para tras, outra com joelho ao peito */}
      {/* thigh -90 = horizontal RIGHT (estendida); thigh -160 = back-LEFT-up (joelho perto) */}
      <ArticulatedLeg
        pivotX={150}
        pivotY={132}
        thighAngles="-50; -150; -50"
        shinAngles="-30; 90; -30"
        duration="0.8s"
        keySplines={EASE}
        color={accent}
        footAngle={-90}
      />
      <ArticulatedLeg
        pivotX={150}
        pivotY={138}
        thighAngles="-150; -50; -150"
        shinAngles="90; -30; 90"
        duration="0.8s"
        keySplines={EASE}
        color={accent}
        footAngle={-90}
      />
    </g>
  );
}

/** POLICHINELOS / JUMPING JACKS. */
function JumpingJacks({ accent }) {
  const PELV_Y = 130;
  const ShoulderY = PELV_Y - P.TORSO;
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
        <Torso pelvisX={100} pelvisY={PELV_Y} color={accent} />
        {/* Bracos: do lado (5/-5) ate quase cima e abertos (160/-160) */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={ShoulderY}
          upperAngles="5; 160; 5"
          forearmAngle={0}
          duration="0.8s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={ShoulderY}
          upperAngles="-5; -160; -5"
          forearmAngle={0}
          duration="0.8s"
          keySplines={EASE}
          color={accent}
        />
        {/* Pernas abrem lateralmente */}
        <ArticulatedLeg
          pivotX={100 - P.HIP_W}
          pivotY={PELV_Y}
          thighAngles="0; 25; 0"
          shinAngles="0; 0; 0"
          duration="0.8s"
          keySplines={EASE}
          color={accent}
          footAngle={-15}
        />
        <ArticulatedLeg
          pivotX={100 + P.HIP_W}
          pivotY={PELV_Y}
          thighAngles="0; -25; 0"
          shinAngles="0; 0; 0"
          duration="0.8s"
          keySplines={EASE}
          color={accent}
          footAngle={15}
        />
      </g>
    </g>
  );
}

/** KETTLEBELL SWING. */
function KettlebellSwing({ accent }) {
  const PELV_Y = 132;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg
        pivotX={100 - P.HIP_W}
        pivotY={PELV_Y}
        thighAngle={-8}
        shinAngle={10}
        color={accent}
        footAngle={-5}
      />
      <ArticulatedLeg
        pivotX={100 + P.HIP_W}
        pivotY={PELV_Y}
        thighAngle={8}
        shinAngle={-10}
        color={accent}
        footAngle={5}
      />
      <Torso
        pelvisX={100}
        pelvisY={PELV_Y}
        bendAngles="0; -40; 0"
        duration="2s"
        keySplines={EASE}
        color={accent}
      />
      {/* Bracos a oscilar com kettlebell */}
      <g transform={`translate(100 ${PELV_Y - 4})`}>
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

/** RUN IN PLACE. */
function RunInPlace({ accent }) {
  const PELV_Y = 130;
  const ShoulderY = PELV_Y - P.TORSO;
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
        <Torso pelvisX={100} pelvisY={PELV_Y} bendAngle={5} color={accent} />
        {/* Bracos alternam: um para tras, outro para frente */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={ShoulderY}
          upperAngles="-50; 50; -50"
          forearmAngles="80; 80; 80"
          duration="0.7s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={ShoulderY}
          upperAngles="50; -50; 50"
          forearmAngles="80; 80; 80"
          duration="0.7s"
          keySplines={EASE}
          color={accent}
        />
        {/* Pernas alternam: uma a frente, outra atras com calcanhar levantado */}
        <ArticulatedLeg
          pivotX={100 - P.HIP_W}
          pivotY={PELV_Y}
          thighAngles="-25; 25; -25"
          shinAngles="70; -5; 70"
          duration="0.7s"
          keySplines={EASE}
          color={accent}
          footAngle={-20}
        />
        <ArticulatedLeg
          pivotX={100 + P.HIP_W}
          pivotY={PELV_Y}
          thighAngles="25; -25; 25"
          shinAngles="-5; 70; -5"
          duration="0.7s"
          keySplines={EASE}
          color={accent}
          footAngle={-20}
        />
      </g>
    </g>
  );
}

/** DIPS. */
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
        {/* Bracos suportam o corpo: upper roda e cotovelo flecte */}
        <ArticulatedArm
          pivotX={100 - P.SHOULDER_W}
          pivotY={130 - P.TORSO}
          upperAngles="150; 95; 150"
          forearmAngles="-30; -85; -30"
          duration="2.4s"
          keySplines={EASE}
          color={accent}
        />
        <ArticulatedArm
          pivotX={100 + P.SHOULDER_W}
          pivotY={130 - P.TORSO}
          upperAngles="-150; -95; -150"
          forearmAngles="30; 85; 30"
          duration="2.4s"
          keySplines={EASE}
          color={accent}
        />
        {/* Pernas dobradas atras */}
        <ArticulatedLeg
          pivotX={100 - P.HIP_W}
          pivotY={130}
          thighAngle={-20}
          shinAngle={80}
          color={accent}
          footAngle={-30}
        />
        <ArticulatedLeg
          pivotX={100 + P.HIP_W}
          pivotY={130}
          thighAngle={-20}
          shinAngle={80}
          color={accent}
          footAngle={-30}
        />
      </g>
    </g>
  );
}

/** SHRUG. */
function Shrug({ accent }) {
  const PELV_Y = 124;
  return (
    <g>
      <Floor color={accent} />
      <ArticulatedLeg pivotX={100 - P.HIP_W} pivotY={PELV_Y} thighAngle={0} shinAngle={0} color={accent} footAngle={-5} />
      <ArticulatedLeg pivotX={100 + P.HIP_W} pivotY={PELV_Y} thighAngle={0} shinAngle={0} color={accent} footAngle={5} />

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
        <Torso pelvisX={100} pelvisY={PELV_Y} color={accent} />
        {/* Bracos rectos para baixo com halteres */}
        <Bone
          x1={100 - P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 - P.SHOULDER_W}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM}
          color={accent}
        />
        <Bone
          x1={100 + P.SHOULDER_W}
          y1={PELV_Y - P.TORSO}
          x2={100 + P.SHOULDER_W}
          y2={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM}
          color={accent}
        />
        <Joint cx={100 - P.SHOULDER_W} cy={PELV_Y - P.TORSO + P.UPPER_ARM} color={accent} />
        <Joint cx={100 + P.SHOULDER_W} cy={PELV_Y - P.TORSO + P.UPPER_ARM} color={accent} />
        <Dumbbell
          x={100 - P.SHOULDER_W}
          y={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM + 4}
          scale={1.1}
          color={accent}
          rotation={90}
        />
        <Dumbbell
          x={100 + P.SHOULDER_W}
          y={PELV_Y - P.TORSO + P.UPPER_ARM + P.FOREARM + 4}
          scale={1.1}
          color={accent}
          rotation={90}
        />
      </g>
    </g>
  );
}

/** FACE PULL — cabos puxam para a face. */
function FacePull({ accent }) {
  const PELV_Y = 138;
  const ShoulderY = PELV_Y - P.TORSO;
  return (
    <g>
      <circle cx="100" cy="30" r="5" fill={accent} opacity={0.6} />
      <Floor color={accent} />
      <StandingBody x={100} y={PELV_Y} accent={accent} />

      {/* Bracos: upper a 90° (horizontal lateral); forearm flexes back to face */}
      <ArticulatedArm
        pivotX={100 - P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngles="90; 100; 90"
        forearmAngles="-30; -90; -30"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
      />
      <ArticulatedArm
        pivotX={100 + P.SHOULDER_W}
        pivotY={ShoulderY}
        upperAngles="-90; -100; -90"
        forearmAngles="30; 90; 30"
        duration="2.2s"
        keySplines={EASE}
        color={accent}
      />
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
        <Bone x1={55} y1={104} x2={130} y2={120} color={accent} w={P.STROKE_BODY} />
        <Joint cx={130} cy={120} color={accent} r={P.JOINT_R + 0.5} />
        {/* Pernas dobradas, pes no chao: thigh -45°, shin local +67 → global 22° ≈ foot no chao */}
        <ArticulatedLeg
          pivotX={130}
          pivotY={120}
          thighAngle={-45}
          shinAngle={67}
          color={accent}
          footAngle={-90}
        />
        <ArticulatedLeg
          pivotX={130}
          pivotY={126}
          thighAngle={-45}
          shinAngle={67}
          color={accent}
          footAngle={-90}
        />
        <Barbell x={130} y={120} scale={0.95} color={accent} />
      </g>
    </g>
  );
}

/** GLUTE BRIDGE. */
function GluteBridge({ accent }) {
  return (
    <g>
      <Floor color={accent} />
      <Head cx={42} cy={140} color={accent} />
      <Bone x1={49} y1={142} x2={75} y2={148} color={accent} w={P.STROKE_BODY} />
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
        <ArticulatedLeg
          pivotX={130}
          pivotY={148}
          thighAngle={-45}
          shinAngle={112}
          color={accent}
          footAngle={-90}
        />
        <ArticulatedLeg
          pivotX={130}
          pivotY={154}
          thighAngle={-45}
          shinAngle={112}
          color={accent}
          footAngle={-90}
        />
      </g>
    </g>
  );
}

// ==========================================================================
// MAPEAMENTO PT/EN
// ==========================================================================

const PT_PATTERNS = [
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
