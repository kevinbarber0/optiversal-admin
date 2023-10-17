import SharedService from '@services/sharedService';
const AnnotationDB = require('@db/annotationDB');
const AccountDB = require('@db/accountDB');

class AnnotationService {
  static async getAnnotationTypes(accountId) {
    let success = false;
    let message = '';
    let annotationTypes = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      annotationTypes = await AnnotationDB.getAnnotationTypes(
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success, message, annotationTypes };
  }
}

module.exports = AnnotationService;
