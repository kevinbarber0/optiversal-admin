const requireAuth = require('@api/_require-auth');
const SearchServices = require('@services/searchServices');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    //get all active accounts
    const accountID = req.user.uid;
    const title = req.query.title;
    const pageId = req.query.pageId;
    const pinned = req.query.pinned;
    const excluded = req.query.excluded;
    const external = req.query.external;

    return SearchServices.searchRelatedPages(
      accountID,
      title,
      pageId,
      pinned,
      excluded,
      external,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
