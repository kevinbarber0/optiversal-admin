const QueryService = require('@services/queryService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    if (req.query.categoryIds) {
      const categoryIds = Array.isArray(req.query.categoryIds)
        ? req.query.categoryIds
        : [req.query.categoryIds];
      return QueryService.getCategoryByIds(req.user.uid, categoryIds).then((result) =>
        res.status(200).json(result),
      );
    } else {
      return QueryService.getCategories(req.user.uid, req.query.prefix).then(
        (result) => res.status(200).json(result),
      );
    }
  } else {
    res.status(404);
  }
});
