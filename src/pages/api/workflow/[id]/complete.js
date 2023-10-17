const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const itemId = req.body.itemId;
    return WorkflowService.completeItem(req.user.uid, itemId).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
