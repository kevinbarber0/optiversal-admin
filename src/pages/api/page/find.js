const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');
const {FindPagesBy} = require('@util/enum');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const by = req.query.by;
    if(by === FindPagesBy.ResultKey) {
      const pageId = req.query.pageId;
      const resultKey = req.query.resultKey;
      return PageService.findByResultKey(req.user.uid, pageId, resultKey).then(
        (result) => res.status(200).json(result),
      );
    } else if(by === FindPagesBy.Title) {
      const title = req.query.title;
      return PageService.findByTitle(req.user.uid, title).then(
        (result) => res.status(200).json(result),
      );
    }
  } else {
    res.status(404);
  }
});
