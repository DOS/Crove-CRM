import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useCreateDraftFromWorkflowVersion } from '@/workflow/hooks/useCreateDraftFromWorkflowVersion';
import { useWorkflowWithCurrentVersion } from '@/workflow/hooks/useWorkflowWithCurrentVersion';
import { flowComponentState } from '@/workflow/states/flowComponentState';
import { workflowVisualizerWorkflowIdComponentState } from '@/workflow/states/workflowVisualizerWorkflowIdComponentState';
import { workflowVisualizerWorkflowVersionIdComponentState } from '@/workflow/states/workflowVisualizerWorkflowVersionIdComponentState';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

export const useGetUpdatableWorkflowVersionOrThrow = (instanceId?: string) => {
  const { createDraftFromWorkflowVersion } =
    useCreateDraftFromWorkflowVersion();
  const workflowVisualizerWorkflowId = useAtomComponentStateValue(
    workflowVisualizerWorkflowIdComponentState,
    instanceId,
  );
  const workflowVisualizerWorkflowVersionId = useAtomComponentStateValue(
    workflowVisualizerWorkflowVersionIdComponentState,
    instanceId,
  );
  const flow = useAtomComponentStateValue(flowComponentState, instanceId);
  const workflow = useWorkflowWithCurrentVersion(workflowVisualizerWorkflowId);

  const getUpdatableWorkflowVersion = async (): Promise<string> => {
    if (isDefined(workflow)) {
      if (workflow.currentVersion.status === 'DRAFT') {
        return workflow.currentVersion.id;
      }

      if (isDefined(workflowVisualizerWorkflowId)) {
        const draftVersionId = await createDraftFromWorkflowVersion({
          workflowId: workflowVisualizerWorkflowId,
          workflowVersionIdToCopy: workflow.currentVersion.id,
        });

        if (isDefined(draftVersionId)) {
          return draftVersionId;
        }
      }
    }

    if (isNonEmptyString(flow?.workflowVersionId)) {
      return flow.workflowVersionId;
    }

    if (isNonEmptyString(workflowVisualizerWorkflowVersionId)) {
      return workflowVisualizerWorkflowVersionId;
    }

    throw new Error('Failed to get updatable workflow version');
  };

  return { getUpdatableWorkflowVersion };
};
