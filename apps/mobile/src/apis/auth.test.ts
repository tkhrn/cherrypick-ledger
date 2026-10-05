import { createSessionFromCode } from './auth';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: { auth: { exchangeCodeForSession: jest.fn(async () => ({ error: null })) } },
}));

describe('createSessionFromCode', () => {
  it('exchanges the same code only once even when two paths deliver it', async () => {
    await Promise.all([createSessionFromCode('same'), createSessionFromCode('same')]);
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  });
});
