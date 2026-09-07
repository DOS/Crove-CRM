import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { flowComponentState } from '@/workflow/states/flowComponentState';
import { workflowSelectedNodeComponentState } from '@/workflow/workflow-diagram/states/workflowSelectedNodeComponentState';
import { WorkflowStepDetail } from '@/workflow/workflow-steps/components/WorkflowStepDetail';
import { useUpdateStep } from '@/workflow/workflow-steps/hooks/useUpdateStep';
import { useUpdateWorkflowVersionTrigger } from '@/workflow/workflow-trigger/hooks/useUpdateWorkflowVersionTrigger';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const SidePanelWorkflowEditStepContent = () => {
  const flow = useAtomComponentStateValue(flowComponentState);
  const workflowSelectedNode = useAtomComponentStateValue(
    workflowSelectedNodeComponentState,
  );

  const { updateTrigger } = useUpdateWorkflowVersionTrigger();
  const { updateStep } = useUpdateStep();

  if (!isDefined(workflowSelectedNode) || !isDefined(flow)) {
    return null;
  }

  return (
    <StyledContainer>
      <WorkflowStepDetail
        stepId={workflowSelectedNode}
        trigger={flow.trigger}
        steps={flow.steps}
        onActionUpdate={updateStep}
        onTriggerUpdate={updateTrigger}
      />
    </StyledContainer>
  );
};
