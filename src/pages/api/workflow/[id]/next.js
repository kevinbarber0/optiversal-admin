const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const workflowId = req.query.id;
    return WorkflowService.getNextProduct(req.user.uid, workflowId).then(
      (result) => res.status(200).json(result),
    );
  } else if (req.method === 'POST') {
    const workflowId = req.query.id;
    const params = req.body;
    return WorkflowService.saveProductWorkflowItem(
      req.user.uid,
      workflowId,
      params.sku,
      params.name,
      params.content,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
