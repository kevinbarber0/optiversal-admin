/**
 * @jest-environment node
 */

import { controlQueueHandler, InvalidQueueMessage } from './workflow';
import WorkflowService from '@services/workflowService';

const boss = {
  send: jest.fn(),
  getQueueSize: jest.fn(),
};

jest.mock('@services/sharedService');
jest.mock('@services/workflowService');
jest.mock('@util/pgboss', () => {
  return {
    getPgBoss: async () => boss,
  };
});

const mockJob = {
  data: {
    userId: 'user123',
    orgId: 'org123',
    workflowId: 'workflow456',
  },
};

describe('controlQueueHandler', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('handles a bad job', async () => {
    const badJobDatas = [
      {},
      { userId: '123'},
      { workflowId: '456'},
      { userId: '123', workflowId: '456' },
      { userId: '123', workflowId: '' },
    ];

    expect.assertions(badJobDatas.length);

    for (const data of badJobDatas) {
      try {
        await controlQueueHandler({ data });
      } catch(err) {
        expect(err).toBeInstanceOf(InvalidQueueMessage);
      }
    }
  });

  it('handles a job start message & creates work items', async () => {
    // TODO only value is used from contentTypes
    WorkflowService.getById.mockResolvedValue({ success: true, workflow: { contentTypes: [{ value: 'Product Description'}] } });

    const products = [
      { sku: 'sku-1' },
      { sku: 'sku-2' },
    ];

    WorkflowService.getProductItemTodos.mockResolvedValue({ success: true, products });
    await controlQueueHandler(mockJob);
    expect(WorkflowService.getById).toHaveBeenCalledTimes(1);
    expect(WorkflowService.getById.mock.calls[0]).toEqual(['user123', 'workflow456']);
    expect(WorkflowService.getProductItemTodos).toHaveBeenCalledTimes(1);
    expect(boss.send).toHaveBeenCalledTimes(2);
  });

  it('handles a job start message with error from workflow service', async () => {
    WorkflowService.getById.mockResolvedValue({ success: false, message: 'some error' });

    try {
      await controlQueueHandler(mockJob);
    } catch(err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('some error');
    }
  });

  it('handles a job start message, with no more work to be done', async () => {
    WorkflowService.getById.mockResolvedValue({ success: true, workflow: { contentTypes: [{ value: 'Product Description'}] } });

    // no work to be done
    const products = [];

    WorkflowService.getProductItemTodos.mockResolvedValue({ success: true, products });
    await controlQueueHandler(mockJob);
    expect(WorkflowService.getProductItemTodos).toHaveBeenCalledTimes(1);
    expect(boss.send).toHaveBeenCalledTimes(0);
  });

  it('ignores an automation start message if there is already workflow work being done', async () => {
    WorkflowService.getById.mockResolvedValue({ success: true, workflow: { contentTypes: [{ value: 'Product Description'}] } });

    const products = [
      { sku: 'sku-1' },
      { sku: 'sku-2' },
    ];

    WorkflowService.getProductItemTodos.mockResolvedValue({ success: true, products });
    await controlQueueHandler(mockJob);
    expect(WorkflowService.getProductItemTodos).toHaveBeenCalledTimes(1);
    expect(boss.send).toHaveBeenCalledTimes(2);

    // simulate queued up work
    boss.getQueueSize.mockResolvedValue(2);

    await controlQueueHandler(mockJob);
    // the following should not have been called again, count should match above
    expect(WorkflowService.getProductItemTodos).toHaveBeenCalledTimes(1);
    expect(boss.send).toHaveBeenCalledTimes(2);
  });
})
