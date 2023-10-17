const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const workflowId = req.query.id;
    const offset = req.query.offset;
    const limit = req.query.limit;
    const sortBy = req.query.sortBy;
    return WorkflowService.getCompletedItems(
      req.user.uid,
      workflowId,
      offset,
      limit,
      sortBy,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
