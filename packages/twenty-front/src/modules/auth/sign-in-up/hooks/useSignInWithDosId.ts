import { useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/auth/hooks/useAuth';
import { type BillingCheckoutSession } from '@/auth/types/billingCheckoutSession.type';
import { type SocialSSOSignInUpActionType } from '@/auth/types/socialSSOSignInUp.type';
import {
  BillingPlanKey,
  SubscriptionInterval,
} from '~/generated-metadata/graphql';

export const useSignInWithDosId = () => {
  const workspaceInviteHash = useParams().workspaceInviteHash;
  const [searchParams] = useSearchParams();
  const workspacePersonalInviteToken =
    searchParams.get('inviteToken') ?? undefined;
  const billingCheckoutSession = {
    plan: BillingPlanKey.PRO,
    interval: SubscriptionInterval.Month,
    requirePaymentMethod: true,
  } as BillingCheckoutSession;

  const { signInWithDosId } = useAuth();

  return {
    signInWithDosId: ({ action }: { action: SocialSSOSignInUpActionType }) =>
      signInWithDosId({
        workspaceInviteHash,
        workspacePersonalInviteToken,
        billingCheckoutSession,
        action,
      }),
  };
};
