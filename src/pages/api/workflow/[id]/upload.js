const SuggestionService = require('@services/suggestionService');
const requireAuth = require('@api/_require-auth');
const multiparty = require('multiparty');

export default requireAuth(async (req, res) => {
  if (req.method === 'POST') {
    //upload keyword file
    let form = new multiparty.Form();
    let result = { success: false };
    try {
      return await form.parse(req, async function (err, fields, files) {
        try {
          if (files && files.file && files.file.length > 0) {
            return SuggestionService.uploadKeywordFile(
              req.user.uid,
              files.file[0],
            ).then((result) => res.status(200).json(result));
          }
          return res.status(result.success ? 200 : 500).json(result);
        } catch (ex) {
          console.error(ex);
          return res.sendStatus(500);
        }
      });
    } catch (ex) {
      console.error(ex);
      return res.sendStatus(500);
    }
  } else {
    res.status(404);
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
