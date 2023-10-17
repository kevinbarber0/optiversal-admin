const {
  tryCatcher,
} = require('@helpers/scraping');
const { stringContainsAny } = require('@util/string');
const fetch = require('node-fetch');
const FormData = require('form-data');
const {
  ListingAnalysisResult
} = require('@util/enum');
const ComponentService = require('@services/componentService');
const CompletionService = require('@services/completionService');

const {
  getAmazonReviewFromElement,
  getDocumentFromRawHTML,
} = require('@helpers/scraping');

/**
 * Get product reviews from given URL
 *
 * @param {string} url URL to get reviews
 * @returns reviews list
 */
async function getReviewsFromURL(url) {
  const html = await fetch(url).then((res) => res.text());

  const reviewSectionDocument = getDocumentFromRawHTML(html);

  return Array.from(
    reviewSectionDocument.querySelectorAll(
      '#cm_cr-review_list > div[data-hook="review"]',
    ),
  ).map((reviewElement) => getAmazonReviewFromElement(reviewElement));
}

async function retrieveProductTopReviews(asin) {
  return await getReviewsFromURL(
    `https://www.amazon.com/product-reviews/${asin}`,
  );
}

async function retrieveProductNegativeReviews(asin) {
  const reviews = await Promise.all(
    ['one', 'two'].map(
      async (ratingWord) =>
        await getReviewsFromURL(
          `https://www.amazon.com/product-reviews/${asin}/?filterByStar=${ratingWord}_star`,
        ),
    ),
  );

  return {
    one: reviews[0],
    two: reviews[1],
  };
}

async function retrieveProductCustomerImages(asin) {
  const formData = new FormData();
  formData.append('asin', asin);
  formData.append('noCache', new Date().getTime());
  const res = await fetch(
    'https://www.amazon.com/gp/customer-reviews/aj/private/reviewsGallery/get-data-for-reviews-image-gallery-for-asin',
    {
      method: 'POST',
      body: formData,
    },
  ).then((res) => res.json());

  return res.images
    ? res.images.map(
      ({
        smallImage,
        mediumImage,
        largeImage,
        associatedReview: { text, title, overallRating },
      }) => ({
        smallImage,
        mediumImage,
        largeImage,
        text,
        title,
        overallRating,
      }),
    )
    : null;
}

/**
 * Retrieve general product reviews
 *
 * @param {string} asin: ASIN for the product in Amazon
 * @returns product reviews
 */
export async function retrieveProductReviews(asin) {
  return await Promise.all([
    retrieveProductTopReviews(asin),
    retrieveProductNegativeReviews(asin),
    retrieveProductCustomerImages(asin),
  ]).then(([topReviews, negativeReviews, customerImages]) => ({
    topReviews,
    negativeReviews,
    customerImages,
  }));
}

/**
 * Analyze Product Reviews
 *
 * @param {Object} reviewData
 * @returns analysis data
 */
export async function analyzeProductReviews(reviewData) {
  const analysisData = {
    successes: [],
    warnings: [],
    errors: []
  };

  for (let i = 0; i < analysisModules.length; i++) {
    const mod = analysisModules[i];
    const res = await tryCatcher(() => mod(reviewData));
    if (res) {
      if (res.result === ListingAnalysisResult.Error) {
        analysisData.errors.push(res);
      }
      else if (res.result === ListingAnalysisResult.Warning) {
        analysisData.warnings.push(res);
      }
      else {
        analysisData.successes.push(res);
      }
    }
  }

  return analysisData;
}


/**
 * Product review analysis modules
 */

//do top reviews contain negative reviews
const checkNegativeTopReviews = async (reviewData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Negative top reviews',
    message: 'Top reviews do not contain a negative review',
    value: 0
  };
  if (reviewData.topReviews && reviewData.topReviews.length > 0) {
    const negativeReviewCount = reviewData.topReviews.filter(r => r.rating.indexOf('1.0') === 0 || r.rating.indexOf('2.0') === 0).length;
    analysisObj.value = negativeReviewCount + ' negative top review(s)';

    if (negativeReviewCount > 1) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Top reviews contain multiple negative ratings';
    }
    else if (negativeReviewCount > 0) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Top reviews contain a negative rating';
    }
  }
  return analysisObj;
};

//check for mentions of product image issues
const checkWrongImageMentions = async (reviewData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Review product image complaints',
    message: 'Product image complaints are not prevalent in reviews',
    value: 0
  };
  const returnPhrases = [
    'wrong image',
    'wrong pic',
    'wrong photo',
    'misleading image',
    'misleading photo',
    'misleading pic',
    't look like the photo',
    't look like the pic',
    't look like the image',
  ];
  let totalImageMentions = 0;
  let timestamps = [];
  if (reviewData.topReviews && reviewData.topReviews.length > 0) {
    totalImageMentions = reviewData.topReviews.filter(r => (r.rating.indexOf('1.0') === 0 || r.rating.indexOf('2.0') === 0) && stringContainsAny(r.title + ' ' + r.text, returnPhrases)).length;
    timestamps.push(reviewData.topReviews.map(r => r.title + r.date));
  }
  if (reviewData.negativeReviews && reviewData.negativeReviews.one && reviewData.negativeReviews.one.length > 0) {
    totalImageMentions += reviewData.negativeReviews.one.filter(r => !timestamps.includes(r.title + r.date) && stringContainsAny(r.title + ' ' + r.text, returnPhrases)).length;
  }
  if (reviewData.negativeReviews && reviewData.negativeReviews.two && reviewData.negativeReviews.two.length > 0) {
    totalImageMentions += reviewData.negativeReviews.two.filter(r => !timestamps.includes(r.title + r.date) && stringContainsAny(r.title + ' ' + r.text, returnPhrases)).length;
  }
  analysisObj.value = totalImageMentions + ' product image complaint(s) found';
  if (totalImageMentions > 2) {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'Several reviews contain product image complaints';
  }
  else if (totalImageMentions > 0) {
    analysisObj.result = ListingAnalysisResult.Warning;
    analysisObj.message = 'Reviews contain one or more complaints about product images';
  }
  return analysisObj;
};

//check for mentions of misleading description
const checkMisleadingDescriptionMentions = async (reviewData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Misleading description complaints',
    message: 'Misleading description complaints are not prevalent in reviews',
    value: 0
  };
  const phrases = [
    'mislead',
    'description',
    'misled',
  ];
  let totalMentions = 0;
  let timestamps = [];
  if (reviewData.topReviews && reviewData.topReviews.length > 0) {
    totalMentions = reviewData.topReviews.filter(r => (r.rating.indexOf('1.0') === 0 || r.rating.indexOf('2.0') === 0) && stringContainsAny(r.title + ' ' + r.text, phrases)).length;
    timestamps.push(reviewData.topReviews.map(r => r.title + r.date));
  }
  if (reviewData.negativeReviews && reviewData.negativeReviews.one && reviewData.negativeReviews.one.length > 0) {
    totalMentions += reviewData.negativeReviews.one.filter(r => !timestamps.includes(r.title + r.date) && stringContainsAny(r.title + ' ' + r.text, phrases)).length;
  }
  if (reviewData.negativeReviews && reviewData.negativeReviews.two && reviewData.negativeReviews.two.length > 0) {
    totalMentions += reviewData.negativeReviews.two.filter(r => !timestamps.includes(r.title + r.date) && stringContainsAny(r.title + ' ' + r.text, phrases)).length;
  }
  analysisObj.value = totalMentions + ' misleading description complaint(s) found';
  if (totalMentions > 2) {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'Several reviews contain misleading description complaints';
  }
  else if (totalMentions > 0) {
    analysisObj.result = ListingAnalysisResult.Warning;
    analysisObj.message = 'Reviews contain one or more misleading description complaints';
  }
  return analysisObj;
};

//check for mentions of returning
const checkReturnMentions = async (reviewData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Review return mentions',
    message: 'Return mentions are not prevalent in reviews',
    value: 0
  };
  const returnPhrases = [
    'returning these',
    'returning this',
    'returning them',
    'returning it',
    'returned these',
    'returned this',
    'returned them',
    'returned it',
    'return the',
    'return these',
    'return them',
    'return it',
    'refund',
    'money back',
    'sent these back',
    'sent them back',
    'sent it back',
    'sent this back',
  ];
  let totalReturnMentions = 0;
  if (reviewData.topReviews && reviewData.topReviews.length > 0) {
    totalReturnMentions = reviewData.topReviews.filter(r => stringContainsAny(r.title + ' ' + r.text, returnPhrases)).length;
  }
  if (reviewData.negativeReviews && reviewData.negativeReviews.one && reviewData.negativeReviews.one.length > 0) {
    totalReturnMentions += reviewData.negativeReviews.one.filter(r => stringContainsAny(r.title + ' ' + r.text, returnPhrases)).length;
  }
  if (reviewData.negativeReviews && reviewData.negativeReviews.two && reviewData.negativeReviews.two.length > 0) {
    totalReturnMentions += reviewData.negativeReviews.two.filter(r => stringContainsAny(r.title + ' ' + r.text, returnPhrases)).length;
  }
  analysisObj.value = totalReturnMentions + ' return mention(s) found';
  if (totalReturnMentions > 2) {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'Several reviews contain return mentions';
  }
  else if (totalReturnMentions > 0) {
    analysisObj.result = ListingAnalysisResult.Warning;
    analysisObj.message = 'Reviews contain one or more return mentions';
  }
  return analysisObj;
};

//check if images are mostly attached to negative reviews
const checkNegativeImages = async (reviewData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Customer images from negative reviews',
    message: 'Customers are not sharing negative images',
    value: 0
  };
  if (reviewData.customerImages && reviewData.customerImages.length > 0) {
    const negativeImageCount = reviewData.customerImages.filter(img => img.overallRating < 3).length;
    analysisObj.value = negativeImageCount + ' image(s) from negative reviews';

    if (negativeImageCount > 1) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Customer images include multiple negative reviews';
    }
    else if (negativeImageCount > 0) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Customer images include a negative review';
    }
  }
  return analysisObj;
};

const parseCons = (raw) => {
  // format is like:
  // [Q: Who used the product? A:] son (20 years old, male, active)
  // Q: What did the reviewer like about the product? A: color, versatility
  // Q: What did the reviewer dislike about the product? A: nothing
  // Q: What is the product used for? A: exercise, walks, everyday use
  const allCons = [];
  if (raw && raw.trim().length > 0) {
    const lines = raw.trim().split('\n');
    if (lines.length === 4) {
      // line 3 -> Q: What did the reviewer dislike about the product? A: con1, con2
      const conList = lines[2].split('A: ')[1];
      const cons = conList.split(', ');
      for (let i = 0; i < cons.length; i++) {
        const con = cons[i].trim().toLowerCase();
        if (con != 'nothing' && con != 'no stretch' && con != 'none' && con != 'everything' && con != 'size runs small' && !allCons.includes(con)) {
          allCons.push(con);
        }
      }
    }
  }
  return allCons;
};

//check for most common complaint issue
const checkTopComplaints = async (reviewData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Recurring negative review themes',
    message: 'No recurring negative themes detected',
    value: 0
  };
  let allNegativeReviews = [];
  if (reviewData.negativeReviews && reviewData.negativeReviews.one && reviewData.negativeReviews.one.length > 0) {
    allNegativeReviews = [...allNegativeReviews, ...reviewData.negativeReviews.one];
  }
  if (reviewData.negativeReviews && reviewData.negativeReviews.two && reviewData.negativeReviews.two.length > 0) {
    allNegativeReviews = [...allNegativeReviews, ...reviewData.negativeReviews.two];
  }
  console.log(allNegativeReviews.length);

  const conCounts = {};
  const componentRes = await ComponentService.getById('85OfFzXyl1PlPEOu813BOcKLT7H2', 'Review Insights');
  console.log(componentRes);
  if (componentRes && componentRes.success) {
    //for each negative review
    for (let i = 0; i < allNegativeReviews.length; i++) {
      const review = allNegativeReviews[i];
      let text = review.text.replace(/\s+/gi, ' ');
      if (text.length > 1000) {
        text = text.substring(0, 1000);
      }
      const prompt = componentRes.component.settings.prompt.replace('{{header}}', text);
      //get review insights
      const res = await CompletionService.getRawCompletion(null, prompt, 'curie-instruct-beta', 500, 0.0, 1, 0.01, 0.02, ['\n\n', 'Product review']);
      if (res.success) {
        const cons = parseCons(res.completion);
        console.log(cons);
        //keep running total of cons
        for (let j = 0; j < cons.length; j++) {
          if (conCounts[cons[j]]) {
            conCounts[cons[j]] = conCounts[cons[j]] + 1;
          }
          else {
            conCounts[cons[j]] = 1;
          }
        }
      }
    }
  }

  console.log(conCounts);
  let recurringComplaints = [];
  let seriousComplaints = [];
  for (const con in conCounts) {
    console.log(con, conCounts[con]);
    if (conCounts[con] > 5) {
      seriousComplaints.push(con + ' (' + conCounts[con] + ')');
    }
    else if (conCounts[con] > 2) {
      recurringComplaints.push(con + ' (' + conCounts[con] + ')');
    }
  }
  console.log(seriousComplaints);
  console.log(recurringComplaints);

  if (seriousComplaints.length > 0) {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.value = seriousComplaints.join(', ');
    if (recurringComplaints.length > 0) {
      analysisObj.value += ', ' + recurringComplaints.join(', ');
    }
    analysisObj.message = 'Reviews contain one or more significantly recurring complaints';
  }
  else if (recurringComplaints.length > 1) {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.value = recurringComplaints.join(', ');
    analysisObj.message = 'Reviews contain multiple recurring complaints';
  }
  else if (recurringComplaints.length > 0) {
    analysisObj.result = ListingAnalysisResult.Warning;
    analysisObj.value = recurringComplaints.join(', ');
    analysisObj.message = 'Reviews contain a recurring complaint';
  }

  return analysisObj;
};

const analysisModules = [
  checkNegativeTopReviews,
  checkNegativeImages,
  checkReturnMentions,
  checkWrongImageMentions,
  checkMisleadingDescriptionMentions,
  checkTopComplaints,
];
