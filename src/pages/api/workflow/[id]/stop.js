const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth(async (req, res) => {
  if (req.method === 'PUT') {
    const workflowId = req.query.id;
    const result = await WorkflowService.stopAutomation(
      req.user.uid,
      workflowId,
    );
    res.json(result);
  } else {
    res.status(404);
  }
});
