const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export const EXERCISE_IMAGE_MAP = {
  // Peito
  "supino": `${BASE}/Barbell_Bench_Press_-_Medium_Grip`,
  "supino reto": `${BASE}/Barbell_Bench_Press_-_Medium_Grip`,
  "supino reto com barra": `${BASE}/Barbell_Bench_Press_-_Medium_Grip`,
  "supino inclinado": `${BASE}/Barbell_Incline_Bench_Press_-_Medium_Grip`,
  "supino declinado": `${BASE}/Decline_Barbell_Bench_Press`,
  "supino com halteres": `${BASE}/Dumbbell_Bench_Press`,
  "crucifixo": `${BASE}/Dumbbell_Flyes`,
  "crucifixo inclinado": `${BASE}/Incline_Dumbbell_Flyes`,
  "flexao": `${BASE}/Pushups`,
  "flexoes": `${BASE}/Pushups`,
  "flexoes de braco": `${BASE}/Pushups`,
  "peck deck": `${BASE}/Butterfly_Machine`,
  "crossover": `${BASE}/Cable_Crossover`,

  // Costas
  "remada": `${BASE}/Bent_Over_Barbell_Row`,
  "remada curvada": `${BASE}/Bent_Over_Barbell_Row`,
  "remada unilateral": `${BASE}/One-Arm_Dumbbell_Row`,
  "remada baixa": `${BASE}/Seated_Cable_Rows`,
  "remada cavalinho": `${BASE}/T-Bar_Row`,
  "remada com barra": `${BASE}/Bent_Over_Barbell_Row`,
  "remada com haltere": `${BASE}/One-Arm_Dumbbell_Row`,
  "puxada": `${BASE}/Wide-Grip_Lat_Pulldown`,
  "puxada aberta": `${BASE}/Wide-Grip_Lat_Pulldown`,
  "puxada fechada": `${BASE}/Close-grip_Front_Lat_Pulldown`,
  "lat pulldown": `${BASE}/Wide-Grip_Lat_Pulldown`,
  "pull": `${BASE}/Pullups`,
  "pull up": `${BASE}/Pullups`,
  "pullup": `${BASE}/Pullups`,
  "barra fixa": `${BASE}/Pullups`,
  "elevacoes": `${BASE}/Pullups`,
  "deadlift": `${BASE}/Barbell_Deadlift`,
  "levantamento terra": `${BASE}/Barbell_Deadlift`,
  "peso morto": `${BASE}/Barbell_Deadlift`,
  "hiperextensao": `${BASE}/Hyperextensions_Back_Extensions`,

  // Pernas
  "agachamento": `${BASE}/Barbell_Squat`,
  "agachamento livre": `${BASE}/Barbell_Squat`,
  "agachamento frontal": `${BASE}/Front_Barbell_Squat`,
  "agachamento sumo": `${BASE}/Wide_Stance_Barbell_Squat`,
  "agachamento com barra": `${BASE}/Barbell_Squat`,
  "leg press": `${BASE}/Leg_Press`,
  "cadeira extensora": `${BASE}/Leg_Extensions`,
  "cadeira flexora": `${BASE}/Lying_Leg_Curls`,
  "leg curl": `${BASE}/Lying_Leg_Curls`,
  "extensao de pernas": `${BASE}/Leg_Extensions`,
  "flexao de pernas": `${BASE}/Lying_Leg_Curls`,
  "stiff": `${BASE}/Romanian_Deadlift`,
  "stiff romeno": `${BASE}/Romanian_Deadlift`,
  "romanian deadlift": `${BASE}/Romanian_Deadlift`,
  "afundo": `${BASE}/Dumbbell_Lunges`,
  "afundos": `${BASE}/Dumbbell_Lunges`,
  "lunges": `${BASE}/Dumbbell_Lunges`,
  "estocada": `${BASE}/Dumbbell_Lunges`,
  "panturrilha": `${BASE}/Standing_Calf_Raises`,
  "elevacao de gemeos": `${BASE}/Standing_Calf_Raises`,
  "gemeos": `${BASE}/Standing_Calf_Raises`,
  "abdutora": `${BASE}/Thigh_Abductor`,
  "adutora": `${BASE}/Thigh_Adductor`,
  "hip thrust": `${BASE}/Barbell_Hip_Thrust`,
  "gluteo": `${BASE}/Barbell_Hip_Thrust`,

  // Ombros
  "press militar": `${BASE}/Barbell_Shoulder_Press`,
  "desenvolvimento militar": `${BASE}/Barbell_Shoulder_Press`,
  "desenvolvimento": `${BASE}/Dumbbell_Shoulder_Press`,
  "shoulder press": `${BASE}/Barbell_Shoulder_Press`,
  "elevacao lateral": `${BASE}/Side_Lateral_Raise`,
  "elevacao frontal": `${BASE}/Front_Dumbbell_Raise`,
  "face pull": `${BASE}/Face_Pull`,
  "face": `${BASE}/Face_Pull`,
  "arnold press": `${BASE}/Arnold_Dumbbell_Press`,
  "encolhimento": `${BASE}/Barbell_Shrug`,
  "shrug": `${BASE}/Barbell_Shrug`,
  "upright row": `${BASE}/Barbell_Upright_Row`,

  // Bíceps
  "rosca direta": `${BASE}/Barbell_Curl`,
  "rosca": `${BASE}/Barbell_Curl`,
  "rosca com barra": `${BASE}/Barbell_Curl`,
  "curl": `${BASE}/Barbell_Curl`,
  "rosca martelo": `${BASE}/Hammer_Curls`,
  "curl martelo": `${BASE}/Hammer_Curls`,
  "curl inclinado": `${BASE}/Incline_Dumbbell_Curl`,
  "rosca concentrada": `${BASE}/Concentration_Curls`,
  "rosca scott": `${BASE}/Preacher_Curl`,
  "preacher": `${BASE}/Preacher_Curl`,
  "rosca alternada": `${BASE}/Hammer_Curls`,

  // Tríceps
  "tricep dips": `${BASE}/Dips_-_Triceps_Version`,
  "dips": `${BASE}/Dips_-_Triceps_Version`,
  "extensao triceps": `${BASE}/Triceps_Pushdown`,
  "extensao": `${BASE}/Triceps_Pushdown`,
  "triceps polia": `${BASE}/Triceps_Pushdown`,
  "pushdown": `${BASE}/Triceps_Pushdown`,
  "skull crusher": `${BASE}/EZ-Bar_Skullcrusher`,
  "frances": `${BASE}/EZ-Bar_Skullcrusher`,
  "rosca testa": `${BASE}/EZ-Bar_Skullcrusher`,
  "testa": `${BASE}/EZ-Bar_Skullcrusher`,
  "triceps testa": `${BASE}/EZ-Bar_Skullcrusher`,

  // Abdómen
  "abdominal": `${BASE}/Crunches`,
  "crunch": `${BASE}/Crunches`,
  "crunches": `${BASE}/Crunches`,
  "prancha": `${BASE}/Plank`,
  "plank": `${BASE}/Plank`,
  "elevacao de pernas": `${BASE}/Hanging_Leg_Raise`,
  "leg raise": `${BASE}/Hanging_Leg_Raise`,
  "russian twist": `${BASE}/Russian_Twist`,
  "abdominal obliquo": `${BASE}/Russian_Twist`,

  // Cardio
  "burpee": `${BASE}/Burpee`,
  "mountain climber": `${BASE}/Mountain_Climbers`,
  "jumping jack": `${BASE}/Jumping_Jack`,
};

const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function findExerciseImageBase(name) {
  if (!name) return null;
  const norm = normalize(name);

  if (EXERCISE_IMAGE_MAP[norm]) return EXERCISE_IMAGE_MAP[norm];

  const keys = Object.keys(EXERCISE_IMAGE_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (norm.includes(key)) return EXERCISE_IMAGE_MAP[key];
  }

  return null;
}

// Um exercício só é mostrado na app se tiver imagem (2 frames: /0.jpg e /1.jpg)
// no free-exercise-db. A presença no EXERCISE_IMAGE_MAP é essa garantia.
export function hasExerciseImage(name) {
  return findExerciseImageBase(name) !== null;
}
