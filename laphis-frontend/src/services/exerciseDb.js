const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || "exercisedb.p.rapidapi.com";
const CACHE_PREFIX = "exdb_gif_";
const CACHE_MISS = "__miss__";

// Mapeamento PT → EN para exercícios comuns
const PT_TO_EN = {
  "supino": "bench press",
  "supino reto": "barbell bench press",
  "supino reto com barra": "barbell bench press",
  "supino inclinado": "incline bench press",
  "supino declinado": "decline bench press",
  "supino com halteres": "dumbbell bench press",
  "crucifixo": "dumbbell fly",
  "flexao": "push up",
  "flexoes": "push up",
  "flexoes de braco": "push up",
  "remada": "bent over row",
  "remada curvada": "bent over row",
  "remada unilateral": "one arm dumbbell row",
  "remada baixa": "seated cable row",
  "puxada": "lat pulldown",
  "puxada aberta": "wide grip lat pulldown",
  "pull": "pull up",
  "pull up": "pull up",
  "barra fixa": "pull up",
  "levantamento terra": "deadlift",
  "peso morto": "deadlift",
  "agachamento": "squat",
  "agachamento livre": "barbell squat",
  "agachamento frontal": "front squat",
  "leg press": "leg press",
  "cadeira extensora": "leg extension",
  "cadeira flexora": "leg curl",
  "leg curl": "leg curl",
  "stiff": "romanian deadlift",
  "stiff romeno": "romanian deadlift",
  "afundo": "lunge",
  "afundos": "lunge",
  "lunges": "lunge",
  "panturrilha": "calf raise",
  "gemeos": "calf raise",
  "press militar": "overhead press",
  "desenvolvimento": "shoulder press",
  "desenvolvimento militar": "overhead press",
  "elevacao lateral": "lateral raise",
  "elevacao frontal": "front raise",
  "face pull": "face pull",
  "arnold press": "arnold press",
  "encolhimento": "shrug",
  "rosca direta": "barbell curl",
  "rosca": "barbell curl",
  "rosca martelo": "hammer curl",
  "rosca scott": "preacher curl",
  "curl martelo": "hammer curl",
  "dips": "tricep dips",
  "extensao triceps": "triceps pushdown",
  "skull crusher": "skull crusher",
  "frances": "skull crusher",
  "triceps testa": "skull crusher",
  "abdominal": "crunch",
  "crunch": "crunch",
  "prancha": "plank",
  "plank": "plank",
  "elevacao de pernas": "hanging leg raise",
  "russian twist": "russian twist",
  "burpee": "burpee",
};

function normalize(s) {
  return (s || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function toEnglish(name) {
  const n = normalize(name);
  if (PT_TO_EN[n]) return PT_TO_EN[n];
  // match parcial
  for (const [pt, en] of Object.entries(PT_TO_EN)) {
    if (n.includes(pt) || pt.includes(n)) return en;
  }
  return name; // já está em inglês ou não encontrou
}

function cacheKey(name) {
  return CACHE_PREFIX + name.toLowerCase().replace(/\s+/g, "_");
}

function readCache(name) {
  try { return localStorage.getItem(cacheKey(name)); } catch { return null; }
}

function writeCache(name, value) {
  try { localStorage.setItem(cacheKey(name), value); } catch {}
}

export async function fetchExerciseGif(namePtOrEn) {
  if (!RAPIDAPI_KEY || !namePtOrEn) return null;

  const nameEn = toEnglish(namePtOrEn);
  const cached = readCache(nameEn);
  if (cached) return cached === CACHE_MISS ? null : cached;

  try {
    const res = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(nameEn.toLowerCase())}?limit=1`,
      {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      }
    );

    if (!res.ok) { writeCache(nameEn, CACHE_MISS); return null; }

    const data = await res.json();
    const gifUrl = data?.[0]?.gifUrl || null;

    writeCache(nameEn, gifUrl || CACHE_MISS);
    return gifUrl;
  } catch {
    writeCache(nameEn, CACHE_MISS);
    return null;
  }
}
