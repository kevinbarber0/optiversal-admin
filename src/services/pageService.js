import { v4 as uuidv4 } from 'uuid';
import { AbortController } from 'node-abort-controller';
import SharedService from '@services/sharedService';
const PageDB = require('@db/pageDB');
const AccountDB = require('@db/accountDB');
const LabelDB = require('@db/labelDB');
const WorkflowDB = require('@db/workflowDB');
const TranslationService = require('@services/translationService');
const AWSUtility = require('@util/aws');
const slug = require('slug');
const { PageStatus } = require('@util/enum');
const AccountActionService = require('./accountActionService');
const ContentTemplateService = require('./contentTemplateService');
const { getPagePreviewLink } = require('@helpers/page');
const { dateFormatter } = require('@helpers/formatter');
const { revertSingularOrPlural } = require('@util/string');

const fetch = require('node-fetch');
class PageService {
  static async updatePage(
    accountId,
    pageId,
    slug,
    keyword,
    title,
    contentTemplateId,
    content,
    contentSettings,
    searchParameters,
    results,
    qualityMetrics,
    query,
    labels,
    pageSettings,
    locations,
  ) {
    let newPage = false;
    let success = false;
    let message = '';
    let finalSlug = slug;
    const contentTemplatesResult = await ContentTemplateService.getById(
      accountId,
      contentTemplateId,
    );
    const orgId = SharedService.getUserOrgId(accountId);

    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const isExisting = await PageDB.findByTitle(
        orgId,
        [title.toLowerCase()],
        pageId,
      );
      if (isExisting) {
        return {
          success: false,
          message: `There is already a page with the title ${title}`,
        };
      }

      if (!pageId) {
        newPage = true;
        pageId = uuidv4();
        finalSlug = await PageService.getSlug(orgId, title);
      } else {
        const page = await PageDB.getById(pageId);
        if (pageId !== page.pageId || page.organizationId !== orgId)
          return {
            success: false,
            message: 'Unauthorized',
          };
      }

      if (labels) {
        for (let i = 0; i < labels.length; i++) {
          await LabelDB.ensure(orgId, labels[i]);
        }
      }

      const res = await PageDB.save(
        accountId,
        pageId,
        orgId,
        finalSlug,
        keyword,
        title,
        contentTemplateId,
        content,
        contentSettings,
        searchParameters,
        results,
        qualityMetrics,
        query,
        labels,
        pageSettings,
        locations,
      );

      if (res) {
        await AccountActionService.logAccountAction(accountId, {
          actionType: newPage ? 'CreatePage' : 'UpdatePageContent',
          description: newPage
            ? `Create a ${
                contentTemplatesResult.contentTemplate?.name || 'Free-Form Page'
              } page`
            : `Update the ${
                contentTemplatesResult.contentTemplate?.name || 'Free-Form Page'
              } page content`,
          itemType: 'page',
          itemId: pageId,
          itemName: finalSlug,
          changedValue: {
            slug: finalSlug,
            keyword,
            title,
            contentTemplateId,
            content,
            contentSettings,
            searchParameters,
            results,
            qualityMetrics,
            query,
            labels,
            pageSettings,
            locations,
          },
        });

        success = true;
      } else {
        success = false;
        message = 'Incorrect page data';
      }
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      slug: finalSlug,
      pageId: pageId,
    };
  }

  static async updateStatus(accountId, pageId, status) {
    let success = false;
    let message = '';
    let label = Object.keys(PageStatus).find(
      (key) => PageStatus[key] === status,
    );
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const page = await PageDB.getById(pageId);

      if (
        pageId !== page.pageId ||
        page.organizationId !== SharedService.getUserOrgId(accountId)
      )
        return {
          success: false,
          message: 'Unauthorized',
        };
      const res = await PageDB.setStatus(
        pageId,
        SharedService.getUserOrgId(accountId),
        status,
        true,
      );

      if (res) {
        await AccountActionService.logAccountAction(accountId, {
          actionType: 'UpdatePageStatus',
          description: `Update page status to ${label}`,
          itemType: 'page',
          itemId: pageId,
          itemName: page.slug,
          changedValue: label,
        });
        success = true;
      } else {
        message = 'Invalid page status';
      }
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async bulkUpdateStatus(accountId, pageIds, status) {
    let success = false;
    let message = '';
    let label = Object.keys(PageStatus).find(
      (key) => PageStatus[key] === status,
    );
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      for (let i = 0; i < pageIds.length; i++) {
        const page = await PageDB.getById(pageIds[i]);
        if (
          pageIds[i] !== page.pageId ||
          page.organizationId !== SharedService.getUserOrgId(accountId)
        )
          return {
            success: false,
            message: 'Unauthorized',
          };
        const res = await PageDB.setStatus(
          pageIds[i],
          SharedService.getUserOrgId(accountId),
          status,
          true,
        );

        if (res) {
          await AccountActionService.logAccountAction(accountId, {
            actionType: 'UpdatePageStatus',
            description: `Update page status to ${label}`,
            itemType: 'page',
            itemId: pageIds[i],
            itemName: page.slug,
            changedValue: label,
          });
        }
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async bulkAddLabel(accountId, pageIds, label) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await LabelDB.ensure(SharedService.getUserOrgId(accountId), label);
      for (let i = 0; i < pageIds.length; i++) {
        const page = await PageDB.getById(pageIds[i]);
        if (
          pageIds[i] !== page.pageId ||
          page.organizationId !== SharedService.getUserOrgId(accountId)
        )
          return {
            success: false,
            message: 'Unauthorized',
          };
        await PageDB.addLabel(
          pageIds[i],
          SharedService.getUserOrgId(accountId),
          label,
        );
        await AccountActionService.logAccountAction(accountId, {
          actionType: 'AddPageLabel',
          description: 'Add Page Label',
          itemType: 'page',
          itemId: pageIds[i],
          itemName: page.slug,
          changedValue: label,
        });
      }
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async bulkAddLabels(accountId, labelsData) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      labelsData.forEach(async (data) => {
        const { slug, labels } = data;

        if (labels) {
          for (let i = 0; i < labels.length; i++) {
            await LabelDB.ensure(
              SharedService.getUserOrgId(accountId),
              labels[i],
            );
          }
        }

        await PageDB.setLabelsBySlug(
          slug,
          SharedService.getUserOrgId(accountId),
          labels,
        );
        success = true;
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async addLabel(accountId, pageId, label) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await LabelDB.ensure(SharedService.getUserOrgId(accountId), label);
      const page = await PageDB.getById(pageId);
      if (
        pageId !== page.pageId ||
        page.organizationId !== SharedService.getUserOrgId(accountId)
      )
        return {
          success: false,
          message: 'Unauthorized',
        };
      await PageDB.addLabel(
        pageId,
        SharedService.getUserOrgId(accountId),
        label,
      );
      await AccountActionService.logAccountAction(accountId, {
        actionType: 'AddPageLabel',
        description: 'Add Page Label',
        itemType: 'page',
        itemId: pageId,
        itemName: page.slug,
        changedValue: label,
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async setLabels(accountId, pageId, labels) {
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

      await PageDB.setLabels(
        pageId,
        SharedService.getUserOrgId(accountId),
        labels,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getSlug(orgId, text) {
    const baseSlug = slug(text, { lower: true });
    let finalSlug = baseSlug;
    let exists = await PageDB.checkSlugExists(orgId, finalSlug);
    if (exists) {
      //use numeric suffixes until we find a unique one
      let count = 1;
      while (true) {
        const slug = baseSlug + '-' + count;
        exists = await PageDB.checkSlugExists(orgId, slug);
        if (!exists) {
          finalSlug = slug;
          break;
        }
        count++;
      }
    }
    return finalSlug;
  }

  static async getAll(
    accountId,
    offset,
    limit,
    keyword,
    filters,
    sortBy,
    resultKey,
  ) {
    let success = false;
    let message = '';
    let pages = [];
    let totalCount = 0;
    const pageWorkflow = filters?.pageWorkflow;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      let workflow = null;
      if (pageWorkflow?.value) {
        workflow = await WorkflowDB.getById(
          pageWorkflow.value,
          SharedService.getUserOrgId(accountId),
        );
        filters.workflow = workflow;
      }

      pages = await PageDB.getAll(
        SharedService.getUserOrgId(accountId),
        offset,
        limit,
        keyword,
        filters,
        sortBy,
        resultKey,
      );
      totalCount = await PageDB.getCount(
        SharedService.getUserOrgId(accountId),
        keyword,
        filters,
        resultKey,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      pages: pages,
      totalCount: totalCount,
    };
  }

  static async getMetrics(accountId, startDate, endDate) {
    let success = false;
    let message = '';
    let metrics = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      metrics = await PageDB.getMetrics(
        SharedService.getUserOrgId(accountId),
        startDate,
        endDate,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      metrics: metrics,
    };
  }

  static async getPubPages(accountId, startDate, endDate) {
    let success = false;
    let message = '';
    let pubPages = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      pubPages = await PageDB.getPubPages(
        SharedService.getUserOrgId(accountId),
        startDate,
        endDate,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      pubPages: pubPages,
    };
  }

  static async getImpPages(accountId, startDate, endDate) {
    let success = false;
    let message = '';
    let impPages = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      impPages = await PageDB.getImpPages(
        SharedService.getUserOrgId(accountId),
        startDate,
        endDate,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      impPages: impPages,
    };
  }

  static async getSERPs(accountId, startDate, endDate) {
    let success = false;
    let message = '';
    let serps = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      serps = await PageDB.getSERPs(
        SharedService.getUserOrgId(accountId),
        startDate,
        endDate,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      serps: serps,
    };
  }

  static async getBySlug(accountId, slug) {
    let success = false;
    let message = '';
    let page = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      page = await PageDB.getBySlug(
        SharedService.getUserOrgId(accountId),
        slug,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, page: page };
  }

  static async getTranslations(accountId, pageId) {
    let success = false;
    let message = '';
    let translations = {};
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      translations = await PageDB.getTranslations(
        SharedService.getUserOrgId(accountId),
        pageId,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, translations: translations };
  }

  static async setTranslation(accountId, pageId, languageCode, content) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await PageDB.setTranslation(pageId, languageCode, content);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async createTranslation(
    accountId,
    pageId,
    type,
    languageCode,
    language,
    content,
  ) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (type === 'machine') {
        const translationRes = await TranslationService.getTranslation(
          accountId,
          languageCode,
          content,
        );
        if (translationRes.success) {
          const req = {
            languageCode: languageCode,
            language: language,
            status: 'Translated',
            source: content,
            translation: translationRes.translation,
            dateRequested: new Date().toISOString(),
            dateCompleted: new Date().toISOString(),
          };
          await PageDB.setTranslation(pageId, languageCode, req);
          success = true;
        } else {
          message = translationRes.message;
        }
      } else {
        const req = {
          languageCode: languageCode,
          language: language,
          status: 'Requested',
          source: content,
          dateRequested: new Date().toISOString(),
        };
        //todo send API request to gengo
        await PageDB.setTranslation(pageId, languageCode, req);
        success = true;
      }
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getExportDownloadUrl(accountId, options) {
    let success = false;
    let message = '';
    let downloadUrl = null;
    const pageWorkflow = options.filters?.pageWorkflow;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      let workflow = null;
      if (pageWorkflow?.value) {
        workflow = await WorkflowDB.getById(
          pageWorkflow.value,
          SharedService.getUserOrgId(accountId),
        );
        options.workflow = workflow;
      }
      //get all content
      const allContent = await PageDB.getExportData(
        SharedService.getUserOrgId(accountId),
        options,
      );

      if (allContent && allContent.length > 0) {
        //create csv
        const createCsvStringifier =
          require('csv-writer').createObjectCsvStringifier;
        const csvStringifier = createCsvStringifier({
          header: [
            { id: 'pageId', title: 'PageID' },
            { id: 'title', title: 'Title' },
            { id: 'slug', title: 'Slug' },
            { id: 'monthlyVolume', title: 'MonthlyVolume' },
            { id: 'metaDescription', title: 'MetaDescription' },
            { id: 'previewURL', title: 'PreviewURL' },
            { id: 'contentType', title: 'Content Type' },
            { id: 'created', title: 'Created' },
            { id: 'edited', title: 'Edited' },
            { id: 'status', title: 'Status' },
            { id: 'publishedDate', title: 'Published Date' },
            { id: 'unpublishedDate', title: 'Unpublished Date' },
            { id: 'labels', title: 'Labels' },
            { id: 'createdBy', title: 'Created By' },
            { id: 'lastEditedBy', title: 'Last Edited By' },
            { id: 'redirectUrl', title: 'Redirect URL' },
            { id: 'redirectType', title: 'Redirect Type' },
            { id: 'pagePath', title: 'Page Path' },
            { id: 'weeklyClicks', title: 'Weekly Clicks' },
            { id: 'weeklyImpressions', title: 'Weekly Impressions' },
            { id: 'weeklyCtr', title: 'Weekly CTR' },
            { id: 'weeklyPosition', title: 'Weekly Position' },
            { id: 'serp', title: 'SERP' },
          ],
        });
        const records = csvStringifier.stringifyRecords(
          allContent.map((prod) => {
            const recentMetric = (prod.weeklyMetrics || []).sort((m1, m2) =>
              m1.start < m2.start ? 1 : m1.start > m2.start ? -1 : 0,
            )[0];

            return {
              pageId: prod.pageId,
              title: prod.title.trim(),
              slug: prod.slug,
              monthlyVolume: prod.monthlyVolume,
              metaDescription: prod.metaDescription,
              previewURL: prod.previewURL,
              contentType: prod.contentTemplateName,
              created: dateFormatter(prod.dateAdded),
              edited: dateFormatter(prod.dateModified),
              status: Object.keys(PageStatus).find(
                (key) => PageStatus[key] === prod.status,
              ),
              publishedDate: dateFormatter(prod.datePublished),
              unpublishedDate: dateFormatter(prod.dateUnpublished),
              labels: prod.labels,
              createdBy: prod.authorEmail,
              lastEditedBy: prod.lastEditorEmail,
              redirectUrl: prod.pageSettings && prod.pageSettings.redirectUrl,
              redirectType: prod.pageSettings && prod.pageSettings.redirectType,
              pagePath: prod.pageSettings && prod.pageSettings.pagePath,
              weeklyClicks: recentMetric && recentMetric.clicks,
              weeklyImpressions: recentMetric && recentMetric.impressions,
              weeklyCtr: recentMetric && recentMetric.ctr,
              weeklyPosition: recentMetric && recentMetric.position,
              serp: prod.serp,
            };
          }),
        );
        const allData = csvStringifier.getHeaderString() + records;
        //write to s3
        const fileName = 'page-' + uuidv4() + '.csv';
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
        console.log('download link:', downloadUrl);
        success = true;
      } else {
        message = 'No records';
      }
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, downloadUrl: downloadUrl };
  }

  static async getNext(
    accountId,
    workflowId,
    editors,
    templateId,
    filterLabels,
    matchType,
    status,
    pageId,
  ) {
    let success = false;
    let message = '';
    let page = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      page = await PageDB.getNext(
        SharedService.getUserOrgId(accountId),
        workflowId,
        editors,
        templateId,
        filterLabels,
        matchType,
        status,
        pageId,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      page: page,
    };
  }

  static async getPreviewPage(accountId, slug) {
    const acct = await AccountDB.getById(
      accountId,
      SharedService.getUserOrgId(accountId),
    );
    if (acct) {
      const page = await PageDB.getBySlug(
        SharedService.getUserOrgId(accountId),
        slug,
      );
      const pageUrl = getPagePreviewLink(page);
      console.log('preview pageUrl: ', pageUrl);

      const result = await PageService.customFetch(pageUrl);
      if (result) {
        const data = await result.text();
        return { success: true, data: data };
      } else {
        return {
          success: false,
          message: 'The preview for this page is currently unavailable.',
        };
      }
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static customFetch = async (url, timeout = 3000, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      console.log('fetching: ', i);
      try {
        let timeoutId = null;
        if (timeout) {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), timeout);
        }
        return await fetch(url).then((res) => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          if (res.status === 200) {
            return res;
          } else if (res.status === 410) {
            console.log(`401 -> Giving up on ${url}`);
            i += 100;
            throw new Error(`Failed with status ${res.status}`);
          } else {
            throw new Error(`Failed with status ${res.status}`);
          }
        });
      } catch (ex) {
        if (i === retries - 1) {
          console.log(`Giving up on ${url}`);
          // throw ex;
          return null;
        } else {
          console.log(`Retrying fetch (${ex.message})`);
        }
      }
    }
  };

  static async findByResultKey(accountId, pageId, resultKey) {
    let success = false;
    let message = '';
    let pages = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      pages = await PageDB.findByResultKey(
        SharedService.getUserOrgId(accountId),
        pageId,
        resultKey,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      pages: pages,
    };
  }

  static async findByTitle(accountId, title) {
    let success = false;
    let message = '';
    let pages = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const word = title.split(' ').pop();
      const revertWord = revertSingularOrPlural(word);
      let titles = [title.toLowerCase()];
      if (word !== revertWord) {
        const words = title.split(' ');
        words.pop();
        words.push(revertWord);
        titles.push(words.join(' ').toLowerCase());
      }
      pages = await PageDB.findByTitle(
        SharedService.getUserOrgId(accountId),
        titles,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      pages: pages,
    };
  }
}

module.exports = PageService;
