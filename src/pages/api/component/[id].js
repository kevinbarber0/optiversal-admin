const ComponentService = require('@services/componentService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const componentId = req.query.id;
    return ComponentService.getById(req.user.uid, componentId).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'DELETE') {
    const componentId = req.query.id;
    return ComponentService.deleteById(req.user.uid, componentId).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
