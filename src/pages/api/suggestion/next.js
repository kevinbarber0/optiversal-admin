const SuggestionService = require('@services/suggestionService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const filterLabels =
      (req.query.filterLabels &&
        (Array.isArray(req.query.filterLabels)
          ? req.query.filterLabels
          : [req.query.filterLabels])) ||
      [];
    const importedOnly = req.query.imported && req.query.imported === 'true';
    const matchType = req.query.matchType;
    const keyword = req.query.keyword;
    const workflowId = req.query.workflowId;
    return SuggestionService.getNext(
      req.user.uid,
      workflowId,
      filterLabels,
      importedOnly,
      matchType,
      keyword,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
