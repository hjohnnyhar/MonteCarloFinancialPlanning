import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmptyPlan } from '../planDefaults';

// Mock the supabase module before importing persistence
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../supabase';
import { readPlan, writePlan } from '../persistence';

const mockSupabase = supabase as unknown as {
  from: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('readPlan', () => {
  it('returns createEmptyPlan() when planId is empty string', async () => {
    const result = await readPlan('');
    const empty = createEmptyPlan();

    expect(result.income).toEqual(empty.income);
    expect(result.expenses).toEqual(empty.expenses);
    expect(result.assets).toEqual(empty.assets);
    expect(result.liabilities).toEqual(empty.liabilities);
    expect(result.goals).toEqual([]);
    expect(result.simulationResults).toBeNull();
    expect(result.riskTolerance.score).toBe(0);
    expect(result.metadata.version).toBe(1);
    // supabase.from should not be called when planId is empty
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('returns plan data from Supabase for a valid planId', async () => {
    const existingPlan = createEmptyPlan();
    existingPlan.metadata.planId = 'JohnDoe03302026';
    existingPlan.metadata.preparerName = 'John Doe';
    existingPlan.metadata.version = 3;

    // Mock the Supabase query chain: .from().select().eq().single()
    const singleMock = vi.fn().mockResolvedValue({
      data: { data: existingPlan },
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockSupabase.from.mockReturnValue({ select: selectMock });

    const result = await readPlan('JohnDoe03302026');

    expect(mockSupabase.from).toHaveBeenCalledWith('plans');
    expect(selectMock).toHaveBeenCalledWith('data');
    expect(eqMock).toHaveBeenCalledWith('id', 'JohnDoe03302026');
    expect(result.metadata.planId).toBe('JohnDoe03302026');
    expect(result.metadata.preparerName).toBe('John Doe');
    expect(result.metadata.version).toBe(3);
  });

  it('returns createEmptyPlan() when Supabase returns an error', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Row not found' },
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockSupabase.from.mockReturnValue({ select: selectMock });

    const result = await readPlan('nonexistent-id');
    const empty = createEmptyPlan();

    expect(result.income).toEqual(empty.income);
    expect(result.metadata.version).toBe(1);
  });
});

describe('writePlan', () => {
  it('increments version and updates updatedAt', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({ upsert: upsertMock });

    const plan = createEmptyPlan();
    plan.metadata.planId = 'TestPlan03302026';
    plan.metadata.version = 1;

    const before = Date.now();
    const result = await writePlan(plan);
    const after = Date.now();

    expect(result.metadata.version).toBe(2);
    const savedAt = new Date(result.metadata.updatedAt).getTime();
    expect(savedAt).toBeGreaterThanOrEqual(before);
    expect(savedAt).toBeLessThanOrEqual(after);
  });

  it('calls supabase upsert with the correct shape', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({ upsert: upsertMock });

    const plan = createEmptyPlan();
    plan.metadata.planId = 'TestPlan03302026';

    await writePlan(plan);

    expect(mockSupabase.from).toHaveBeenCalledWith('plans');
    const upsertArg = upsertMock.mock.calls[0][0];
    expect(upsertArg.id).toBe('TestPlan03302026');
    expect(upsertArg.data).toBeDefined();
    expect(upsertArg.data.metadata.planId).toBe('TestPlan03302026');
    expect(typeof upsertArg.updated_at).toBe('string');
  });

  it('throws on Supabase error', async () => {
    const upsertMock = vi.fn().mockResolvedValue({
      error: { message: 'DB connection failed' },
    });
    mockSupabase.from.mockReturnValue({ upsert: upsertMock });

    const plan = createEmptyPlan();
    plan.metadata.planId = 'TestPlan03302026';

    await expect(writePlan(plan)).rejects.toThrow(/DB connection failed/);
  });
});
