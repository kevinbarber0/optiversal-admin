import { v4 as uuidv4 } from 'uuid';
import SharedService from '@services/sharedService';
const ContentTemplateDB = require('@db/contentTemplateDB');
const AccountDB = require('@db/accountDB');

class ContentTemplateService {
  static async updateContentTemplate(
    accountId,
    contentTemplateId,
    name,
    content,
    settings,
  ) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct && acct.email.indexOf('@optiversal.com') > 0) {
      if (!contentTemplateId) {
        contentTemplateId = uuidv4();
      }
      await ContentTemplateDB.save(
        contentTemplateId,
        SharedService.getUserOrgId(accountId),
        name,
        content,
        settings,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      contentTemplateId: contentTemplateId,
    };
  }

  static async getAll(accountId, offset, limit) {
    let success = false;
    let message = '';
    let contentTemplates = [];
    let totalCount = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      contentTemplates = await ContentTemplateDB.getAll(
        SharedService.getUserOrgId(accountId),
        offset,
        limit,
      );
      totalCount = await ContentTemplateDB.getCount(SharedService.getUserOrgId(accountId));
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      contentTemplates: contentTemplates,
      totalCount: totalCount,
    };
  }

  static async getAllWithPrefix(accountId, prefix) {
    let success = false;
    let message = '';
    let contentTemplates = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      contentTemplates = await ContentTemplateDB.getAllWithPrefix(
        SharedService.getUserOrgId(accountId),
        prefix,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      contentTemplates: contentTemplates,
    };
  }

  static async getById(accountId, contentTemplateId) {
    let success = false;
    let message = '';
    let contentTemplate = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      contentTemplate = await ContentTemplateDB.getById(
        contentTemplateId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      contentTemplate: contentTemplate,
    };
  }

  static async deleteById(accountId, contentTemplateId) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct && acct.email.indexOf('@optiversal.com') > 0) {
      await ContentTemplateDB.deleteById(
        contentTemplateId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }
}

module.exports = ContentTemplateService;
