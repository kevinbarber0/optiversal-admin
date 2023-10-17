const ComponentService = require('@services/componentService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'PUT') {
    //update component
    const component = req.body;
    return ComponentService.updateComponent(
      req.user.uid,
      component.componentId,
      component.name,
      component.settings,
    ).then((result) => res.status(200).json(result));
  } else if (req.method === 'GET') {
    const offset = req.query.offset;
    const limit = req.query.limit;
    return ComponentService.getAll(req.user.uid, offset, limit).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
