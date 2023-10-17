const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const pageIds = req.body.pageIds;
    const status = req.body.status;
    return PageService.bulkUpdateStatus(req.user.uid, pageIds, status).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
