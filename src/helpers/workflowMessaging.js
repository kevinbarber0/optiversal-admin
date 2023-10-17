import { states } from 'pg-boss';
import { getPgBoss } from '@util/pgboss';
import { WorkflowAutomationStatus } from '@util/enum';

export const CONTROL_QUEUE_NAME = 'automated-workflow-control';
export const JOB_QUEUE_NAME_PREFIX = 'automated-workflow-jobs';
export const JOB_QUEUE_NAME_MATCH = `${JOB_QUEUE_NAME_PREFIX}-*`;

export async function getWorkflowAutomationStatus(workflowId) {
  const queueName = `${JOB_QUEUE_NAME_PREFIX}-${workflowId}`;
  const boss = await getPgBoss();
  const size = await boss.getQueueSize(queueName, { before: states.completed });
  return size > 0 ? WorkflowAutomationStatus.RUNNING : WorkflowAutomationStatus.IDLE;
}

export async function sendStartWorkflowAutomationMessage(workflowId, accountId, orgId) {
  return (await getPgBoss()).send(
    CONTROL_QUEUE_NAME,
    { workflowId, userId: accountId, orgId },
    { singletonKey: workflowId }
  );
}

export async function sendCancelWorkflowAutomationMessage(workflowId) {
  const boss = await getPgBoss();
  const queueName = `${JOB_QUEUE_NAME_PREFIX}-${workflowId}`;
  await boss.deleteQueue(queueName);
}
