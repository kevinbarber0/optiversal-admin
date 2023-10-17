import { v4 as uuidv4 } from 'uuid';
import SharedService from '@services/sharedService';
import { dateFormatter } from '@helpers/formatter';

const { Constants } = require('@util/global');
const SuggestionDB = require('@db/suggestionDB');
const PageService = require('@services/pageService');
const AccountDB = require('@db/accountDB');
const PageDB = require('@db/pageDB');
const LabelDB = require('@db/labelDB');
const WorkflowDB = require('@db/workflowDB');
const { SuggestionStatus, PageStatus, UserAction } = require('@util/enum');
const AWSUtility = require('@util/aws');
const fs = require('fs');
const AccountActionService = require('./accountActionService');
const Email = require('@util/email');

class SuggestionService {
  static async uploadKeywordFile(accountId, path) {
    let success = false;
    let message = '';
    const orgId = SharedService.getUserOrgId(accountId);
    const acct = await AccountDB.getById(accountId, orgId);
    if (acct) {
      const fileContent = fs.readFileSync(path, 'utf8');
      const uuid = uuidv4();
      const key = orgId + '|' + accountId + '|' + uuid;
      const stage = process.env.STAGE;
      await AWSUtility.saveObjectToS3(
        process.env.IMPORT_BUCKET || 'optiversal-client-data-' + stage,
        'importedkeywords/' + key,
        fileContent,
        'text',
      );
      await Email.sendEmail(
        'Contentops@optiversal.com',
        'support@optiversal.com',
        'Alert: New keywords imported',
        `Hello Optiversal content team,
New keywords have been imported.

Client Name: ${acct.details?.name || acct.details?.displayName}
Organization: ${acct.orgName}
Date: ${dateFormatter(Date.now())}

- Optiversal Support
        `,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async updateStatus(accountId, keyword, status) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (status === SuggestionStatus.PUBLISHED) {
        await this.publishAsPage(accountId, keyword);
      }
      await SuggestionDB.setStatus(
        keyword,
        SharedService.getUserOrgId(accountId),
        status,
      );
      await AccountActionService.logAccountAction(accountId, {
        actionType: 'UpdateIdeaStatus',
        description: `Update idea status to ${Object.keys(
          SuggestionStatus,
        ).find((key) => SuggestionStatus[key] === status)}`,
        itemType: 'idea',
        itemId: keyword,
        itemName: keyword,
        changedValue: {
          status,
        },
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async bulkUpdateStatus(accountId, keywords, status) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        if (status === SuggestionStatus.PUBLISHED) {
          await this.publishAsPage(accountId, keyword);
        }
        await SuggestionDB.setStatus(
          keyword,
          SharedService.getUserOrgId(accountId),
          status,
        );
        await AccountActionService.logAccountAction(accountId, {
          actionType: 'UpdateIdeaStatus',
          description: `Update idea status to ${Object.keys(
            SuggestionStatus,
          ).find((key) => SuggestionStatus[key] === status)}`,
          itemType: 'idea',
          itemId: keyword,
          itemName: keyword,
          changedValue: {
            status,
          },
        });
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getAll(
    accountId,
    offset,
    limit,
    filter,
    importedOnly,
    minQuality,
    maxQuality,
    filterLabel,
    ideaWorkflow,
    sort,
  ) {
    let success = false;
    let message = '';
    let suggestions = [];
    let totalCount = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      let workflow = null;
      if (ideaWorkflow) {
        workflow = await WorkflowDB.getById(
          ideaWorkflow,
          SharedService.getUserOrgId(accountId),
        );
      }

      suggestions = await SuggestionDB.getAll(
        SharedService.getUserOrgId(accountId),
        offset,
        limit,
        filter,
        importedOnly,
        minQuality,
        maxQuality,
        filterLabel,
        workflow,
        sort,
      );
      totalCount = await SuggestionDB.getCount(
        SharedService.getUserOrgId(accountId),
        filter,
        importedOnly,
        minQuality,
        maxQuality,
        filterLabel,
        workflow,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      suggestions: suggestions,
      totalCount: totalCount,
    };
  }

  static async getNext(
    accountId,
    workflowId,
    filterLabels,
    importedOnly,
    matchType,
    keyword,
  ) {
    let success = false;
    let message = '';
    let suggestion = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      suggestion = await SuggestionDB.getNext(
        SharedService.getUserOrgId(accountId),
        workflowId,
        filterLabels,
        importedOnly,
        matchType,
        keyword,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      suggestion: suggestion,
    };
  }

  static async publishAsPage(accountId, keyword) {
    let success = false;
    let message = '';
    let pageId = null;
    let slug = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const sugg = await SuggestionDB.getByKeyword(
        SharedService.getUserOrgId(accountId),
        keyword,
      );
      if (sugg) {
        const results = sugg.results?.products;
        const quality = sugg.qualityMetrics;
        const pageRes = await PageService.updatePage(
          accountId,
          null,
          null,
          keyword,
          keyword,
          Constants.ProductAssortmentContentTemplateId,
          [],
          null,
          null,
          results,
          quality,
        );
        success = pageRes.success;
        pageId = pageRes.pageId;
        slug = pageRes.slug;
        if (success) {
          await PageDB.setStatus(
            pageId,
            SharedService.getUserOrgId(accountId),
            PageStatus.PUBLISHED,
            false,
          );
        }
      } else {
        message = 'Suggestion not found';
      }
    } else {
      message = 'Unauthorized';
    }

    return { success: success, message: message, pageId: pageId, slug: slug };
  }

  static getParamsFromQuery(query) {
    const params = {
      concepts: [],
      categories: [],
      features: [],
      keywords: '',
      demographics: [],
      minPrice: null,
      maxPrice: null,
    };

    if (query.concepts && query.concepts.length > 0) {
      query.concepts.forEach((c) => {
        if (c.conceptId) {
          params.concepts.push({ value: c.conceptId, label: c.name });
        }
      });
    }

    if (query.features && query.features.length > 0) {
      query.features.forEach((f) => {
        if (!params.features.includes(f.feature)) {
          params.features.push({ value: f.feature, label: f.feature });
        }
      });
    }

    if (query.filters && query.filters.length > 0) {
      query.filters.forEach((f) => {
        if (f.name !== 'underprice' && f.name !== 'overprice') {
          params.demographics.push({
            value: f.name + ':' + f.value,
            label: f.value,
          });
        } else if (f.name === 'underprice') {
          params.maxPrice = parseFloat(f.value);
        } else if (f.name === 'overprice') {
          params.minPrice = parseFloat(f.value);
        }
      });
    }

    if (query.keywords && query.keywords !== '') {
      params.keywords = query.keywords;
    }

    return params;
  }

  static async setLabels(accountId, keyword, labels) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (labels) {
        for (let i = 0; i < labels.length; i++) {
          await LabelDB.ensure(
            SharedService.getUserOrgId(accountId),
            labels[i],
          );
        }
      }
      await SuggestionDB.setLabels(
        keyword,
        SharedService.getUserOrgId(accountId),
        labels,
      );
      await AccountActionService.logAccountAction(accountId, {
        actionType: 'UpdateIdeaTag',
        description: UserAction.UpdateIdeaTag,
        itemType: 'idea',
        itemId: keyword,
        itemName: keyword,
        changedValue: {
          labels,
        },
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async bulkAddLabel(accountId, keywords, label) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await LabelDB.ensure(SharedService.getUserOrgId(accountId), label);
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        await SuggestionDB.addLabel(
          keyword,
          SharedService.getUserOrgId(accountId),
          label,
        );
        await AccountActionService.logAccountAction(accountId, {
          actionType: 'UpdateIdeaTag',
          description: UserAction.UpdateIdeaTag,
          itemType: 'idea',
          itemId: keyword,
          itemName: keyword,
          changedValue: {
            label,
          },
        });
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }
}

module.exports = SuggestionService;
