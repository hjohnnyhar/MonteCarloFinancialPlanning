import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// We need to mock process.cwd() before importing persistence, so we use vi.mock
// and override the path derivation. Instead, we'll write/read directly to a tmp dir
// by mocking fs.promises at the relevant paths.

describe('persistence', () => {
  let tmpDir: string;
  let dataDir: string;
  let planFile: string;
  let originalCwd: () => string;

  beforeEach(() => {
    // Create a unique temp directory for each test
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcfp-test-'));
    dataDir = path.join(tmpDir, 'data');
    planFile = path.join(dataDir, 'plan.json');

    // Override process.cwd to point to our temp directory
    originalCwd = process.cwd;
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  });

  afterEach(async () => {
    // Restore process.cwd
    vi.restoreAllMocks();

    // Clean up temp directory
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('readPlan', () => {
    it('returns createEmptyPlan() when data/plan.json does not exist', async () => {
      // Import fresh module (after cwd mock is set)
      const { readPlan } = await import('../persistence');
      const { createEmptyPlan } = await import('../planDefaults');

      const result = await readPlan();
      const empty = createEmptyPlan();

      // Structure should match an empty plan
      expect(result.income).toEqual(empty.income);
      expect(result.expenses).toEqual(empty.expenses);
      expect(result.assets).toEqual(empty.assets);
      expect(result.liabilities).toEqual(empty.liabilities);
      expect(result.goals).toEqual([]);
      expect(result.simulationResults).toBeNull();
      expect(result.riskTolerance.score).toBe(0);
      expect(result.riskTolerance.level).toBeNull();
      expect(result.metadata.version).toBe(1);
    });

    it('returns the parsed plan object when data/plan.json exists and is valid JSON', async () => {
      const { writePlan, readPlan } = await import('../persistence');
      const { createEmptyPlan } = await import('../planDefaults');

      const plan = createEmptyPlan();

      // Write the plan first
      await writePlan(plan);

      // Now read it back
      const result = await readPlan();
      expect(result.income).toEqual(plan.income);
      expect(result.goals).toEqual([]);
      expect(result.simulationResults).toBeNull();
    });

    it('throws an error with message containing "corrupt" when data/plan.json contains invalid JSON', async () => {
      // Create the data directory and write bad JSON
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(planFile, 'this is not valid json { broken', 'utf-8');

      const { readPlan } = await import('../persistence');

      await expect(readPlan()).rejects.toThrow(/corrupt/i);
    });
  });

  describe('writePlan', () => {
    it('writes the plan as pretty-printed JSON (2-space indent) to data/plan.json', async () => {
      const { writePlan } = await import('../persistence');
      const { createEmptyPlan } = await import('../planDefaults');

      const plan = createEmptyPlan();
      await writePlan(plan);

      const raw = fs.readFileSync(planFile, 'utf-8');

      // Check pretty-printed formatting (2-space indent)
      const parsed = JSON.parse(raw);
      expect(JSON.stringify(parsed, null, 2)).toBe(raw);
    });

    it('updates plan.metadata.updatedAt to the current ISO timestamp before writing', async () => {
      const { writePlan } = await import('../persistence');
      const { createEmptyPlan } = await import('../planDefaults');

      const plan = createEmptyPlan();
      const before = Date.now();
      const result = await writePlan(plan);
      const after = Date.now();

      const savedAt = new Date(result.metadata.updatedAt).getTime();
      expect(savedAt).toBeGreaterThanOrEqual(before);
      expect(savedAt).toBeLessThanOrEqual(after);
    });

    it('increments plan.metadata.version by 1 before writing', async () => {
      const { writePlan } = await import('../persistence');
      const { createEmptyPlan } = await import('../planDefaults');

      const plan = createEmptyPlan(); // version starts at 1
      const result = await writePlan(plan);

      expect(result.metadata.version).toBe(2);
    });

    it('creates the data/ directory if it does not exist', async () => {
      const { writePlan } = await import('../persistence');
      const { createEmptyPlan } = await import('../planDefaults');

      // Ensure data dir does NOT exist yet
      expect(fs.existsSync(dataDir)).toBe(false);

      const plan = createEmptyPlan();
      await writePlan(plan);

      expect(fs.existsSync(dataDir)).toBe(true);
      expect(fs.existsSync(planFile)).toBe(true);
    });

    it('returns the updated plan with new updatedAt and version', async () => {
      const { writePlan } = await import('../persistence');
      const { createEmptyPlan } = await import('../planDefaults');

      const plan = createEmptyPlan();
      const result = await writePlan(plan);

      expect(result.metadata.version).toBe(plan.metadata.version + 1);
      expect(typeof result.metadata.updatedAt).toBe('string');
    });
  });
});
