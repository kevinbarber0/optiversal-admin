const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const workflowId = req.query.id;
    return WorkflowService.getById(req.user.uid, workflowId).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'PUT') {
    const workflowId = req.query.id;
    const status = req.body.status;
    return WorkflowService.updateWorkflowStatus(
      req.user.uid,
      workflowId,
      status,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
