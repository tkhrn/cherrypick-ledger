import { supabase, unwrap, unwrapList } from './supabase';

export interface GroupDTO {
  id: string;
  name: string;
  archived: boolean;
}

export async function getGroups(): Promise<GroupDTO[]> {
  return unwrapList(await supabase.from('groups').select('id, name, archived').order('created_at'));
}

export async function createGroup(name: string): Promise<GroupDTO> {
  const group = unwrap(await supabase.from('groups').insert({ name }).select('id, name, archived').single());
  if (!group) throw new Error('group was not created');
  return group;
}

export async function updateGroup(id: string, patch: { name?: string; archived?: boolean }) {
  unwrap(await supabase.from('groups').update(patch).eq('id', id));
}
