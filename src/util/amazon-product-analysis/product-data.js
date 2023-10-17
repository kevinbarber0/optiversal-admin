const {
  tryCatcher,
  getElementText,
  getChildElementText,
  getDocumentFromRawHTML,
} = require('@helpers/scraping');
const {
  ListingAnalysisResult
} = require('@util/enum');
const CompletionService = require('@services/completionService');
const tokenizer = require('sbd');
var Diff = require("text-diff");

/**
 * Retrieve general product information that doesn't rely on other calls
 *
 * @param {string} asin: ASIN for the product in Amazon
 * @returns product data object
 */
export async function retrieveProductData(asin) {
  const productURL = `https://www.amazon.com/dp/${asin}`;
  const productData = {};

  // Fetch product page
  const res = await fetch(productURL);
  if (res.status !== 200) {
    throw new Error('Failed to fetch Amazon product page.');
  }

  // Create JS DOM
  const document = getDocumentFromRawHTML(await res.text());

  // Category breadcrumbs (array of strings ordered from general to specific)
  productData.breadcrumbs = await tryCatcher(() => {
    const breadcrumbLinkElements = document.querySelectorAll(
      '#wayfinding-breadcrumbs_container ul li a',
    );
    return Array.from(breadcrumbLinkElements).map((linkElement) => ({
      link: linkElement.href,
      name: getElementText(linkElement),
    }));
  });

  // Title (string)
  productData.title = await tryCatcher(() => {
    const titleElement = document.querySelector('#productTitle');
    return getElementText(titleElement);
  });

  // Star rating (double)
  productData.rating = await tryCatcher(() => {
    const ratingElement = document.querySelector(
      '#averageCustomerReviews [data-action=acrStarsLink-click-metrics] a i span',
    );
    if (!ratingElement) return null;
    return +getElementText(ratingElement).split(' ')[0];
  });

  // Number of ratings (int)
  productData.numberOfRatings = await tryCatcher(() => {
    const ratingElement = document.querySelector(
      '[data-hook="total-review-count"]',
    );
    return parseInt(getElementText(ratingElement).replace(/[^0-9]/g, ''));
  });

  // Price (double or object({min: double, max: double}))
  productData.price = await tryCatcher(() => {
    const priceElement = document.querySelector('#priceblock_ourprice');
    const prices = getElementText(priceElement)
      .split(' - ')
      .map((price) => +price.substr(1));

    return prices.length > 1 ? { min: prices[0], max: prices[1] } : prices[0];
  });

  // Is it prime (bool)
  productData.isPrime = await tryCatcher(() => {
    const primeElement = document.querySelector('#primePopoverContent');
    return !!primeElement;
  });

  // Variant names and values (object { "attribute1": ["value1", "value2"], "attribute2": ["value1"], etc}
  productData.variants = await tryCatcher(() => {
    const variantElements = document.querySelectorAll('#twister > div[id]');

    return Array.from(variantElements)
      .map((container) => {
        const key = getChildElementText(container, 'label.a-form-label').slice(
          0,
          -1,
        );
        let options = [];
        if (!key) {
          return null;
        }

        const optionsContainer = container.querySelector(
          'ul[data-action], select[data-action]',
        );

        if (optionsContainer) {
          switch (optionsContainer.tagName) {
            case 'SELECT':
              options = Array.from(
                optionsContainer.querySelectorAll(
                  'option[data-a-html-content]',
                ),
              ).map((optionEl) => optionEl.getAttribute('data-a-html-content'));
              break;
            case 'UL':
              options = Array.from(optionsContainer.querySelectorAll('li')).map(
                (optionEl) =>
                  (optionEl.getAttribute('title') || '').replace(
                    'Click to select ',
                    '',
                  ),
              );
              break;
            default:
              break;
          }
        } else {
          options = [
            getChildElementText(
              container,
              'label.a-form-label ~ span.selection',
            ),
          ];
        }

        return { [key]: options };
      })
      .filter((v) => !!v)
      .reduce((acc, value) => ({ ...acc, ...value }), {});
  });

  // Product bullets (array of strings)
  productData.features = await tryCatcher(() => {
    const featureBulletElements = document.querySelectorAll(
      '#feature-bullets ul li:not([id]) span',
    );

    return Array.from(featureBulletElements).map((element) =>
      getElementText(element),
    );
  });

  // Offers and promotions (array of strings)
  // TODO: Skip for now

  // From the manufacturer content (string, all HTML in this section)
  productData.fromManufacturerContent = await tryCatcher(() => {
    const element = document.querySelector('#aplus_feature_div');

    return element ? element.innerHTML.trim() : null;
  });

  // Product description (string)
  productData.productDescription = await tryCatcher(() => {
    const elements = document.querySelectorAll(
      '#productDescription > *:not(.disclaim)',
    );

    return Array.from(elements)
      .map((el) => getElementText(el).replace(/\n/g, ''))
      .join('\n');
  });

  // Product details (object, { "attribute1": "value1", "attribute2": "value2", etc. }
  productData.productDetails = await Promise.all([
    (() => {
      // Layout 1: under #detailBulletsWrapper_feature_div
      const element = document.querySelector(
        '#detailBulletsWrapper_feature_div',
      );
      if (!element) return null;

      return Promise.resolve(
        Array.from(element.querySelectorAll('ul.detail-bullet-list'))
          .map((listEl) => {
            // Skip review since it's already fetched at step 4 and 5
            if (
              !listEl ||
              listEl.querySelector('#detailBullets_averageCustomerReviews')
            ) {
              return null;
            }

            const salesRankEl = listEl.querySelector(
              '#dpx-amazon-sales-rank_feature_div',
            );
            if (salesRankEl) {
              if (
                !salesRankEl.querySelector('li#SalesRank > b') ||
                !salesRankEl.querySelector('li#SalesRank')
              ) {
                return null;
              }
              const key = getChildElementText(
                salesRankEl,
                'li#SalesRank > b',
              ).slice(0, -1);
              const mainRanking = getChildElementText(
                salesRankEl,
                'li#SalesRank',
              )
                .substr(key.length + 2) // remove key
                .split('\n')
                .filter((str) => !!str)
                .map((str) => {
                  const bracketIndex = str.search(' \\(');
                  return bracketIndex > -1 ? str.substr(0, bracketIndex) : str;
                }) // remove description in brackets
                .map((str) => str.toString().split('in')) // split by in
                .map(([ranking, ...others]) => [
                  +ranking.replace(/[^0-9]/g, ''),
                  others.join('in').trim(),
                ]) // first is ranking, others join to make key
                .reduce(
                  (acc, [ranking, key]) => ({ ...acc, [key]: ranking }),
                  {},
                );
              const value = Array.from(salesRankEl.querySelectorAll('ul > li'))
                .map((el) => getElementText(el))
                .map((str) => {
                  const bracketIndex = str.search(' \\(');
                  return bracketIndex > -1 ? str.substr(0, bracketIndex) : str;
                }) // remove description in brackets
                .map((str) => str.toString().split('in')) // split by in
                .map(([ranking, ...others]) => [
                  +ranking.replace(/[^0-9]/g, ''),
                  others.join('in').trim(),
                ])
                .reduce(
                  (acc, [ranking, key]) => ({ ...acc, [key]: ranking }),
                  mainRanking,
                );
              return {
                [key]: value,
              };
            } else {
              return Array.from(
                listEl.querySelectorAll('li > span.a-list-item'),
              ).reduce((acc, itemEl) => {
                if (
                  !itemEl.querySelector('.a-text-bold') ||
                  !itemEl.querySelector('.a-text-bold ~ span')
                ) {
                  return acc;
                }
                const key = getChildElementText(itemEl, '.a-text-bold').slice(
                  0,
                  -6,
                ); // remove " : " at the end of string
                const data = getChildElementText(itemEl, '.a-text-bold ~ span');

                return { ...acc, [key]: data };
              }, {});
            }
          })
          .filter((v) => !!v)
          .reduce((acc, v) => ({ ...acc, ...v }), {}),
      );
    })(),
    (() => {
      // Layout 2: under #detailBulletsWrapper_feature_div
      const element = document.querySelector('#prodDetails');

      if (!element) {
        return null;
      }

      return Promise.resolve(
        Array.from(element.querySelectorAll('table tbody tr'))
          .map((el) => {
            const key = getChildElementText(el, 'th');
            if (key === 'Customer Reviews') {
              return null;
            } else if (key === 'Best Sellers Rank') {
              const value = getChildElementText(el, 'td')
                .split('\n')
                .filter((str) => !!str)
                .map((str) => {
                  const bracketIndex = str.search(' \\(');
                  return bracketIndex > -1 ? str.substr(0, bracketIndex) : str;
                }) // remove description in brackets
                .map((str) => str.toString().split('in')) // split by in
                .map(([ranking, ...others]) => [
                  +ranking.replace(/[^0-9]/g, ''),
                  others.join('in').trim(),
                ]) // first is ranking, others join to make key
                .reduce(
                  (acc, [ranking, key]) => ({ ...acc, [key]: ranking }),
                  {},
                );
              return { [key]: value };
            } else {
              return {
                [key]: getChildElementText(el, 'td'),
              };
            }
          })
          .filter((v) => !!v)
          .reduce((acc, v) => ({ ...acc, ...v }), {}),
      );
    })(),
  ])
    .then(([details1, details2]) => {
      return { ...(details1 || {}), ...(details2 || {}) };
    })
    .catch((e) => {
      productData.productDetails = null;
    });

  // Rating breakdown (object, { "five": 53, "four": 28, etc. }
  productData.ratingBreakdowns = await tryCatcher(() => {
    const ratingElements = document.querySelectorAll(
      '#histogramTable tbody tr',
    );
    const numberWords = ['five', 'four', 'three', 'two', 'one'];

    return Array.from(ratingElements)
      .map((element) => element.getAttribute('aria-label') || '')
      .map((str) => str.split(' ').find((s) => s.includes('%')) || '0%')
      .map((str) => +str.slice(0, -1))
      .reduce((acc, percent, i) => ({ ...acc, [numberWords[i]]: percent }), {});
  });

  // Image URLs (array of strings)
  productData.images = await tryCatcher(() => {
    const imageScript = document.querySelector('#imageBlock ~ script');
    if (!imageScript) return null;
    const dataStartIndex = imageScript.text.search('var data = {');
    const dataEndIndex = imageScript.text.search('};');

    let imageData;
    const A = { $: { parseJSON: JSON.parse } };

    eval(
      imageScript.text
        .substring(dataStartIndex, dataEndIndex + 3)
        .replace('var data = ', 'imageData = '),
    );

    return imageData.colorImages.initial.map(
      ({ thumb, large, hiRes, lowRes }) => ({
        thumb,
        large,
        hiRes,
        lowRes,
      }),
    );
  });

  // Does it have a video
  productData.hasVideo = await tryCatcher(() => {
    const videoEl = document.querySelector('li.videoBlockIngress');
    return !!videoEl;
  });

  // Video URLs (array of strings)
  productData.videos = await tryCatcher(() => {
    const containerElement = document.querySelector('#rvs-vse-related-videos');

    if (!containerElement) {
      return null;
    }

    return Array.from(
      containerElement.querySelectorAll('ol li a[data-redirect-url]'),
    ).map((el) => el.href);
  });

  return productData;
}

/**
 * Analyze Product Data
 *
 * @param {Object} productData
 * @returns analysis data
 */
export async function analyzeProductData(productData) {
  const analysisData = {
    successes: [],
    warnings: [],
    errors: []
  };

  for (let i = 0; i < analysisModules.length; i++) {
    const mod = analysisModules[i];
    const res = await tryCatcher(() => mod(productData));
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
 * Product data analysis modules
 */

//see if title length is below recommended length
const checkTitleLength = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Product Title Length',
    message: null,
    value: 0
  };
  if (productData.title && productData.title.trim().length > 0) {
    const wordLength = productData.title.split(' ').length;
    const charLength = productData.title.length;
    analysisObj.value = wordLength + ' words, ' + charLength + ' characters';

    if (wordLength < 3 || charLength < 20) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Product title is very short';
    }
    else if (wordLength < 5 || charLength < 50) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Product title may be shorter than optimal';
    }
    else {
      analysisObj.message = 'Product title is not too short';
    }
  }
  else {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'Product title is empty';
  }
  return analysisObj;
};

//see if image count is below recommended size
const checkImageCount = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Product Image Count',
    message: null,
    value: 0
  };
  if (productData.images && productData.images.length > 0) {
    const imageCount = productData.images.length;
    analysisObj.value = imageCount + ' image(s)';

    if (imageCount === 1) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Listing only includes one product image';
    }
    else if (imageCount < 5) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Listing may benefit from more product images';
    }
    else {
      analysisObj.message = 'Listing includes several product images';
    }
  }
  else {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'No product images';
  }
  return analysisObj;
};

//see if video count is below recommended size
const checkVideoCount = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Product Video Count',
    message: null,
    value: 0
  };
  if (productData.videos && productData.videos.length > 0) {
    const videoCount = productData.videos.length;
    analysisObj.value = videoCount;

    analysisObj.message = 'Listing includes at least one video';
  }
  else {
    analysisObj.result = ListingAnalysisResult.Warning;
    analysisObj.message = 'No product videos';
  }
  return analysisObj;
};

//see if feature count is below recommended size
const checkFeatureCount = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Product Feature Bullet Count',
    message: null,
    value: 0
  };
  if (productData.features && productData.features.length > 0) {
    const featureCount = productData.features.length;
    analysisObj.value = featureCount + ' bullet(s)';

    if (featureCount === 1) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Listing only includes one product feature bullet';
    }
    else if (featureCount < 5) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Listing may benefit from more product feature bullets';
    }
    else {
      analysisObj.message = 'Listing includes several product feature bullets';
    }
  }
  else {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'No product feature bullets';
  }
  return analysisObj;
};

const getGrammarErrors = async (text) => {
  const errors = [];
  if (text && text.length > 10) {
    //split into sentences
    const sentences = tokenizer.sentences(text, {});
    let currentSegment = '';
    for (let i = 0; i < sentences.length; i++) {
      currentSegment += sentences[i] + '  ';
      //construct segments of 2 sentences
      if ((i > 0 && i % 2 === 0) || i === sentences.length - 1) {
        if (currentSegment.trim().length > 10) {
          //get corrected version
          console.log('Checking ' + currentSegment);
          const prompt = "Correct spelling and grammar mistakes in the product descriptions.\n\nOriginal: Large clamp universal type fits most Jabra, sound ID50% of Samsung's please confirm compatibility 8mm clamping diameter light weight and flexible doesn't break like the stiff rigid OEM.\nCorrected: Large clamp, universal type. Fits most Jabra and sound ID. 50% of Samsungs. Please confirm compatibility. 8mm clamping diameter. Lightweight and flexible. Doesn't break like the stiff rigid OEM.\n###\nOriginal: FOUNDED IN HONGKONG AND BASED IN LOS ANGELES, USA. WE ARE HOME OF IN-TREND STREETWEAR THAT ARE INSPIRED BY CELEBRITIES. WE DESIGN AND DEVELOP STYLISH, HIGH QUALITY GARMENTS WHICH YOU CAN AFFORD AND WE BELIEVE FIRMLY IN ONE NOT HAVING TO BUST THEIR WALLETS JUST TO LOOK FASHIONABLE OR TO BE TRENDY. WE ARE NOT AFRAID TO PUSH THE LIMITS OF STYLE AND FUNCTION AND WE INVITE YOU TO JOIN US ON THIS JOURNEY TO RE-INVENT STREETWEAR FASHION TOGETHER. THERE'S ALWAYS SOMEONE MORE THAN HAPPY TO HELP YOU OUT WITH YOUR INQUIRY. HAPPY SHOPPING!\nCorrected: Founded in Hong Kong and based in Los Angeles, USA, we are home of in-trend streetwear that is inspired by celebrities. We design and develop stylish, high-quality garments that you can afford, and we believe firmly in not having to break the bank just to look fashionable or to be trendy. We are not afraid to push the limits of style and function, and we invite you to join us on this journey to reinvent streetwear fashion together. There's always someone more than happy to help you out with your inquiry. Happy shopping!\n###\nOriginal:  Seamless Bluetooth Connection: TUINYO Wireless Headphones are compatible with all Bluetooth or 3.5mm plug cable enabled devices such as , Smart android phones, Tablet, Laptop, iPads, MP3/4 Player, Compuer, MacBook and other Bluetooth devices. Just slide the on/off button and the headphones will be in ready to pair mode. It is built to provide a quick and stable Bluetooth connection and to enable hands-free communication through our special noise reduction technology.\nCorrected: Seamless Bluetooth Connection: TUINYO Wireless Headphones are compatible with all Bluetooth or 3.5mm plug cable-enabled devices such as smart Android phones, tablets, laptops, iPads, MP3/4 players, computers, MacBooks, and other Bluetooth devices. Just slide the on/off button and the headphones will be in ready-to-pair mode. This is built to provide a quick and stable Bluetooth connection and to enable hands-free communication through our special noise-reduction technology.\n###\nOriginal: " + currentSegment.trim() + "\nCorrected:";
          const res = await CompletionService.getRawCompletion(null, prompt, 'text-davinci-002', 500, 0.0, 1, 0.001, 0.001, ['###', '\n'], {}, 1);
          if (res && res.success) {
            const seg = currentSegment.trim().toLowerCase().replace(/\W/g, '');
            const cmp = res.completion.trim().toLowerCase().replace(/\W/g, '');
            console.log('***' + seg + '****' + cmp + '***');
            if (!cmp.startsWith(seg) && !seg.startsWith(cmp)) {
              //if different, return as error
              errors.push({ original: currentSegment.trim(), corrected: res.completion.trim() });
            }
          }
          currentSegment = '';
        }
      }
    }
  }
  return errors;
};

//see if we find spelling and grammar errors in the feature bullets
const checkFeatureBulletsGrammar = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Feature Bullet Grammar',
    message: null,
    value: []
  };
  if (productData.features && productData.features.length > 0) {
    let allErrors = [];
    for (let i = 0; i < productData.features.length; i++) {
      const errors = await getGrammarErrors(productData.features[i]);
      allErrors = [...allErrors, ...errors];
    }
    const diff = new Diff();
    analysisObj.value = allErrors.map(e => diff.prettyHtml(diff.main(e.original, e.corrected)));
    if (allErrors.length > 2) {
      analysisObj.message = 'Feature bullets contain several potential grammatical errors';
      analysisObj.result = ListingAnalysisResult.Error;
    }
    else if (allErrors.length > 0) {
      analysisObj.message = 'Feature bullets contain potential grammatical errors';
      analysisObj.result = ListingAnalysisResult.Warning;
    }
    else {
      analysisObj.message = 'No grammatical errors detected in feature bullets';
      analysisObj.result = ListingAnalysisResult.Success;
    }
  }
  else {
    analysisObj.result = ListingAnalysisResult.Success;
    analysisObj.message = 'No feature bullet grammar errors detected';
  }
  return analysisObj;
};

//see if we find spelling and grammar errors in the product description
const checkDescriptionGrammar = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Product Description Grammar',
    message: null,
    value: []
  };
  if (productData.productDescription && productData.productDescription.trim().length > 0) {
    let allErrors = await getGrammarErrors(productData.productDescription);
    const diff = new Diff();
    analysisObj.value = allErrors.map(e => diff.prettyHtml(diff.main(e.original, e.corrected)));
    if (allErrors.length > 2) {
      analysisObj.message = 'Product description contains several potential grammatical errors';
      analysisObj.result = ListingAnalysisResult.Error;
    }
    else if (allErrors.length > 0) {
      analysisObj.message = 'Product description contains potential grammatical errors';
      analysisObj.result = ListingAnalysisResult.Warning;
    }
    else {
      analysisObj.message = 'No grammatical errors detected in product description';
      analysisObj.result = ListingAnalysisResult.Success;
    }
  }
  else {
    analysisObj.result = ListingAnalysisResult.Success;
    analysisObj.message = 'No product description grammar errors detected';
  }
  return analysisObj;
};

//description length
const checkDescriptionLength = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Product Description Length',
    message: null,
    value: 0
  };
  if (productData.productDescription && productData.productDescription.trim().length > 0) {
    const wordLength = productData.productDescription.split(' ').length;
    const charLength = productData.productDescription.length;
    const sentences = tokenizer.sentences(productData.productDescription.trim(), {});
    const sentenceLength = sentences.length;
    analysisObj.value = sentenceLength + ' sentences, ' + wordLength + ' words, ' + charLength + ' characters';

    if (wordLength < 3 || wordLength < 80) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Product description is very short';
    }
    else if (wordLength < 5 || wordLength < 150) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Product description may be shorter than optimal';
    }
    else {
      analysisObj.message = 'Product description is not too short';
    }
  }
  else {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'Product description is empty';
  }
  return analysisObj;
};

//keywords from title in description
const checkDescriptionKeywordsLength = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Product Description Keywords',
    message: null,
    value: ''
  };
  if (productData.productDescription && productData.productDescription.trim().length > 0 && productData.title && productData.title.trim().length > 0) {
    const titleWords = productData.title.replace(/[^\w\s]/gi, '').trim().toLowerCase().split(' ');
    const descrip = productData.productDescription.replace(/[^\w\s]/gi, '').trim().toLowerCase();
    const missingWords = [];
    for (let i = 0; i < titleWords.length; i++) {
      if (descrip.indexOf(titleWords[i]) < 0) {
        missingWords.push(titleWords[i]);
      }
    }

    if (missingWords.length > 0) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Product description may be missing important title keywords';
      analysisObj.value = missingWords.join(', ');
    }
    else {
      analysisObj.message = 'Product description is not missing title keywords';
    }
  }
  else {
    analysisObj.message = 'Product description is not missing title keywords';
  }
  return analysisObj;
};

//see if review rating is below healthy levels
const checkRating = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Overall rating',
    message: null,
    value: 0
  };
  if (productData.rating) {
    analysisObj.value = productData.rating + ' rating';

    if (productData.rating < 4.0) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Overall rating is low';
    }
    else if (productData.rating < 4.5) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Overall rating is somewhat low';
    }
    else {
      analysisObj.message = 'Overall rating is high';
    }
  }
  else {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'Review rating is missing';
  }
  return analysisObj;
};

//see if review rating count is below healthy levels
const checkRatingCount = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Success,
    label: 'Rating count',
    message: null,
    value: 0
  };
  if (productData.numberOfRatings) {
    analysisObj.value = productData.numberOfRatings + ' rating(s)';

    if (productData.numberOfRatings < 5) {
      analysisObj.result = ListingAnalysisResult.Error;
      analysisObj.message = 'Rating count is very low';
    }
    else if (productData.numberOfRatings < 20) {
      analysisObj.result = ListingAnalysisResult.Warning;
      analysisObj.message = 'Rating count is low';
    }
    else {
      analysisObj.message = 'Rating count is not too low';
    }
  }
  else {
    analysisObj.result = ListingAnalysisResult.Error;
    analysisObj.message = 'No ratings found';
  }
  return analysisObj;
};

const checkHasVideo = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Warning,
    label: 'Product video',
    message: 'Listing does not include a video',
    value: '0 videos'
  };
  if (productData.hasVideo) {
    analysisObj.value = '>=1 video';
    analysisObj.message = 'Listing includes a video';
    analysisObj.result = ListingAnalysisResult.Success;
  }

  return analysisObj;
};

const checkIsRanked = async (productData) => {
  const analysisObj = {
    result: ListingAnalysisResult.Warning,
    label: 'Best seller rank',
    message: null,
    value: 'None'
  };
  if (productData.productDetails && productData.productDetails['Best Sellers Rank']) {
    const cats = [];
    for (const cat in productData.productDetails['Best Sellers Rank']) {
      cats.push(cat + ' (' + productData.productDetails['Best Sellers Rank'][cat] + ')');
    }
    analysisObj.value = cats.join(', ');
    analysisObj.message = 'Listing includes one or more best seller ranks';
    analysisObj.result = ListingAnalysisResult.Success;
  }
  else {
    analysisObj.message = 'Product does not have any best seller ranks';
    analysisObj.result = ListingAnalysisResult.Warning;
  }

  return analysisObj;
};

const analysisModules = [
  checkTitleLength,
  checkImageCount,
  checkFeatureCount,
  checkFeatureBulletsGrammar,
  checkDescriptionGrammar,
  checkDescriptionLength,
  checkDescriptionKeywordsLength,
  checkRating,
  checkRatingCount,
  checkHasVideo,
  checkIsRanked
];
