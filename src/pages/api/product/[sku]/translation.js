const ProductService = require('@services/productService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    //submit a translation request
    const sku = req.query.sku;
    const type = req.body.type;
    const contentType = req.body.contentType;
    const contentId = req.body.contentId;
    const language = req.body.language;
    const languageCode = req.body.languageCode;
    const content = req.body.content;
    return ProductService.createTranslation(
      req.user.uid,
      sku,
      type,
      contentType,
      contentId,
      languageCode,
      language,
      content,
    ).then((result) => res.status(200).json(result));
  } else if (req.method === 'PUT') {
    //update a translation
    const sku = req.query.sku;
    const translation = req.body;
    return ProductService.setTranslation(
      req.user.uid,
      sku,
      translation.languageCode,
      translation,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
