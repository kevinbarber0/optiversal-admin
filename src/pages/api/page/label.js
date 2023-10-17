const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const pageIds = req.body.pageIds;
    const label = req.body.label;
    return PageService.bulkAddLabel(req.user.uid, pageIds, label).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
