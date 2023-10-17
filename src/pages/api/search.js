const QueryService = require('@services/queryService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const { q, loc } = req.body;
    return QueryService.search(req.user.uid, q, loc).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
