const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return WorkflowService.getWorkflows(req.user.uid).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'PUT') {
    //update workflow settings
    const settings = req.body;
    return WorkflowService.updateSettings(req.user.uid, settings).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
