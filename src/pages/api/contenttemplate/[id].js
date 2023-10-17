const ContentTemplateService = require('@services/contentTemplateService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const contentTemplateId = req.query.id;
    return ContentTemplateService.getById(req.user.uid, contentTemplateId).then(
      (result) => res.status(200).json(result),
    );
  } else if (req.method === 'DELETE') {
    const contentTemplateId = req.query.id;
    return ContentTemplateService.deleteById(
      req.user.uid,
      contentTemplateId,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
