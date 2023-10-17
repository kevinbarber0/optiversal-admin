const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const workflowId = req.query.id;
    return WorkflowService.getProductCount(req.user.uid, workflowId).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
