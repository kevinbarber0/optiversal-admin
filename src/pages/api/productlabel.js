const QueryService = require('@services/queryService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return QueryService.getProductLabels(req.user.uid, req.query.prefix).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
