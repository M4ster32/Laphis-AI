const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || "exercisedb.p.rapidapi.com";
const CACHE_PREFIX = "exdb_gif_";
const CACHE_MISS = "__miss__";

function cacheKey(name) {
  return CACHE_PREFIX + name.toLowerCase().replace(/\s+/g, "_");
}

function readCache(name) {
  try { return localStorage.getItem(cacheKey(name)); } catch { return null; }
}

function writeCache(name, value) {
  try { localStorage.setItem(cacheKey(name), value); } catch {}
}

export async function fetchExerciseGif(nameEn) {
  if (!RAPIDAPI_KEY || !nameEn) return null;

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
