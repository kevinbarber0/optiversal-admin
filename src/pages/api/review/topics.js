const requireAuth = require('@api/_require-auth');
const SearchServices = require('@services/searchServices');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    //get all active accounts
    const accountId = req.user.uid;
    const at = req.query.at;
    const query = req.query.query;

    return SearchServices.searchAnnotationTopics(accountId, at, query).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
