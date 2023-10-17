const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'PUT') {
    //update page labels
    const pageId = req.query.slugid;
    const labels = req.body.labels;
    return PageService.setLabels(req.user.uid, pageId, labels).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
