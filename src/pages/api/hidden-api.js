import { Constants } from '@util/global';
import AccountService from '@services/accountService';

const PageDB = require('@db/pageDB');

const handler = async (req, res) => {
  if (req.method === 'POST') {
    if (req.body.apiKey === Constants.FactorTerm) {
      let result;
      switch (req.body.action) {
        case 'Set Email Verified': {
          const { emails } = req.body.params;
          if (Array.isArray(emails)) {
            result = await Promise.all(
              emails.map(
                async (email) => await AccountService.setemail_verified(email),
              ),
            );
          } else {
            result = {
              success: false,
              message: 'Put emails in an array',
            };
          }
          break;
        }
        case 'Adjust Content Blocks': {
          result = { success: await PageDB.adjustOldPageContent() };
          break;
        }
        default:
          result = {
            success: false,
            message: 'Action not found',
          };
          break;
      }
      res.status(200).json(result);
    } else {
      res.status(403).json({
        success: false,
        message: "You don't have permission to call this action",
      });
    }
  } else {
    res.status(404);
  }
};

export default handler;
