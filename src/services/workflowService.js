import { v4 as uuidv4 } from 'uuid';
import { getExtension } from '@helpers/utils';
import {
  getWorkflowAutomationStatus,
  sendStartWorkflowAutomationMessage,
  sendCancelWorkflowAutomationMessage
} from '@helpers/workflowMessaging';
import SharedService from '@services/sharedService';
const reader = require('xlsx');
const WorkflowDB = require('@db/workflowDB');
const AccountDB = require('@db/accountDB');
const PageDB = require('@db/pageDB');
const SuggestionDB = require('@db/suggestionDB');
const LabelDB = require('@db/labelDB');
const AWSUtility = require('@util/aws');
const PageService = require('./pageService');
const AccountActionService = require('./accountActionService');

const {
  PageStatus,
  WorkflowType,
  WorkflowItemAction,
  SuggestionStatus,
} = require('@util/enum');

class WorkflowService {
  static async getWorkflows(accountId) {
    let success = false;
    let message = '';
    let workflows = [];
    let totalCount = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      workflows = await WorkflowDB.getForUser(
        SharedService.getUserOrgId(accountId),
        accountId,
      );
      totalCount = await WorkflowDB.getCount(
        SharedService.getUserOrgId(accountId),
        accountId,
      );

      // TODO - await with above promise in parallel, reduce query time

      // augment workflows structure with `automationStatus` enum
      workflows = await Promise.all(
        workflows.map(async (workflow) => {
          const automationStatus = await getWorkflowAutomationStatus(workflow.workflowId);
          return {
            ...workflow,
            automationStatus,
          };
        })
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      workflows: workflows,
      totalCount: totalCount,
    };
  }

  static async getById(accountId, workflowId) {
    let success = false;
    let message = '';
    let workflow = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      workflow = await WorkflowDB.getById(
        workflowId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, workflow: workflow };
  }

  static async updateWorkflowStatus(accountId, workflowId, status) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await WorkflowDB.updateWorkflowStatus(
        workflowId,
        status,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async updateSettings(accountId, workflowSettings, file = null) {
    let newWorkflow = false;
    let success = false;
    let message = '';
    let workflowId = workflowSettings?.workflowId;
    const { workflowType } = workflowSettings;

    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (!workflowId) {
        workflowId = uuidv4();
        newWorkflow = true;
      }

      if (
        workflowType === WorkflowType.Product ||
        workflowType === WorkflowType.Idea ||
        workflowType === WorkflowType.Page
      ) {
        const {
          name,
          searchParams,
          contentTypes,
          assignedTo,
          workflowType,
          settings,
        } = workflowSettings;

        await WorkflowDB.save(
          workflowId,
          SharedService.getUserOrgId(accountId),
          name,
          searchParams,
          contentTypes,
          assignedTo,
          workflowType,
          settings,
          accountId,
        );

        success = true;
      } else if (workflowType === WorkflowType.File) {
        const { name, component, assignedTo, workflowType } = workflowSettings;
        const inputContents = parseFile(file);

        await WorkflowDB.save(
          workflowId,
          SharedService.getUserOrgId(accountId),
          name,
          null,
          component,
          assignedTo,
          workflowType,
          null,
          accountId,
        );
        if (!newWorkflow) {
          await WorkflowDB.deleteWorkflowItems(
            workflowId,
            SharedService.getUserOrgId(accountId),
          );
        }

        await WorkflowDB.saveFileWorkflowItems(
          workflowId,
          SharedService.getUserOrgId(accountId),
          inputContents,
        );
        success = true;
      }
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      workflowId: workflowId,
    };
  }

  static async getCompletedItems(accountId, workflowId, offset, limit, sortBy) {
    let success = false;
    let message = '';
    let items = null;
    let totalCount = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      totalCount = await WorkflowDB.getCompletedItemsCount(
        workflowId,
        SharedService.getUserOrgId(accountId),
      );
      items = await WorkflowDB.getCompletedItems(
        workflowId,
        SharedService.getUserOrgId(accountId),
        offset,
        limit,
        sortBy,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      items: items,
      totalCount: totalCount,
    };
  }

  static async getItems(accountId, workflowId) {
    let success = false;
    let message = '';
    let items = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      items = await WorkflowDB.getItems(
        workflowId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, items: items };
  }

  static async updateItem(accountId, item) {
    let success = false;
    let message = '';
    let items = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      items = await WorkflowDB.updateItem(
        item,
        accountId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, items: items };
  }

  static async completeItem(accountId, itemId) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await WorkflowDB.completeItem(
        itemId,
        accountId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async resetItem(accountId, itemId) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await WorkflowDB.resetItem(itemId, SharedService.getUserOrgId(accountId));
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async startAutomation(accountId, workflowId) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const workflow = await WorkflowDB.checkAccess(workflowId, acct.organizationId, accountId);
      if (!workflow) {
        message = 'Unauthorized';
      } else {
        // TODO pass orgid used to start automation, for shared service access
        await sendStartWorkflowAutomationMessage(workflowId, accountId, acct.organizationId);
        success = true;
      }
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async stopAutomation(accountId, workflowId) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const workflow = await WorkflowDB.checkAccess(workflowId, acct.organizationId, accountId);
      if (!workflow) {
        message = 'Unauthorized';
      } else {
        await sendCancelWorkflowAutomationMessage(workflowId);
        success = true;
      }
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getProductCount(accountId, workflowId) {
    let success = false;
    let message = '';
    let productCount = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      productCount = await WorkflowDB.getProductCount(
        workflowId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, productCount: productCount };
  }

  static async getNextProduct(accountId, workflowId) {
    let success = false;
    let message = '';
    let product = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      product = await WorkflowDB.getNextProduct(
        workflowId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, product: product };
  }

  static async getProductItemTodos(accountId, workflowId) {
    let success = false;
    let message = '';
    let products = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      products = await WorkflowDB.getProductItemTodos(
        workflowId,
        SharedService.getUserOrgId(accountId),
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, products: products };
  }

  static async saveProductWorkflowItem(
    accountId,
    workflowId,
    sku,
    name,
    content,
  ) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const workflowItemId = uuidv4();
      const outputContent = content[Object.keys(content)[0]];

      await WorkflowDB.saveProductWorkflowItem(
        accountId,
        workflowItemId,
        workflowId,
        SharedService.getUserOrgId(accountId),
        WorkflowType.Product,
        sku,
        { sku: sku, name: name },
        outputContent,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getWorkflowExportDownloadUrl(
    accountId,
    workflowId,
    workflowType,
  ) {
    let success = false;
    let message = '';
    let downloadUrl = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      //get all content

      if (workflowType === WorkflowType.File) {
        const allContent = await WorkflowDB.getCompletedFileWorkflowItems(
          workflowId,
          SharedService.getUserOrgId(accountId),
        );
        if (allContent?.length > 0) {
          //create csv
          const createCsvStringifier =
            require('csv-writer').createObjectCsvStringifier;
          const csvStringifier = createCsvStringifier({
            header: [
              { id: 'id', title: 'ID' },
              ...Object.keys(allContent[0].inputContent).map((k) => {
                return { id: k, title: k.toUpperCase() };
              }),
              { id: 'content', title: 'CONTENT' },
              { id: 'date', title: 'DATECOMPLETED' },
              { id: 'by', title: 'COMPLETEDBY' },
            ],
          });
          const records = csvStringifier.stringifyRecords(
            allContent.map((prod) => {
              return {
                id: prod.itemId.split('-').pop(),
                ...prod.inputContent,
                content: prod.outputContent,
                date: prod.dateCompleted,
                by: prod.completedBy,
              };
            }),
          );
          const allData = csvStringifier.getHeaderString() + records;
          //write to s3
          const fileName = workflowId + '-' + uuidv4() + '.csv';
          await AWSUtility.saveObjectToS3(
            process.env.EXPORT_BUCKET || 'optiversal-export',
            fileName,
            allData,
            'application/octet-stream',
          );
          downloadUrl =
            (process.env.EXPORT_URL ||
              'http://optiversal-export.s3-website-us-east-1.amazonaws.com/') +
            fileName;
          success = true;
        } else {
          message = 'No records';
        }
      } else if (workflowType === WorkflowType.Idea) {
        const allContent = await WorkflowDB.getCompletedIdeaWorkflowItems(
          workflowId,
          SharedService.getUserOrgId(accountId),
        );
        if (allContent?.length > 0) {
          //create csv
          const createCsvStringifier =
            require('csv-writer').createObjectCsvStringifier;
          const csvStringifier = createCsvStringifier({
            header: [
              { id: 'id', title: 'PAGE ID' },
              { id: 'title', title: 'TITLE' },
              { id: 'content', title: 'CONTENT' },
              { id: 'action', title: 'ACTION' },
              { id: 'date', title: 'DATE COMPLETED' },
              { id: 'by', title: 'COMPLETED BY' },
            ],
          });
          const records = csvStringifier.stringifyRecords(
            allContent.map((item) => {
              return {
                id: item.pageId,
                title: item.title,
                content: item.content ? JSON.stringify(item.content) : null,
                action: item.action,
                date: item.dateCompleted,
                by: item.completedBy,
              };
            }),
          );
          const allData = csvStringifier.getHeaderString() + records;
          //write to s3
          const fileName = workflowId + '-' + uuidv4() + '.csv';
          await AWSUtility.saveObjectToS3(
            process.env.EXPORT_BUCKET || 'optiversal-export',
            fileName,
            allData,
            'application/octet-stream',
          );
          downloadUrl =
            (process.env.EXPORT_URL ||
              'http://optiversal-export.s3-website-us-east-1.amazonaws.com/') +
            fileName;
          success = true;
        } else {
          message = 'No records';
        }
      } else if (workflowType === WorkflowType.Page) {
        const allContent = await WorkflowDB.getCompletedPageWorkflowItems(
          workflowId,
          SharedService.getUserOrgId(accountId),
        );
        if (allContent?.length > 0) {
          //create csv
          const createCsvStringifier =
            require('csv-writer').createObjectCsvStringifier;
          const csvStringifier = createCsvStringifier({
            header: [
              { id: 'id', title: 'PAGE ID' },
              { id: 'title', title: 'TITLE' },
              { id: 'content', title: 'CONTENT' },
              { id: 'action', title: 'ACTION' },
              { id: 'date', title: 'DATE COMPLETED' },
              { id: 'by', title: 'COMPLETED BY' },
            ],
          });
          const records = csvStringifier.stringifyRecords(
            allContent.map((item) => {
              return {
                id: item.pageId,
                title: item.title,
                content: item.content ? JSON.stringify(item.content) : null,
                action: item.action,
                date: item.dateCompleted,
                by: item.completedBy,
              };
            }),
          );
          const allData = csvStringifier.getHeaderString() + records;
          //write to s3
          const fileName = workflowId + '-' + uuidv4() + '.csv';
          await AWSUtility.saveObjectToS3(
            process.env.EXPORT_BUCKET || 'optiversal-export',
            fileName,
            allData,
            'application/octet-stream',
          );
          downloadUrl =
            (process.env.EXPORT_URL ||
              'http://optiversal-export.s3-website-us-east-1.amazonaws.com/') +
            fileName;
          success = true;
        } else {
          message = 'No records';
        }
      } else {
        const allContent = await WorkflowDB.getCompletedProductWorkflowItems(
          workflowId,
          SharedService.getUserOrgId(accountId),
        );
        if (allContent?.length > 0) {
          //create csv
          const createCsvStringifier =
            require('csv-writer').createObjectCsvStringifier;
          const csvStringifier = createCsvStringifier({
            header: [
              { id: 'sku', title: 'SKU' },
              { id: 'name', title: 'NAME' },
              { id: 'content', title: 'CONTENT' },
              { id: 'date', title: 'DATECOMPLETED' },
              { id: 'by', title: 'COMPLETEDBY' },
            ],
          });
          const records = csvStringifier.stringifyRecords(
            allContent.map((prod) => {
              return {
                sku: prod.sku,
                name: prod.name,
                content:
                  prod.content && Object.values(prod.content).length > 0
                    ? Object.values(prod.content)[0]
                    : '',
                date: prod.dateCompleted,
                by: prod.completedBy,
              };
            }),
          );
          const allData = csvStringifier.getHeaderString() + records;
          //write to s3
          const fileName = workflowId + '-' + uuidv4() + '.csv';
          await AWSUtility.saveObjectToS3(
            process.env.EXPORT_BUCKET || 'optiversal-export',
            fileName,
            allData,
            'application/octet-stream',
          );
          downloadUrl =
            (process.env.EXPORT_URL ||
              'http://optiversal-export.s3-website-us-east-1.amazonaws.com/') +
            fileName;
          success = true;
        } else {
          message = 'No records';
        }
      }
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, downloadUrl: downloadUrl };
  }

  static async saveIdeaWorkflowItem(
    accountId,
    workflow,
    keyword,
    page,
    action,
  ) {
    let success = false;
    let message = '';
    let pageId = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const workflowItemId = uuidv4();

      await WorkflowDB.saveIdeaWorkflowItem(
        accountId,
        workflowItemId,
        workflow?.workflowId,
        SharedService.getUserOrgId(accountId),
        workflow?.workflowType,
        keyword,
        { keyword },
        action,
      );

      if (action === WorkflowItemAction.APPROVE) {
        const pageRes = await PageService.updatePage(
          accountId,
          page.pageId,
          page.slug,
          page.keyword,
          page.title,
          page.contentTemplateId,
          page.content,
          page.contentSettings,
          page.searchParameters,
          page.results,
          page.qualityMetrics,
          page.query,
          page.labels,
          page.pageSettings,
          page.locations,
        );
        success = pageRes.success;
        pageId = pageRes.pageId;

        if (success) {
          if (workflow?.settings?.approval?.publishPage) {
            await PageDB.setStatus(
              pageId,
              SharedService.getUserOrgId(accountId),
              PageStatus.PUBLISHED,
              false,
            );

            await SuggestionDB.setStatus(
              keyword,
              SharedService.getUserOrgId(accountId),
              SuggestionStatus.PUBLISHED,
            );
          } else {
            await SuggestionDB.setStatus(
              keyword,
              SharedService.getUserOrgId(accountId),
              SuggestionStatus.SAVED,
            );
          }

          if (workflow?.settings?.approval?.applyLabels?.length > 0) {
            const labels = workflow.settings.approval.applyLabels.map(
              (l) => l.value,
            );
            for (let i = 0; i < labels.length; i++) {
              await LabelDB.ensure(
                SharedService.getUserOrgId(accountId),
                labels[i],
              );
            }

            let pageLabels = [...page.labels, ...labels];
            pageLabels = pageLabels.filter(
              (item, pos) => pageLabels.indexOf(item) === pos,
            );

            await PageDB.setLabels(
              pageId,
              SharedService.getUserOrgId(accountId),
              pageLabels,
            );
          }

          await AccountActionService.logAccountAction(accountId, {
            actionType: 'UpdateIdeaStatus',
            description: `Update idea status to ${Object.keys(
              SuggestionStatus,
            ).find(
              (key) => SuggestionStatus[key] === SuggestionStatus.PUBLISHED,
            )}`,
            itemType: 'idea',
            itemId: keyword,
            itemName: keyword,
            changedValue: workflow?.settings?.approval?.publishPage
              ? SuggestionStatus.PUBLISHED
              : SuggestionStatus.SAVED,
          });
        }
      } else {
        let ideaLabels = await SuggestionDB.getLabels(
          keyword,
          SharedService.getUserOrgId(accountId),
        );

        if (workflow?.settings?.rejection?.applyLabels?.length > 0) {
          const labels = workflow.settings.rejection.applyLabels.map(
            (l) => l.value,
          );
          for (let i = 0; i < labels.length; i++) {
            await LabelDB.ensure(
              SharedService.getUserOrgId(accountId),
              labels[i],
            );
          }

          ideaLabels = [...ideaLabels, ...labels];
          ideaLabels = ideaLabels.filter(
            (item, pos) => ideaLabels.indexOf(item) === pos,
          );

          await SuggestionDB.setLabels(
            keyword,
            SharedService.getUserOrgId(accountId),
            ideaLabels,
          );
        }

        if (workflow?.settings?.rejection?.removeLabels?.length > 0) {
          const labels = workflow.settings.rejection.removeLabels.map(
            (l) => l.value,
          );
          for (let i = 0; i < labels.length; i++) {
            await LabelDB.ensure(
              SharedService.getUserOrgId(accountId),
              labels[i],
            );
          }

          await SuggestionDB.setLabels(
            keyword,
            SharedService.getUserOrgId(accountId),
            ideaLabels.filter((l) => !labels.includes(l)),
          );
        }

        if (workflow?.settings?.rejection?.deleteIdea) {
          await SuggestionDB.setStatus(
            keyword,
            SharedService.getUserOrgId(accountId),
            SuggestionStatus.DELETED,
          );
          await AccountActionService.logAccountAction(accountId, {
            actionType: 'UpdateIdeaStatus',
            description: `Update idea status to ${Object.keys(
              SuggestionStatus,
            ).find(
              (key) => SuggestionStatus[key] === SuggestionStatus.DELETED,
            )}`,
            itemType: 'idea',
            itemId: keyword,
            itemName: keyword,
            changedValue: SuggestionStatus.DELETED,
          });
        }
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async savePageWorkflowItem(accountId, workflow, page, action) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const workflowItemId = uuidv4();

      await WorkflowDB.savePageWorkflowItem(
        accountId,
        workflowItemId,
        workflow?.workflowId,
        SharedService.getUserOrgId(accountId),
        workflow?.workflowType,
        page.pageId,
        { title: page?.title, slug: page.slug },
        action,
      );

      if (action === WorkflowItemAction.APPROVE) {
        const pageRes = await PageService.updatePage(
          accountId,
          page.pageId,
          page.slug,
          page.keyword,
          page.title,
          page.contentTemplateId,
          page.content,
          page.contentSettings,
          page.searchParameters,
          page.results,
          page.qualityMetrics,
          page.query,
          page.labels,
          page.pageSettings,
          page.locations,
        );
        success = pageRes.success;
        if (success) {
          if (workflow?.settings?.approval?.changeStatus) {
            await PageDB.setStatus(
              pageRes.pageId,
              SharedService.getUserOrgId(accountId),
              parseInt(workflow.settings.approval.changeStatus),
              false,
            );
          }

          let pageLabels = page.labels;

          if (workflow?.settings?.approval?.applyLabels?.length > 0) {
            const labels = workflow.settings.approval.applyLabels.map(
              (l) => l.value,
            );
            for (let i = 0; i < labels.length; i++) {
              await LabelDB.ensure(
                SharedService.getUserOrgId(accountId),
                labels[i],
              );
            }

            pageLabels = [...pageLabels, ...labels];
            pageLabels = pageLabels.filter(
              (item, pos) => pageLabels.indexOf(item) === pos,
            );
            await PageDB.setLabels(
              pageRes.pageId,
              SharedService.getUserOrgId(accountId),
              pageLabels,
            );
          }

          if (workflow?.settings?.approval?.removeLabels?.length > 0) {
            const labels = workflow.settings.approval.removeLabels.map(
              (l) => l.value,
            );
            for (let i = 0; i < labels.length; i++) {
              await LabelDB.ensure(
                SharedService.getUserOrgId(accountId),
                labels[i],
              );
            }
            await PageDB.setLabels(
              pageRes.pageId,
              SharedService.getUserOrgId(accountId),
              pageLabels.filter((l) => !labels.includes(l)),
            );
          }
        }
      } else {
        if (workflow?.settings?.rejection?.changeStatus) {
          await PageDB.setStatus(
            page.pageId,
            SharedService.getUserOrgId(accountId),
            parseInt(workflow.settings.rejection.changeStatus),
            false,
          );
        }

        let pageLabels = page.labels;

        if (workflow?.settings?.rejection?.applyLabels?.length > 0) {
          const labels = workflow.settings.rejection.applyLabels.map(
            (l) => l.value,
          );
          for (let i = 0; i < labels.length; i++) {
            await LabelDB.ensure(
              SharedService.getUserOrgId(accountId),
              labels[i],
            );
          }

          pageLabels = [...pageLabels, ...labels];
          pageLabels = pageLabels.filter(
            (item, pos) => pageLabels.indexOf(item) === pos,
          );
          await PageDB.setLabels(
            page.pageId,
            SharedService.getUserOrgId(accountId),
            pageLabels,
          );
        }

        if (workflow?.settings?.rejection?.removeLabels?.length > 0) {
          const labels = workflow.settings.rejection.removeLabels.map(
            (l) => l.value,
          );
          for (let i = 0; i < labels.length; i++) {
            await LabelDB.ensure(
              SharedService.getUserOrgId(accountId),
              labels[i],
            );
          }

          await PageDB.setLabels(
            page.pageId,
            SharedService.getUserOrgId(accountId),
            pageLabels.filter((l) => !labels.includes(l)),
          );
        }
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getIdeaWorkflowsByUser(accountId, query) {
    let success = false;
    let message = '';
    let workflows = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      workflows = await WorkflowDB.getIdeaWorkflowsByUser(
        accountId,
        SharedService.getUserOrgId(accountId),
        query,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, workflows: workflows };
  }

  static async getPageWorkflowsByUser(accountId, query) {
    let success = false;
    let message = '';
    let workflows = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      workflows = await WorkflowDB.getPageWorkflowsByUser(
        accountId,
        SharedService.getUserOrgId(accountId),
        query,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, workflows: workflows };
  }
}

const parseFile = (file) => {
  if (!file) return;
  const ext = getExtension(file.originalFilename).toLowerCase();
  switch (ext) {
    case 'xlsx':
    case 'csv':
      return handleXlsxFile(file.path);
    default:
      break;
  }
};

const handleXlsxFile = (path) => {
  const file = reader.readFile(path);
  const list = [];

  const wsname = file.SheetNames[0];

  const data = reader.utils.sheet_to_json(file.Sheets[wsname]);
  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    if (headers.length < 1) {
      return null;
    }

    for (let i = 0; i < data.length; i++) {
      const obj = data[i];
      // remove the blank rows
      if (Object.values(obj).filter((x) => x).length > 0) {
        list.push({
          ...obj,
          order: i + 1,
        });
      }
    }
    return list;
  }
};

module.exports = WorkflowService;
