import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGroup, getGroups, updateGroup } from '@/apis/groups';

const groupsKey = ['groups'] as const;

export interface Group {
  id: string;
  name: string;
  archived: boolean;
}

export function useGroups() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: groupsKey, queryFn: getGroups });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: groupsKey });
  const add = useMutation({ mutationFn: createGroup, onSettled: invalidate });
  const update = useMutation({ mutationFn: ({ id, ...patch }: { id: string; name?: string; archived?: boolean }) => updateGroup(id, patch), onSettled: invalidate });
  const groups: Group[] = query.data ?? [];
  return { groups, activeGroups: groups.filter((g) => !g.archived), add, update };
}
