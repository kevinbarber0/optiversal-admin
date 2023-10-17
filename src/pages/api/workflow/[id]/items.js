const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const workflowId = req.query.id;
    return WorkflowService.getItems(req.user.uid, workflowId).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'POST') {
    const item = req.body.item;
    return WorkflowService.updateItem(req.user.uid, item).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'PUT') {
    const itemId = req.body.itemId;
    return WorkflowService.resetItem(req.user.uid, itemId).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
