import { v4 as uuidv4 } from 'uuid';
import SharedService from '@services/sharedService';
const ComponentDB = require('@db/componentDB');
const AccountDB = require('@db/accountDB');

class ComponentService {
  static async updateComponent(accountId, componentId, name, settings) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (!componentId) {
        componentId = uuidv4();
      }
      await ComponentDB.save(componentId, SharedService.getUserOrgId(accountId), name, settings);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, componentId: componentId };
  }

  static async getAll(accountId, offset, limit) {
    let success = false;
    let message = '';
    let components = [];
    let totalCount = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      components = await ComponentDB.getAll(SharedService.getUserOrgId(accountId), offset, limit);
      components.forEach((c) => {
        delete c.organizationId;
        if (c.settings) {
          delete c.settings.prompt;
          delete c.settings.intros;
          delete c.settings.sampleData;
          delete c.settings.numSentences;
          delete c.settings.boostedKeywords;
          delete c.settings.suppressedKeywords;
          delete c.settings.contentType;
          delete c.settings.sampleText;
          delete c.settings.sampleTopic;
          delete c.settings.stops;
          delete c.settings.engine;
        }
      });
      totalCount = await ComponentDB.getCount(SharedService.getUserOrgId(accountId));
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      components: components,
      totalCount: totalCount,
    };
  }

  static async getWorkflowComponents(accountId) {
    let success = false;
    let message = '';
    let components = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      components = await ComponentDB.getWorkflowComponents(SharedService.getUserOrgId(accountId));
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, components: components };
  }

  static async getById(accountId, componentId) {
    let success = false;
    let message = '';
    let component = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      component = await ComponentDB.getById(componentId, SharedService.getUserOrgId(accountId));
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, component: component };
  }

  static async deleteById(accountId, componentId) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await ComponentDB.deleteById(componentId, SharedService.getUserOrgId(accountId));
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }
}

module.exports = ComponentService;
