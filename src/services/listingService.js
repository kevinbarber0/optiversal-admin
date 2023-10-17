import { v4 as uuidv4 } from 'uuid';
import SharedService from '@services/sharedService';
const ListingDB = require('@db/listingDB');
const AccountDB = require('@db/accountDB');
const AWSUtility = require('@util/aws');

class ListingService {
  static async getAll({
    accountId,
    offset,
    limit,
    filter,
    sortBy,
    marketplace,
    minQuality,
    maxQuality,
  }) {
    let success = false;
    let message = '';
    let listings = [];
    let totalCountAndAverage = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      listings = await ListingDB.getAll({
        orgId: SharedService.getUserOrgId(accountId),
        offset,
        limit,
        filter,
        sortBy,
        marketplace,
        minQuality,
        maxQuality,
      });
      totalCountAndAverage = await ListingDB.getCountAndAverage({
        orgId: SharedService.getUserOrgId(accountId),
        filter,
        marketplace,
        minQuality,
        maxQuality,
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      listings: listings,
      totalCount: totalCountAndAverage.total,
      averageScore: totalCountAndAverage.averageScore,
    };
  }

  static async getBySku(accountId, sku) {
    let success = false;
    let message = '';
    let listing = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      listing = await ListingDB.getBySku(SharedService.getUserOrgId(accountId), sku);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, listing: listing };
  }

  static async getNextGrammarSample(accountId) {
    let success = false;
    let message = '';
    let sample = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      sample = await ListingDB.getNextGrammarSample();
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message, sample: sample };
  }

  static async saveGrammarSample(accountId, sampleId, edited) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      await ListingDB.saveGrammarSample(sampleId, edited);
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }

  static async getExportDownloadUrl(
    accountId,
    filter,
    marketplace,
    minQ,
    maxQ,
  ) {
    let success = false;
    let message = '';
    let downloadUrl = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      //get all content
      const allContent = await ListingDB.getExportData(
        SharedService.getUserOrgId(accountId),
        filter,
        marketplace,
        minQ,
        maxQ,
      );

      if (allContent && allContent.length > 0) {
        //create csv
        const createCsvStringifier =
          require('csv-writer').createObjectCsvStringifier;
        // Product ID, Marketplace, Marketplace ID, Name, URL, Score, Issues
        const csvStringifier = createCsvStringifier({
          header: [
            { id: 'productId', title: 'Product ID' },
            { id: 'marketplace', title: 'Marketplace' },
            { id: 'marketplaceId', title: 'Marketplace ID' },
            { id: 'name', title: 'Name' },
            { id: 'url', title: 'URL' },
            { id: 'score', title: 'Score' },
            { id: 'issues', title: 'Issues' },
          ],
        });
        const records = csvStringifier.stringifyRecords(
          allContent.map((row) => {
            const productErrors = row.analyticsData.dataAnalysis?.errors || [];
            const reviewErrors = row.analyticsData.reviewAnalysis?.errors || [];
            const qaErrors = row.analyticsData.qaAnalysis?.errors || [];
            const allErrors = [...productErrors, ...reviewErrors, ...qaErrors];

            const productWarnings =
              row.analyticsData.dataAnalysis?.warnings || [];
            const reviewWarnings =
              row.analyticsData.reviewAnalysis?.warnings || [];
            const qaWarnings = row.analyticsData.qaAnalysis?.warnings || [];
            const allWarnings = [
              ...productWarnings,
              ...reviewWarnings,
              ...qaWarnings,
            ];

            return {
              productId: row.productId,
              marketplace: row.sourceId,
              marketplaceId: row.externalId,
              name: row.productData.productData.title,
              url: row.url,
              score: row.analyticsData.score,
              issues: [
                ...allErrors.map((e) => e.label),
                ...allWarnings.map((e) => e.label),
              ].join(', '),
            };
          }),
        );
        const allData = csvStringifier.getHeaderString() + records;
        //write to s3
        const fileName = 'listing-' + uuidv4() + '.csv';
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
      message = 'Unauthorized';
    }
    return { success: success, message: message, downloadUrl: downloadUrl };
  }

  static async getSources() {
    const listingSources = await ListingDB.getSources(SharedService.getUserOrgId(accountId));
    return { success: true, message: '', listingSources: listingSources };
  }
}

module.exports = ListingService;
