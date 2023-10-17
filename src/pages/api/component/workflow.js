const ComponentService = require('@services/componentService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return ComponentService.getWorkflowComponents(req.user.uid).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
