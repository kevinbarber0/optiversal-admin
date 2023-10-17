const ProductService = require('@services/productService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const sku = req.query.sku;
    return ProductService.getProductWithContent(req.user.uid, sku).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
