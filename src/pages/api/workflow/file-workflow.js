const WorkflowService = require('@services/workflowService');
const requireAuth = require('@api/_require-auth');
const multiparty = require('multiparty');

export default requireAuth(async (req, res) => {
  if (req.method === 'PUT') {
    //update workflow settings
    let form = new multiparty.Form();

    try {
      return await form.parse(req, async function (err, fields, files) {
        try {
          return WorkflowService.updateSettings(
            req.user.uid,
            JSON.parse(fields.settings[0]),
            files.file[0],
          ).then((result) => res.status(200).json(result));
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
