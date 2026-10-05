interface AppLike {
  packageName: string;
  label: string;
}

const FINANCIAL_PACKAGE = /bank|card|pay|toss|kbstar|shinhan|woori|hana|nonghyup|ibk|kfcc|epost|wallet/i;
const FINANCIAL_LABEL = /은행|카드|페이|뱅크|증권|금융|pay/i;

export function isLikelyFinancialApp(app: AppLike): boolean {
  return FINANCIAL_PACKAGE.test(app.packageName) || FINANCIAL_LABEL.test(app.label);
}

export function sortForSelection<T extends AppLike>(apps: T[]): T[] {
  return [...apps].sort((a, b) => {
    const rank = Number(isLikelyFinancialApp(b)) - Number(isLikelyFinancialApp(a));
    return rank !== 0 ? rank : a.label.localeCompare(b.label, 'ko');
  });
}
