// Fuzzy "same person?" check between the names on a NIN record and a VIN
// record. Deliberately tolerant — records differ in spelling, ordering,
// middle names and diacritics — but strict enough that two different people
// don't pass: BOTH a surname and a given name must match.
const TOKEN_SIMILARITY_THRESHOLD = 0.75;
// Very short tokens are too easy to confuse; require exact.
const MIN_FUZZY_TOKEN_LENGTH = 3;

const tokenize = (...names: Array<string | null | undefined>): string[] =>
  names
    .filter((name): name is string => Boolean(name))
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const levenshtein = (a: string, b: string): number => {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]!;
      row[j] = Math.min(
        row[j]! + 1,
        row[j - 1]! + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return row[b.length]!;
};

const tokensSimilar = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < MIN_FUZZY_TOKEN_LENGTH) return false;
  const similarity = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  return similarity >= TOKEN_SIMILARITY_THRESHOLD;
};

const anyMatch = (needles: string[], haystack: string[]): boolean =>
  needles.some((needle) =>
    haystack.some((candidate) => tokensSimilar(needle, candidate)),
  );

export interface PersonNames {
  firstName?: string | null | undefined;
  middleName?: string | null | undefined;
  lastName?: string | null | undefined;
}

/**
 * True when the surname AND at least one given name (first or middle) of
 * `reference` appear, approximately and in any order, among `candidate`'s
 * names. Fails closed when either side has no usable names.
 */
export const namesMatch = (
  reference: PersonNames,
  candidate: PersonNames,
): boolean => {
  const referenceSurname = tokenize(reference.lastName);
  const referenceGiven = tokenize(reference.firstName, reference.middleName);
  const candidateAll = tokenize(
    candidate.firstName,
    candidate.middleName,
    candidate.lastName,
  );

  if (
    referenceSurname.length === 0 ||
    referenceGiven.length === 0 ||
    candidateAll.length === 0
  ) {
    return false;
  }

  return (
    anyMatch(referenceSurname, candidateAll) &&
    anyMatch(referenceGiven, candidateAll)
  );
};
