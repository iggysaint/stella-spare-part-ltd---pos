/**
 * Fuzzy & Spelling-Tolerant Search Utility for Stella Spare Part Ltd
 * Specifically designed for mum: matches even with typos, transposed letters,
 * phonetic approximations, or partial words.
 */

// Common phonetic or typing substitutions in Ghanaian auto parts shop context
const SPELLING_ALIASES: Record<string, string[]> = {
  brake: ['brak', 'braek', 'brek', 'break', 'brakes', 'breke'],
  pad: ['pads', 'padd', 'pat'],
  disc: ['disk', 'diks', 'dics'],
  shoe: ['shu', 'sho', 'shoo', 'shoes'],
  filter: ['filtr', 'fita', 'filta', 'fltr', 'filtre'],
  oil: ['oel', 'oyle', 'oyl'],
  clutch: ['cluch', 'klutch', 'kluch', 'clutsh'],
  sprinter: ['spritr', 'sprinta', 'sprita', 'sprinte', 'sprinter', 'benz'],
  hiace: ['hias', 'hi-ace', 'hayas', 'hyace', 'toyota'],
  absorber: ['absober', 'absorba', 'shok', 'shock', 'shocks'],
  pump: ['pomp', 'pamp', 'pum'],
  water: ['wata', 'wota'],
  alternator: ['altrnator', 'altinator', 'oltinator', 'altanator'],
  battery: ['batri', 'batry', 'betry', 'batery'],
  radiator: ['radiatr', 'radator', 'reditor', 'radata'],
  motor: ['mota', 'moto'],
  bearing: ['baring', 'bering', 'barin'],
  plug: ['plog', 'plag'],
  belt: ['bet', 'belte'],
  suspension: ['suspenshn', 'suspenshion'],
};

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[-_/]/g, ' ');
}

// Simple Levenshtein distance
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if a search term matches any word in the target text,
 * accounting for substrings, aliases, and slight spelling mistakes.
 */
export function fuzzyMatch(query: string, targetText: string): boolean {
  const normQuery = normalize(query);
  const normTarget = normalize(targetText);

  if (!normQuery) return true;
  if (normTarget.includes(normQuery)) return true;

  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  const targetWords = normTarget.split(/\s+/).filter(Boolean);

  // Every word in query should loosely match at least one word in target
  return queryWords.every((qWord) => {
    // 1. Direct substring
    if (normTarget.includes(qWord)) return true;

    // 2. Check aliases
    for (const [canonical, aliases] of Object.entries(SPELLING_ALIASES)) {
      if (canonical.includes(qWord) || aliases.some((a) => a.includes(qWord))) {
        if (normTarget.includes(canonical) || aliases.some((a) => normTarget.includes(a))) {
          return true;
        }
      }
    }

    // 3. Check Levenshtein distance on words
    return targetWords.some((tWord) => {
      // Allow 1 typo for words of length 4-6, 2 typos for 7+
      const maxDistance = qWord.length <= 4 ? 1 : qWord.length <= 7 ? 2 : 3;
      return levenshtein(qWord, tWord) <= maxDistance;
    });
  });
}
