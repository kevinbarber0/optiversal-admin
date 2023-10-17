import { sendStartWorkflowAutomationMessage } from "./workflowMessaging";

const boss = {
  send: jest.fn(),
  getQueueSize: jest.fn(),
};

// TODO move to reusable __mock__ dir?
jest.mock('@util/pgboss', () => {
  return {
    getPgBoss: async () => boss,
  };
});

describe('workflowMessaging', () => {
  it('using pg-boss singletonKey equal to the workflow for the start message', async () => {
    const workflowId = 'workflow123';
    const accountId = 'user123';
    const orgId = 'org123';
    await sendStartWorkflowAutomationMessage(workflowId, accountId, orgId);
    expect(boss.send).toHaveBeenCalledTimes(1);

    // check call args
    const [job, options] = boss.send.mock.calls[0].slice(1);
    expect(job).toEqual({ workflowId, userId: accountId, orgId });
    expect(options).toEqual({ singletonKey: workflowId });
  });
});
