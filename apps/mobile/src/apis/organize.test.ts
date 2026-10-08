import { createOrganizeRun } from './organize';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({ supabase: { functions: { invoke: jest.fn() } } }));

describe('createOrganizeRun', () => {
  it('returns the run result when organizing succeeded', async () => {
    jest.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: { status: 'succeeded', processed: 3 }, error: null } as never);
    await expect(createOrganizeRun()).resolves.toEqual({ status: 'succeeded', processed: 3 });
  });

  it('treats a run another batch is already doing as fine', async () => {
    jest.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: { status: 'already_running', processed: 0 }, error: null } as never);
    await expect(createOrganizeRun()).resolves.toEqual({ status: 'already_running', processed: 0 });
  });

  it('throws when the server reports the run failed', async () => {
    jest.mocked(supabase.functions.invoke).mockResolvedValueOnce({ data: { status: 'failed', processed: 0 }, error: null } as never);
    await expect(createOrganizeRun()).rejects.toThrow('organize failed');
  });
});
