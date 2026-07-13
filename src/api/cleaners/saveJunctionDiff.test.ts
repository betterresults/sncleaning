import { describe, expect, it } from 'vitest';

/** Mirrors the diff logic used by saveCleanerServiceTypes / saveCleanerCoverageAreas. */
function planJunctionDiff(existing: string[], desired: string[]) {
  const desiredUnique = Array.from(new Set(desired));
  const desiredSet = new Set(desiredUnique);
  const existingSet = new Set(existing);
  return {
    toDelete: existing.filter((key) => !desiredSet.has(key)),
    toInsert: desiredUnique.filter((key) => !existingSet.has(key)),
  };
}

describe('cleaner junction save diff', () => {
  it('only deletes removed keys and inserts new ones', () => {
    expect(planJunctionDiff(['domestic', 'airbnb'], ['domestic', 'commercial'])).toEqual({
      toDelete: ['airbnb'],
      toInsert: ['commercial'],
    });
  });

  it('inserts all when starting from empty', () => {
    expect(planJunctionDiff([], ['domestic', 'airbnb'])).toEqual({
      toDelete: [],
      toInsert: ['domestic', 'airbnb'],
    });
  });

  it('deletes all when clearing to empty without requiring insert-first wipe', () => {
    expect(planJunctionDiff(['domestic', 'airbnb'], [])).toEqual({
      toDelete: ['domestic', 'airbnb'],
      toInsert: [],
    });
  });

  it('no-ops when unchanged', () => {
    expect(planJunctionDiff(['domestic'], ['domestic'])).toEqual({
      toDelete: [],
      toInsert: [],
    });
  });
});
