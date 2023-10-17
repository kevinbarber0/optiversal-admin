const ContentTemplateService = require('@services/contentTemplateService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'PUT') {
    //update content template
    const contentTemplate = req.body;
    return ContentTemplateService.updateContentTemplate(
      req.user.uid,
      contentTemplate.contentTemplateId,
      contentTemplate.name,
      contentTemplate.content,
      contentTemplate.settings,
    ).then((result) => res.status(200).json(result));
  } else if (req.method === 'GET') {
    const offset = req.query.offset;
    const limit = req.query.limit;
    const prefix = req.query.prefix;
    if (prefix) {
      return ContentTemplateService.getAllWithPrefix(req.user.uid, prefix).then(
        (result) => res.status(200).json(result),
      );
    }
    return ContentTemplateService.getAll(req.user.uid, offset, limit).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
