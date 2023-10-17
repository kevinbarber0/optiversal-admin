const ContentService = require('@services/contentService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const skus = req.body;
    return ContentService.getProductContent(req.user.uid, skus).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'PUT') {
    const content = req.body;
    return ContentService.setProductContent(
      req.user.uid,
      content.sku,
      content.key,
      content.value,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
