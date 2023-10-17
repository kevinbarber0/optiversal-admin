import SharedService from '@services/sharedService';
import ContentService from '@services/contentService';
import ProductService from '@services/productService';
import WorkflowService from '@services/workflowService';
import { getWorkflowAutomationStatus, JOB_QUEUE_NAME_PREFIX } from '@helpers/workflowMessaging';
import { getPgBoss } from '@util/pgboss';
import { WorkflowAutomationStatus } from '@util/enum';

export class InvalidQueueMessage extends Error {
  constructor(errorMsg) {
    super(errorMsg);
  }
}

async function sendTodoJob(workflowId, job) {
  const boss = await getPgBoss();
  await boss.send(`${JOB_QUEUE_NAME_PREFIX}-${workflowId}`, job);
}

async function setupSharedService(userId, orgId) {
    // TODO This is required to load global state usually handled by the http
    // request in dashboard. Explicitly set the orgId context, vs using a
    // default for the user.
    await SharedService.setOrganizationId(userId, orgId);
}

// TODO don't re-start a workflow if it's already running
export async function controlQueueHandler(job) {
  try {
    console.log('start controlQueueHandler', job);

    if (!job?.data?.userId || !job?.data?.orgId || !job?.data?.workflowId) {
      throw new InvalidQueueMessage('userId, orgId and workflowId are required');
    }

    const { userId, orgId, workflowId } = job.data;

    const automationStatus = await getWorkflowAutomationStatus(workflowId);
    if (automationStatus !== WorkflowAutomationStatus.IDLE) {
      return; // Already running, nothing to do
    }

    await setupSharedService(userId, orgId);

    const { workflow } = await callService(() => WorkflowService.getById(userId, workflowId));

    // Only handle the first content type - TODO - remove support for multiple
    // content types across the app
    const contentType = workflow.contentTypes[0].value;

    console.log('load workflow todos...');
    const { products } = await callService(() => WorkflowService.getProductItemTodos(
      userId,
      workflowId,
    ));
    console.log('workflow todos loaded');

    products.forEach((product) => {
      sendTodoJob(workflowId, {
        userId,
        orgId,
        workflowId,
        sku: product.sku,
        contentType,
      });
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function todoQueueHandler(job) {
  try {
    console.log('start todoQueueHandler', job);

    const { userId, orgId, workflowId, contentType, sku } = job.data;

    await setupSharedService(userId, orgId);

    const { product } = await callService(() => ProductService.getProductWithContent(userId, sku));

    console.log('composing content...');

    const { composition: content } = await ContentService.composeProductContent(
      userId,
      product,
      contentType,
      true
    );

    callService(() => WorkflowService.saveProductWorkflowItem(
      userId,
      workflowId,
      product.sku,
      product.name,
      { content },
    ));
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function callService(serviceCall) {
  const { success, message, ...rest } = await serviceCall();

  if (!success) {
    throw new Error(message || 'Service call failed');
  }

  return rest;
}
