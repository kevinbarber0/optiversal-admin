const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const query = req.query.q;
    return WorkflowService.getIdeaWorkflowsByUser(req.user.uid, query).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
