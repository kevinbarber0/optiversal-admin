const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const options = req.body;

    return PageService.getExportDownloadUrl(req.user.uid, options).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
