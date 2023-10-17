const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const accountId = req.user.uid;
    const workflowId = req.query.id;
    const workflowType = req.body.workflowType;
    return WorkflowService.getWorkflowExportDownloadUrl(
      accountId,
      workflowId,
      workflowType,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
