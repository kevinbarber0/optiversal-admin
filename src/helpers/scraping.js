const jsdom = require('jsdom');

export const getChildElementText = (container, selector) => {
  const el = container.querySelector(selector);

  if (el) {
    return el.textContent.trim();
  } else {
    return '';
  }
};

export const getElementText = (el) => {
  if (el) {
    return el.textContent.trim();
  } else {
    return '';
  }
};

export const getAmazonReviewFromElement = (reviewElement) => {
  const reviewDateString = getChildElementText(
    reviewElement,
    '[data-hook="review-date"]',
  )
    .replace('Reviewed in the ', '')
    .replace('Reviewed in ', '')
    .split(' on ');
  return {
    authorName: getChildElementText(
      reviewElement,
      '.a-profile .a-profile-content .a-profile-name',
    ),
    location: reviewDateString[0],
    date: new Date(reviewDateString[1]),
    title: getChildElementText(reviewElement, '[data-hook="review-title"]'),
    text: getChildElementText(reviewElement, '[data-hook="review-body"]'),
    helpfulCount: +getChildElementText(
      reviewElement,
      '[data-hook="helpful-vote-statement"]',
    )
      .replace('One person', '1 person')
      .replace(/[^0-9]/g, ''),
    rating:
      getChildElementText(
        reviewElement,
        '[data-hook="review-star-rating"] span',
      ) ||
      getChildElementText(
        reviewElement,
        '[data-hook="cmps-review-star-rating"] span',
      ),
  };
};

export const tryCatcher = async (fn) => {
  let result = null;
  try {
    result = await fn();
  } catch (e) {
    console.log('error', e);
  }
  return result;
};

export const getDocumentFromRawHTML = (rawHTML) => {
  const virtualConsole = new jsdom.VirtualConsole();

  const {
    window: { document },
  } = new jsdom.JSDOM(rawHTML, { virtualConsole });

  return document;
};
