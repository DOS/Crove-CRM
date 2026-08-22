import { useHasMultipleAuthMethods } from '@/auth/sign-in-up/hooks/useHasMultipleAuthMethods';
import { useSignInWithDosId } from '@/auth/sign-in-up/hooks/useSignInWithDosId';
import { lastAuthenticatedMethodState } from '@/auth/states/lastAuthenticatedMethodState';
import {
  SignInUpStep,
  signInUpStepState,
} from '@/auth/states/signInUpStepState';
import { AuthenticatedMethod } from '@/auth/types/AuthenticatedMethod.enum';
import { type SocialSSOSignInUpActionType } from '@/auth/types/socialSSOSignInUp.type';
import { useLingui } from '@lingui/react/macro';
import { memo, useContext } from 'react';
import { IconShield } from 'twenty-ui/icon';
import { HorizontalSeparator } from 'twenty-ui/layout';
import { MainButton } from 'twenty-ui/input';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { LastUsedPill } from './LastUsedPill';
import { StyledSSOButtonContainer } from './SignInUpSSOButtonStyles';
import { ThemeContext } from 'twenty-ui/theme-constants';

const DosIdIcon = memo(() => {
  const { theme } = useContext(ThemeContext);
  return <IconShield size={theme.icon.size.md} />;
});

export const SignInUpWithDosId = ({
  action,
  isGlobalScope,
}: {
  action: SocialSSOSignInUpActionType;
  isGlobalScope?: boolean;
}) => {
  const { t } = useLingui();
  const signInUpStep = useAtomStateValue(signInUpStepState);
  const [lastAuthenticatedMethod, setLastAuthenticatedMethod] = useAtomState(
    lastAuthenticatedMethodState,
  );
  const { signInWithDosId } = useSignInWithDosId();
  const hasMultipleAuthMethods = useHasMultipleAuthMethods();

  const handleClick = () => {
    setLastAuthenticatedMethod(AuthenticatedMethod.DOS_ID);
    signInWithDosId({ action });
  };

  const isLastUsed = lastAuthenticatedMethod === AuthenticatedMethod.DOS_ID;

  return (
    <>
      <StyledSSOButtonContainer>
        <MainButton
          Icon={DosIdIcon}
          title={t`Continue with DOS ID`}
          onClick={handleClick}
          variant={signInUpStep === SignInUpStep.Init ? undefined : 'secondary'}
          fullWidth
        />
        {isLastUsed && (isGlobalScope || hasMultipleAuthMethods) && (
          <LastUsedPill />
        )}
      </StyledSSOButtonContainer>
      <HorizontalSeparator visible={false} />
    </>
  );
};
