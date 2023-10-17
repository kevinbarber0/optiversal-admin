const requireAuth = require('@api/_require-auth');
const TranslationService = require('@services/translationService');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    //get all active accounts
    const accountID = req.user.uid;
    const targetLang = req.body.targetLang;
    const text = req.body.text;

    return TranslationService.getTranslation(accountID, targetLang, text).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
