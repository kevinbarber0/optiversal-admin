const requireAuth = require('@api/_require-auth');
const ProductService = require('@services/productService');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return ProductService.getByAttributes(req.user.uid, req.query).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
