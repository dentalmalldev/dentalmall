import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { creditService } from '@/services';

export const myCreditKeys = {
  all: ['credit'] as const,
  mine: (uid: string | undefined) => ['credit', uid] as const,
};

/**
 * The signed-in user's store credit. `balance` is a number in ₾ (0 when none or
 * signed out), so callers can simply check `balance > 0` before showing it.
 */
export function useMyCredit() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: myCreditKeys.mine(user?.uid),
    queryFn: () => creditService.getMine(user!),
    enabled: !!user,
  });

  return {
    ...query,
    balance: query.data ? parseFloat(query.data.balance) || 0 : 0,
    unseenAmount: query.data ? parseFloat(query.data.unseen.amount) || 0 : 0,
    unseenIds: query.data?.unseen.ids ?? [],
  };
}
