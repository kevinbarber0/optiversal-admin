const QueryService = require('@services/queryService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    //return ProductService.getProducts(req.user.uid, req.query.keyword).then(result => res.status(200).json(result));
    return QueryService.nameSkuSearch(req.user.uid, req.query.keyword, 20).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
