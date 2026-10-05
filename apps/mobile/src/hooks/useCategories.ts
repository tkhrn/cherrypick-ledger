import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCategory, getCategories, updateCategory } from '@/apis/categories';
import type { CategoryColorToken } from '@/constants/theme';
import type { Category } from '@/types/transaction';

const categoriesKey = ['categories'] as const;
const TEN_MINUTES_MS = 10 * 60 * 1000;

export function useCategories() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: categoriesKey, queryFn: getCategories, staleTime: TEN_MINUTES_MS });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: categoriesKey });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };
  const add = useMutation({ mutationFn: createCategory, onSettled: invalidate });
  const update = useMutation({
    mutationFn: ({ id, ...patch }: { id: string; name?: string; color_token?: string; archived?: boolean }) => updateCategory(id, patch),
    onSettled: invalidate,
  });

  const rows = query.data ?? [];
  const categories: (Category & { archived: boolean; sortOrder: number })[] = rows.map((c) => ({
    id: c.id, name: c.name, icon: c.icon, colorToken: c.color_token as CategoryColorToken, archived: c.archived, sortOrder: c.sort_order,
  }));
  return { categories, activeCategories: categories.filter((c) => !c.archived), add, update };
}
