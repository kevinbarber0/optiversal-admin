const ProductService = require('@services/productService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'PUT') {
    //update suggestion labels
    const sku = req.query.sku;
    const labels = req.body.labels;
    return ProductService.setLabels(req.user.uid, sku, labels).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
