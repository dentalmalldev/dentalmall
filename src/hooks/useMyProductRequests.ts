import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { productRequestsService } from '@/services';

export const myProductRequestKeys = {
  all: ['product-requests', 'mine'] as const,
  list: (uid: string | undefined) => ['product-requests', 'mine', uid] as const,
};

/** The signed-in user's requested products, newest first. */
export function useMyProductRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: myProductRequestKeys.list(user?.uid),
    queryFn: () => productRequestsService.getMine(user!),
    enabled: !!user,
    // Always refetch on opening the tab, so a request sent a moment ago shows up.
    staleTime: 0,
  });
}
