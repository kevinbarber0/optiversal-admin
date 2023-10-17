const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    //get page translations
    const slug = req.query.slugid;
    return PageService.getPreviewPage(req.user.uid, slug).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
