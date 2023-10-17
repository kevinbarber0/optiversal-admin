const ContentService = require('@services/contentService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const contentTemplateId = req.query.ct;
    const cue = req.query.cue;
    return ContentService.getTopicSuggestions(
      req.user.uid,
      contentTemplateId,
      cue
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
