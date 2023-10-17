import { v4 as uuidv4 } from 'uuid';
import SharedService from '@services/sharedService';
const AccountDB = require('@db/accountDB');
const ReviewDB = require('@db/reviewDB');
const AnnotationDB = require('@db/annotationDB');
const AccountActionService = require('./accountActionService');
const { UserAction } = require('@util/enum');
class ReviewService {
  static async getReviews(
    accountId,
    offset,
    limit,
    skus,
    startDate,
    endDate,
    minRating,
    maxRating,
    keyword,
    sort,
  ) {
    let success = false;
    let message = '';
    let reviews = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      let apiUrl =
        process.env.SEARCH_SERVICE +
        '/reviews?o=' +
        encodeURIComponent(SharedService.getUserOrgId(accountId));
      if (limit) apiUrl += `&limit=${limit}`;
      if (offset) apiUrl += `&offset=${offset}`;
      if (skus) apiUrl += `&skus=${skus}`;
      if (startDate) apiUrl += `&startdate=${startDate}`;
      if (endDate) apiUrl += `&enddate=${endDate}`;
      if (minRating >= 0) apiUrl += `&minrating=${minRating}`;
      if (maxRating >= 0) apiUrl += `&maxrating=${maxRating}`;
      if (keyword) apiUrl += `&keyword=${keyword}`;
      if (sort) apiUrl += `&sort=${sort}`;
      const result = await fetch(apiUrl);
      reviews = await result.json();
      success = true;
    }
    return {
      success: success,
      message: message,
      reviews: reviews.reviews,
      totalCount: reviews.totalCount,
    };
  }

  static async getReview(accountId, id) {
    let success = false;
    let message = '';
    let reviews = [];
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      let apiUrl =
        process.env.SEARCH_SERVICE +
        '/reviews?o=' +
        encodeURIComponent(SharedService.getUserOrgId(accountId));
      if (id) apiUrl += `&r=${id}`;
      const result = await fetch(apiUrl);
      reviews = await result.json();
      success = true;
    }
    return {
      success: success,
      message: message,
      reviews: reviews.reviews,
    };
  }

  static async getReviewAnnotations(accountId, reviewId) {
    let success = false;
    let message = '';
    let annotations = null;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      annotations = await ReviewDB.getReviewAnnotations(
        SharedService.getUserOrgId(accountId),
        reviewId,
      );
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success,
      message,
      annotations: annotations?.annotations?.annotations,
    };
  }

  static async updateReviewAnnoations(accountId, review, annotations) {
    let success = false;
    let message = '';
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      if (annotations?.annotations?.length > 0) {
        const newAnnotations = await Promise.all(
          annotations.annotations.map(async (a) => {
            if (a.topic && a.topic === a.topicId) {
              const topicId = uuidv4();
              await AnnotationDB.ensureAnnotationTopic(
                topicId,
                a.annotationTypeId,
                SharedService.getUserOrgId(accountId),
                a.topic,
                a.topic,
              );
              a.topicId = topicId;
            }
            return a;
          }),
        );
        annotations.annotations = newAnnotations;
      }
      await ReviewDB.setReviewAnnotations(
        SharedService.getUserOrgId(accountId),
        review.reviewId,
        JSON.stringify(annotations),
        accountId,
      );
      await AccountActionService.logAccountAction(accountId, {
        actionType: 'UpdateReviewAnnotations',
        description: UserAction.UpdateReviewAnnotations,
        itemType: 'review_annotations',
        itemId: review.reviewId,
        itemName: `<${review.title}> <${review.text}>`,
        changedValue: {
          annotations,
        },
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success: success, message: message };
  }
}

module.exports = ReviewService;
