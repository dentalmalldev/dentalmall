import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { purchasedProductsService } from '@/services';

export const purchasedProductKeys = {
  all: ['purchased-products'] as const,
  list: (uid: string | undefined) => ['purchased-products', uid] as const,
};

/** The signed-in user's purchased products, loaded 25 at a time. */
export function usePurchasedProducts() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: purchasedProductKeys.list(user?.uid),
    queryFn: ({ pageParam }) => purchasedProductsService.getPage(user!, pageParam),
    initialPageParam: null as string | null,
    // A null cursor ends the list, so nothing more is requested.
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled: !!user,
  });
}
