import { supabase, unwrap, unwrapList } from './supabase';

export interface SourceAppDTO {
  id: string;
  package_name: string;
  label: string;
  enabled: boolean;
}

export async function getSourceApps(): Promise<SourceAppDTO[]> {
  return unwrapList(await supabase.from('source_apps').select('id, package_name, label, enabled').order('label'));
}

/** 선택한 앱은 켜고, 나머지 기존 행은 끈다 */
export async function updateSourceApps(selected: { packageName: string; label: string }[]) {
  const selectedNames = selected.map((a) => a.packageName);
  if (selected.length > 0) {
    unwrap(await supabase.from('source_apps').upsert(
      selected.map((a) => ({ package_name: a.packageName, label: a.label, enabled: true })),
      { onConflict: 'user_id,package_name' },
    ));
  }
  const disable = supabase.from('source_apps').update({ enabled: false });
  unwrap(await (selectedNames.length > 0 ? disable.not('package_name', 'in', `(${selectedNames.map((n) => `"${n}"`).join(',')})`) : disable.neq('package_name', '')));
}
