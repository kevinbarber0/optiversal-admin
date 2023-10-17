const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const accountId = req.user.uid;
    const workflow = req.body.workflow;
    const page = req.body.page;
    const action = req.body.action;

    return WorkflowService.savePageWorkflowItem(
      accountId,
      workflow,
      page,
      action,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
