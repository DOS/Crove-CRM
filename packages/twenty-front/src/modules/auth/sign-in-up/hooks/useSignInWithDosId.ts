import { useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/auth/hooks/useAuth';
import { type BillingCheckoutSession } from '@/auth/types/BillingCheckoutSession';
import { type SocialSsoSignInUpActionType } from '@/auth/types/SocialSsoSignInUpActionType';

export const useSignInWithDosId = () => {
  const workspaceInviteHash = useParams().workspaceInviteHash;
  const [searchParams] = useSearchParams();
  const workspacePersonalInviteToken =
    searchParams.get('inviteToken') ?? undefined;

  const { signInWithDosId } = useAuth();

  return {
    signInWithDosId: ({
      action,
      billingCheckoutSession,
    }: {
      action: SocialSsoSignInUpActionType;
      billingCheckoutSession?: BillingCheckoutSession;
    }) =>
      signInWithDosId({
        workspaceInviteHash,
        workspacePersonalInviteToken,
        billingCheckoutSession,
        action,
      }),
  };
};
