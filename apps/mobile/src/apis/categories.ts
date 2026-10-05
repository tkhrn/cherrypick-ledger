import { supabase, unwrap, unwrapList } from './supabase';

export interface CategoryDTO {
  id: string;
  name: string;
  icon: string;
  color_token: string;
  sort_order: number;
  archived: boolean;
}

export async function getCategories(): Promise<CategoryDTO[]> {
  return unwrapList(await supabase.from('categories').select('id, name, icon, color_token, sort_order, archived').order('sort_order'));
}

export async function createCategory(input: { name: string; icon: string; colorToken: string; sortOrder: number }) {
  unwrap(await supabase.from('categories').insert({ name: input.name, icon: input.icon, color_token: input.colorToken, sort_order: input.sortOrder }));
}

export async function updateCategory(id: string, patch: { name?: string; color_token?: string; archived?: boolean; sort_order?: number }) {
  unwrap(await supabase.from('categories').update(patch).eq('id', id));
}
