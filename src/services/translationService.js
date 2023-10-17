const AccountDB = require('@db/accountDB');
const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({
  projectId: process.env.TRANSLATION_PROJECT_ID,
  key: process.env.TRANSLATION_API_KEY,
});

class TranslationService {
  static async getTranslation(accountId, targetLanguage, text) {
    let success = false;
    let message = '';
    let translation = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      [translation] = await translate.translate(text, targetLanguage);
      console.log(translation);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, translation: translation };
  }
}

module.exports = TranslationService;
