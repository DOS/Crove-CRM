import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { flowComponentState } from '@/workflow/states/flowComponentState';
import { isDefined } from 'twenty-shared/utils';

export const useFlowOrThrow = () => {
  const flow = useAtomComponentStateValue(flowComponentState);

  return (
    flow ?? {
      workflowVersionId: '',
      trigger: null,
      steps: [],
    }
  );
};
