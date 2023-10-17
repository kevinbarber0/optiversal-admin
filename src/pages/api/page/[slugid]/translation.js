const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    //get page translations
    const pageId = req.query.slugid;
    return PageService.getTranslations(req.user.uid, pageId).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'POST') {
    //submit a translation request
    const pageId = req.query.slugid;
    const type = req.body.type;
    const language = req.body.language;
    const languageCode = req.body.languageCode;
    const content = req.body.content;
    return PageService.createTranslation(
      req.user.uid,
      pageId,
      type,
      languageCode,
      language,
      content,
    ).then((result) => res.status(200).json(result));
  } else if (req.method === 'PUT') {
    //update a translation
    const pageId = req.query.slugid;
    const translation = req.body;
    return PageService.setTranslation(
      req.user.uid,
      pageId,
      translation.languageCode,
      translation,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
