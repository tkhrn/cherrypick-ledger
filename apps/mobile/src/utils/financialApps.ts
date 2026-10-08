interface AppLike {
  packageName: string;
  label: string;
}

const FINANCIAL_PACKAGE = /bank|card|pay|toss|kbstar|shinhan|woori|hana|nonghyup|ibk|kfcc|epost|wallet/i;
const FINANCIAL_LABEL = /은행|카드|페이|뱅크|증권|금융|pay/i;

export function isLikelyFinancialApp(app: AppLike): boolean {
  return FINANCIAL_PACKAGE.test(app.packageName) || FINANCIAL_LABEL.test(app.label);
}

// localeCompare(…, 'ko')는 비교할 때마다 정렬 규칙을 새로 만들어 Hermes에서 매우 느리다. 한 번 만들어 재사용한다
const koCollator = new Intl.Collator('ko');

export function sortForSelection<T extends AppLike>(apps: T[]): T[] {
  const financial = new Set(apps.filter(isLikelyFinancialApp));
  return [...apps].sort((a, b) => {
    const rank = Number(financial.has(b)) - Number(financial.has(a));
    return rank !== 0 ? rank : koCollator.compare(a.label, b.label);
  });
}
