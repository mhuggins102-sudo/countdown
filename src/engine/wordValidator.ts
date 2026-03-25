let dictionary: Set<string> | null = null;
let dictionaryArray: string[] | null = null;

export async function loadDictionary(): Promise<void> {
  if (dictionary) return;

  const response = await fetch('/dictionary.txt');
  const text = await response.text();
  const words = text
    .split('\n')
    .map((w) => w.trim().toUpperCase())
    .filter((w) => w.length >= 2 && w.length <= 9 && /^[A-Z]+$/.test(w));

  dictionary = new Set(words);
  // Sort by descending length for the word finder
  dictionaryArray = words.sort((a, b) => b.length - a.length);
}

export function isValidWord(word: string): boolean {
  if (!dictionary) return false;
  return dictionary.has(word.toUpperCase());
}

export function canFormWord(word: string, availableLetters: string[]): boolean {
  const available = [...availableLetters.map((l) => l.toUpperCase())];
  for (const letter of word.toUpperCase()) {
    const idx = available.indexOf(letter);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

export function isValidPlay(word: string, availableLetters: string[]): boolean {
  return (
    word.length > 0 &&
    canFormWord(word, availableLetters) &&
    isValidWord(word)
  );
}

export function getDictionary(): Set<string> | null {
  return dictionary;
}

export function getDictionaryArray(): string[] | null {
  return dictionaryArray;
}

export function isDictionaryLoaded(): boolean {
  return dictionary !== null;
}
