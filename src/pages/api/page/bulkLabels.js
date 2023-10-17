const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const labels = req.body.labels;
    return PageService.bulkAddLabels(req.user.uid, labels).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
