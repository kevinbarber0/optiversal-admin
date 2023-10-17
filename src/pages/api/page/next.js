const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const workflowId = req.query.workflowId;
    const editors =
      (req.query.editors &&
        (Array.isArray(req.query.editors)
          ? req.query.editors
          : [req.query.editors])) ||
      [];
    const templateId = req.query.templateId;
    const filterLabels =
      (req.query.filterLabels &&
        (Array.isArray(req.query.filterLabels)
          ? req.query.filterLabels
          : [req.query.filterLabels])) ||
      [];
    const matchType = req.query.matchType;
    const status = parseInt(req.query.status);
    const pageId = req.query.pageId;

    return PageService.getNext(
      req.user.uid,
      workflowId,
      editors,
      templateId,
      filterLabels,
      matchType,
      status,
      pageId,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
