const ProcessExecuteService = require('./processExecuteService');
const ListingAnalysisDB = require('@db/listingAnalysisDB');
const {
  retrieveProductData,
  analyzeProductData,
  retrieveProductReviews,
  analyzeProductReviews,
  retrieveProductQuestions,
  analyzeQAData,
} = require('@util/amazon-product-analysis');
const { ListingAnalysisProcessStatus } = require('@util/enum');

class ListingAnalysisService {
  static async createService(url) {
    try {
      // Create a record in database
      const id = await ListingAnalysisDB.create(url);

      ListingAnalysisService.run(id, url);

      // Return id
      return {
        success: true,
        url: url,
        id,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  static async getProgress(id) {
    const result = await ListingAnalysisDB.getById(id);

    return {
      success: true,
      result,
    };
  }

  static async run(id, url) {
    const chain = {
      progress: {},
      data: {
        url,
      },
    };

    if (!(await ListingAnalysisService.validateURL(id, chain))) {
      return;
    }

    const workflow = new ProcessExecuteService(
      [
        [
          // product data
          [
            () => ListingAnalysisService.retrieveProductData(id, chain),
            () => ListingAnalysisService.analyzeProductData(id, chain),
          ],
          // product review,
          [
            () => ListingAnalysisService.retrieveProductReviews(id, chain),
            () => ListingAnalysisService.analyzeProductReviews(id, chain),
          ],
          // product qa
          [
            () => ListingAnalysisService.retrieveProductQAs(id, chain),
            () => ListingAnalysisService.analyzeProductQAs(id, chain),
          ],
        ],
        async () => {
          chain.progress.finished = true;
          await ListingAnalysisDB.updateProgress(id, chain.progress);
        },
      ],
      2,
    );

    workflow.run();
  }

  static async validateURL(id, chain) {
    chain.progress.URLValidation = {
      status: ListingAnalysisProcessStatus.NotStarted,
      success: undefined,
      errors: [],
    };
    const progress = chain.progress.URLValidation;
    const productData = chain.data;

    progress.status = ListingAnalysisProcessStatus.InProgress;
    await ListingAnalysisDB.updateProgress(id, chain.progress);

    // Parse ASIN from URL
    // /dp/asin format
    const params = productData.url.split('/');
    if (productData.url.includes('/dp/')) {
      const dpIndex = params.findIndex((str) => str === 'dp');
      productData.asin = params[dpIndex + 1].split('?')[0];
    } else if (productData.url.includes('/gp/product/')) {
      const gpIndex = params.findIndex((str) => str === 'gp');
      productData.asin = params[gpIndex + 2].split('?')[0];
    }
    if (!productData.asin) {
      progress.success = false;
      progress.error.push('No ASIN detected');
    } else {
      progress.success = true;
    }

    progress.status = ListingAnalysisProcessStatus.Finished;
    await ListingAnalysisDB.updateProgress(id, chain.progress);
    await ListingAnalysisDB.updateData(id, chain.data);

    return progress.success;
  }

  static async retrieveProductData(id, chain) {
    chain.progress.RetrieveProductData = {
      status: ListingAnalysisProcessStatus.InProgress,
      success: undefined,
    };
    await ListingAnalysisDB.updateProgress(id, chain.progress);

    // process
    chain.data.productData = await retrieveProductData(chain.data.asin);

    chain.progress.RetrieveProductData.status =
      ListingAnalysisProcessStatus.Finished;
    await ListingAnalysisDB.updateProgress(id, chain.progress);
    await ListingAnalysisDB.updateData(id, chain.data);
  }

  static async analyzeProductData(id, chain) {
    chain.progress.AnalyzeProductData = {
      status: ListingAnalysisProcessStatus.InProgress,
      success: undefined,
    };
    await ListingAnalysisDB.updateProgress(id, chain.progress);

    //process
    chain.data.productAnalysis = await analyzeProductData(
      chain.data.productData,
    );

    chain.progress.AnalyzeProductData.status =
      ListingAnalysisProcessStatus.Finished;
    await ListingAnalysisDB.updateProgress(id, chain.progress);
    await ListingAnalysisDB.updateData(id, chain.data);
  }

  static async retrieveProductReviews(id, chain) {
    chain.progress.RetrieveProductReviews = {
      status: ListingAnalysisProcessStatus.InProgress,
      success: undefined,
    };
    await ListingAnalysisDB.updateProgress(id, chain.progress);

    // process
    chain.data.productReviews = await retrieveProductReviews(chain.data.asin);

    chain.progress.RetrieveProductReviews.status =
      ListingAnalysisProcessStatus.Finished;
    await ListingAnalysisDB.updateProgress(id, chain.progress);
    await ListingAnalysisDB.updateData(id, chain.data);
  }

  static async analyzeProductReviews(id, chain) {
    chain.progress.AnalyzeProductReviews = {
      status: ListingAnalysisProcessStatus.InProgress,
      success: undefined,
    };
    await ListingAnalysisDB.updateProgress(id, chain.progress);

    //process
    chain.data.reviewAnalysis = await analyzeProductReviews(
      chain.data.productReviews,
    );

    chain.progress.AnalyzeProductReviews.status =
      ListingAnalysisProcessStatus.Finished;
    await ListingAnalysisDB.updateProgress(id, chain.progress);
    await ListingAnalysisDB.updateData(id, chain.data);
  }

  static async retrieveProductQAs(id, chain) {
    chain.progress.RetrieveProductQAs = {
      status: ListingAnalysisProcessStatus.InProgress,
      success: undefined,
    };

    await ListingAnalysisDB.updateProgress(id, chain.progress);

    // process
    chain.data.productQuestions = await retrieveProductQuestions(
      chain.data.asin,
    );

    chain.progress.RetrieveProductQAs.status =
      ListingAnalysisProcessStatus.Finished;
    await ListingAnalysisDB.updateProgress(id, chain.progress);
    await ListingAnalysisDB.updateData(id, chain.data);
  }

  static async analyzeProductQAs(id, chain) {
    chain.progress.AnalyzeProductQAs = {
      status: ListingAnalysisProcessStatus.InProgress,
      success: undefined,
    };
    await ListingAnalysisDB.updateProgress(id, chain.progress);

    //process
    chain.data.questionAnalysis = await analyzeQAData(
      chain.data.productQuestions,
    );

    chain.progress.AnalyzeProductQAs.status =
      ListingAnalysisProcessStatus.Finished;
    await ListingAnalysisDB.updateProgress(id, chain.progress);
    await ListingAnalysisDB.updateData(id, chain.data);
  }
}

export default ListingAnalysisService;
