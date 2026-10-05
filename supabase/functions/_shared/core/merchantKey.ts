const CORPORATE_MARKERS = /\(주\)|㈜|주식회사|\(유\)|유한회사/g;
const COUNTRY_SUFFIX = /코리아$/;

export function merchantKey(name: string): string {
  const firstToken = name.replace(CORPORATE_MARKERS, ' ').trim().split(/\s+/)[0] ?? '';
  return firstToken.replace(COUNTRY_SUFFIX, '').toLowerCase();
}
