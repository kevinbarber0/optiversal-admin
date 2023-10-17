import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { apiRequest } from './util';
import queryClient from './query-client';
import queryString from 'query-string';
import { FindPagesBy } from '@util/enum';

export function fetchUrl(url) {
  const u = encodeURIComponent(url);
  return apiRequest(`fetch?url=${u}`);
}

export function analyzeReview(content) {
  return apiRequest('reviewanalysis', 'POST', { content });
}

export function findOrCreateUser(id, source, email, raw) {
  return apiRequest('account', 'POST', { id, source, email, raw });
}

export function updateUserProfile(accountId, userData) {
  return apiRequest('account/update-profile', 'PATCH', {
    accountId: accountId,
    userData: {
      name: userData?.name,
      email: userData?.email,
    },
  });
}

export function deleteUserProfile() {
  return apiRequest('account/update-profile', 'POST');
}

export function getAccountOrganizations(accountId) {
  return apiRequest(`accounts/${accountId}/organizations`);
}

export function findIDProvider(email) {
  return apiRequest('identityProvider', 'POST', { email });
}

export function useAccount() {
  const query = () => apiRequest(`account`);
  return useQuery('account', query, {
    enabled: false,
  });
}

export function useOrgPageSettings() {
  const query = () => apiRequest('pagesettings');
  return useQuery('pageSettings', query);
}

export function useOrgSettings() {
  const query = () => apiRequest('settings');
  return useQuery('settings', query);
}

export function useGetOrgGeoLocations() {
  const query = () => apiRequest(`settings/geo-locations`);
  return useQuery(['orgGeoLocations'], query);
}

export async function updateOrgGeoLocations(locations) {
  return apiRequest('settings/geo-locations', 'PUT', locations).then(
    (result) => {
      queryClient.refetchQueries('orgGeoLocations', { force: true });
      return result;
    },
  );
}

export function updateOrgSettings(settings) {
  return apiRequest('settings', 'PUT', settings).then((result) => {
    queryClient.refetchQueries('account', { force: true });
    return result;
  });
}

export function useGetOrgUrlSettings(type) {
  const query = () =>
    apiRequest(
      `settings/url?` +
        queryString.stringify({
          type: type || 'home',
        }),
    );
  return useQuery(
    [
      'settings/url',
      {
        type: type || 'home',
      },
    ],
    query,
  );
}

export function useOrgAccounts(orgId, inactivate = false) {
  return useQuery(['orgAccounts', { orgId, inactivate }], () =>
    getOrgAccounts(orgId, inactivate),
  );
}

export function useOrgAccountsForFilter(orgId) {
  return useQuery(['orgAccounts', { orgId }], () =>
    getOrgAccountsForFilter(orgId),
  );
}

export function updatePage(page) {
  return apiRequest('page', 'PUT', page).then((result) => {
    queryClient.refetchQueries('pages', { force: true });
    return result;
  });
}

export function updatePageStatus(pageId, slug, status) {
  return apiRequest(`page/${pageId}/status`, 'PUT', { status: status }).then(
    (result) => {
      queryClient.refetchQueries('pages', { force: true });
      queryClient.refetchQueries('page' + slug, { force: true });
      return result;
    },
  );
}

export function bulkUpdatePageStatus(ids, status) {
  return apiRequest(`page/status`, 'POST', {
    pageIds: ids,
    status: status,
  }).then((result) => {
    queryClient.refetchQueries('pages', { force: true });
    return result;
  });
}

export function bulkAddPageLabel(pageIds, label) {
  return apiRequest(`page/label`, 'POST', {
    pageIds: pageIds,
    label: label,
  }).then((result) => {
    queryClient.refetchQueries('pages', { force: true });
    return result;
  });
}

export async function bulkAddPageLabels(labels) {
  const result = await apiRequest(`page/bulkLabels`, 'POST', {
    labels: labels,
  });
  queryClient.refetchQueries('pages', { force: true });
  return result;
}

export function updatePageLabels(pageId, slug, labels) {
  return apiRequest(`page/${pageId}/label`, 'PUT', { labels: labels }).then(
    (result) => {
      queryClient.refetchQueries('pages', { force: true });
      queryClient.refetchQueries('page' + slug, { force: true });
      return result;
    },
  );
}

export function updateContact(contact) {
  return apiRequest('account', 'PUT', contact).then((result) => {
    queryClient.refetchQueries('account', { force: true });
    return result;
  });
}

export function useGetPubPages(filter) {
  const query = () =>
    apiRequest(
      `page/pubPages?` +
        queryString.stringify({
          startDate: filter?.startDate,
          endDate: filter?.endDate,
        }),
    );
  return useQuery(
    [
      'page/pubPages',
      {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
      },
    ],
    query,
  );
}

export function useGetImpPages(filter) {
  const query = () =>
    apiRequest(
      `page/impPages?` +
        queryString.stringify({
          startDate: filter?.startDate,
          endDate: filter?.endDate,
        }),
    );
  return useQuery(
    [
      'page/impPages',
      {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
      },
    ],
    query,
  );
}

export function useGetPagesWithImpression() {
  const query = () => apiRequest(`page/withImpression`);
  return useQuery('withimpression', query);
}

export function useGetMetrics(filter) {
  const query = () =>
    apiRequest(
      `page/metrics?` +
        queryString.stringify({
          startDate: filter?.startDate,
          endDate: filter?.endDate,
        }),
    );
  return useQuery(
    [
      'page/metrics',
      {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
      },
    ],
    query,
  );
}

export function useGetSERPs(filter) {
  const query = () =>
    apiRequest(
      `page/serps?` +
        queryString.stringify({
          startDate: filter?.startDate,
          endDate: filter?.endDate,
        }),
    );
  return useQuery(
    [
      'page/serps',
      {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
      },
    ],
    query,
  );
}

export function useGetPages({
  offset,
  limit,
  keyword,
  filters,
  sortBy,
  resultKey,
}) {
  const query = () =>
    apiRequest(
      `page?` +
        queryString.stringify({
          offset,
          limit,
          keyword,
          filters: JSON.stringify(filters),
          sortBy,
          resultKey,
        }),
    );
  return useQuery(
    [
      'pages',
      {
        offset,
        limit,
        keyword,
        filters,
        sortBy,
        resultKey,
      },
    ],
    query,
  );
}

export function getPagesSelect(offset, limit, filter, contentType) {
  return apiRequest(
    `page?offset=${offset}&limit=${limit}&filter=${filter}&ct=${contentType}`,
  );
}

export function useGetPage(slug, enabled = true) {
  const query = () => apiRequest(`page/${slug}`);
  return useQuery(['pages', { slug: slug }], query, { enabled: enabled });
}

export function getPageDirect(slug) {
  return apiRequest(`page/${slug}`);
}

export function useGetNextPage(
  workflowId,
  editors,
  templateId,
  filterLabels,
  matchType,
  status,
  pageId,
) {
  const query = () =>
    apiRequest(
      'page/next?' +
        queryString.stringify({
          workflowId: workflowId,
          templateId: templateId,
          editors: editors,
          filterLabels: filterLabels,
          matchType: matchType,
          status: status,
          pageId: pageId,
        }),
    );
  return useQuery(
    [
      'nextpage',
      {
        editors: editors,
        templateId: templateId,
        filterLabels: filterLabels,
        matchType: matchType,
        status: status,
        pageId: pageId,
      },
    ],
    query,
  );
}

export function getPagePreview(slug) {
  return apiRequest(`page/${slug}/preview`);
}

export function savePageWorkflow(workflow, pageData, action) {
  return apiRequest(`workflow/${workflow?.workflowId}/page`, 'POST', {
    workflow: workflow,
    page: pageData,
    action: action,
  }).then((result) => {
    queryClient.refetchQueries('nextpage', { force: true });
    return result;
  });
}

export function useGetReviews(
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
  const query = () =>
    apiRequest(
      'reviews?' +
        queryString.stringify({
          offset,
          limit,
          skus,
          startDate,
          endDate,
          minRating,
          maxRating,
          keyword,
          sort,
        }),
    );
  return useQuery(
    [
      'reviews',
      {
        offset,
        limit,
        skus,
        startDate,
        endDate,
        minRating,
        maxRating,
        keyword,
        sort,
      },
    ],
    query,
  );
}

export function useGetReview(id) {
  const query = () =>
    apiRequest(
      `reviews?` +
        queryString.stringify({
          id,
        }),
    );
  return useQuery(
    [
      'review',
      {
        id,
      },
    ],
    query,
  );
}

export function updateReviewAnnotations(review, annotations) {
  return apiRequest(`reviews`, 'POST', {
    review,
    annotations,
  });
}

export function useGetReviewAnnotations(id) {
  const query = () =>
    apiRequest(
      `review/annotations?` +
        queryString.stringify({
          id,
        }),
    );
  return useQuery(['annotations', { id }], query);
}

export function useGetAnnotationTypes() {
  const query = () => apiRequest(`review/annotationtype`);
  return useQuery(['annotationtype', {}], query);
}

export function useGetSuggestions(
  offset,
  limit,
  filter,
  importedOnly,
  minQuality,
  maxQuality,
  filterLabel,
  ideaWorkflow,
  sortBy,
) {
  const query = () =>
    apiRequest(
      'suggestion?' +
        queryString.stringify({
          offset: offset,
          limit: limit,
          filter: filter,
          imported: importedOnly,
          minq: minQuality,
          maxq: maxQuality,
          label: filterLabel,
          ideaWorkflow: ideaWorkflow,
          sort: sortBy,
        }),
    );
  return useQuery(
    [
      'suggestions',
      {
        offset: offset,
        limit: limit,
        filter: filter,
        importedOnly: importedOnly,
        minQuality: minQuality,
        maxQuality: maxQuality,
        filterLabel: filterLabel,
        ideaWorkflow: ideaWorkflow,
        sortBy: sortBy,
      },
    ],
    query,
  );
}

export function useGetNextSuggestion(
  workflowId,
  filterLabels,
  importedOnly,
  matchType,
  keyword,
) {
  const query = () =>
    apiRequest(
      'suggestion/next?' +
        queryString.stringify({
          workflowId: workflowId,
          filterLabels: filterLabels,
          imported: importedOnly,
          matchType: matchType,
          keyword: keyword,
        }),
    );
  return useQuery(
    [
      'nextsuggestion',
      {
        workflowId: workflowId,
        filterLabels: filterLabels,
        importedOnly: importedOnly,
        matchType: matchType,
        keyword: keyword,
      },
    ],
    query,
  );
}

export function getIdeaWorkflowsByUser(q) {
  return apiRequest(`workflow/idea-workflow?q=${q}`);
}

export function saveIdeaWorkflow(workflow, keyword, pageData, action) {
  return apiRequest(`workflow/${workflow?.workflowId}/idea`, 'POST', {
    workflow: workflow,
    keyword: keyword,
    page: pageData,
    action: action,
  }).then((result) => {
    queryClient.refetchQueries('nextsuggestion', { force: true });
    return result;
  });
}

export function updateSuggestionStatus(keyword, status) {
  return apiRequest(`suggestion/${keyword}/status`, 'PUT', {
    status: status,
  }).then((result) => {
    queryClient.refetchQueries('suggestions', { force: true });
    return result;
  });
}

export function bulkUpdateSuggestionStatus(keywords, status) {
  return apiRequest(`suggestion/status`, 'POST', {
    keywords: keywords,
    status: status,
  }).then((result) => {
    queryClient.refetchQueries('suggestions', { force: true });
    return result;
  });
}

export function updateSuggestionLabels(keyword, labels) {
  return apiRequest(`suggestion/${keyword}/label`, 'PUT', {
    labels: labels,
  }).then((result) => {
    queryClient.refetchQueries('suggestions', { force: true });
    return result;
  });
}

export function bulkAddSuggestionLabel(keywords, label) {
  return apiRequest(`suggestion/label`, 'POST', {
    keywords: keywords,
    label: label,
  }).then((result) => {
    queryClient.refetchQueries('suggestions', { force: true });
    return result;
  });
}

export function getComponents() {
  return apiRequest(`component?offset=0&limit=50`);
}

export function useGetComponents(offset, limit) {
  const query = () => apiRequest(`component?offset=${offset}&limit=${limit}`);
  return useQuery(['components', { offset: offset, limit: limit }], query);
}

export function useGetWorkflowComponents() {
  const query = () => apiRequest(`component/workflow`);
  return useQuery(['components', {}], query);
}

export function useGetComponent(id) {
  const query = () => apiRequest(`component/${id}`);
  return useQuery(['components', { componentId: id }], query);
}

export function updateComponent(component) {
  return apiRequest('component', 'PUT', component).then((result) => {
    queryClient.refetchQueries('components', { force: true });
    return result;
  });
}

export function useGetContentTemplates(offset = null, limit = null) {
  const query = () =>
    apiRequest(`contenttemplate?offset=${offset}&limit=${limit}`);
  return useQuery(
    ['contenttemplates', { offset: offset, limit: limit }],
    query,
  );
}

export function useGetContentTemplate(id) {
  const query = () => apiRequest(`contenttemplate/${id}`);
  return useQuery(['contenttemplates', { contentTemplateId: id }], query);
}

export function updateContentTemplate(contentTemplate) {
  return apiRequest('contenttemplate', 'PUT', contentTemplate).then(
    (result) => {
      queryClient.refetchQueries('contenttemplates', { force: true });
      return result;
    },
  );
}

export function getConcepts(prefix) {
  return apiRequest(`concept?prefix=${prefix}`);
}

export function getCategories(prefix) {
  return apiRequest(`category?prefix=${prefix}`);
}

export function getCategoryByIds(categoryIds) {
  return apiRequest(
    `category?` +
      queryString.stringify({
        categoryIds,
      }),
  );
}

export function getSkus(prefix) {
  return apiRequest(`sku?prefix=${prefix}`);
}

export function getLabels(prefix) {
  return apiRequest(`label?prefix=${prefix}`);
}

export function getProductLabels(prefix) {
  return apiRequest(`productlabel?prefix=${prefix}`);
}

export function getContentTemplates(prefix) {
  return apiRequest(`contenttemplate?prefix=${prefix}`);
}

export function getAnnotationTopics(query, at) {
  return apiRequest(`review/topics?at=${at}&query=${query}`);
}

export function getOrgAccounts(orgId, inactivate = false) {
  return apiRequest(
    `organization/${orgId}/accounts?` +
      queryString.stringify({
        inactivate,
      }),
  );
}

export function getOrgAccountsForFilter(orgId) {
  return apiRequest(`organization/${orgId}/accounts-filter`);
}

export function useGetProducts(keyword) {
  const k = encodeURIComponent(keyword);
  const query = () => apiRequest(`product?keyword=${k}`);
  return useQuery(['products', { keyword: keyword }], query);
}

export function useGetProductWithContent(sku) {
  const query = () => apiRequest(`product/${sku}`);
  return useQuery(['products', { sku: sku }], query);
}

export function getFeatures(prefix) {
  return apiRequest(`feature?prefix=${prefix}`);
}

export function getCustomAttributes(prefix) {
  return apiRequest(`attribute?prefix=${prefix}`);
}

export function parseQuery(q) {
  const query = encodeURIComponent(q);
  return apiRequest(`parse?q=${query}`);
}

export function searchProducts(q, loc) {
  return apiRequest(`search`, 'post', { q, loc });
}

export function getSample(settings) {
  return apiRequest(`sample`, 'post', settings);
}

export function getCompletion(settings) {
  return apiRequest(`compose`, 'post', settings);
}

export function getCompletionTemp(settings) {
  return apiRequest(`composetemp`, 'post', settings);
}

export function semanticSearchProducts(settings) {
  return apiRequest(`semsearch`, 'post', settings);
}

export function getProductPageContent(skus) {
  return apiRequest(`product/pagecontent`, 'post', skus);
}

export function setProductPageContent(sku, key, value) {
  return apiRequest('product/pagecontent', 'PUT', {
    sku: sku,
    key: key,
    value: value,
  }).then((result) => {
    queryClient.refetchQueries('products', { force: true });
    return result;
  });
}

export function setProductContent(sku, key, value) {
  return apiRequest('product/content', 'PUT', {
    sku,
    key,
    value,
  }).then((result) => {
    queryClient.refetchQueries('products', { force: true });
    //queryClient.refetchQueries('workflowproducts', { force: true });
    return result;
  });
}

export function composeProductContent(product, copyType, autoSave) {
  return apiRequest(`product/${product.sku}/compose`, 'post', {
    product: product,
    copyType: copyType,
    autoSave: autoSave,
  }).then((result) => {
    queryClient.refetchQueries('products', { force: true });
    return result;
  });
}

export function getTopicSuggestions(contentTemplateId, cue) {
  return apiRequest(`topic?ct=${contentTemplateId}&cue=${cue}`);
}

export function getInstagramCaption(username, theme) {
  return apiRequest(`unblock/instagram`, 'post', {
    username: username,
    topic: theme,
  });
}

export function getTweet(username, theme) {
  return apiRequest(`unblock/twitter`, 'post', {
    username: username,
    topic: theme,
  });
}

export function getYouTubeTitles(username, theme) {
  return apiRequest(`unblock/youtube`, 'post', {
    username: username,
    topic: theme,
  });
}

export function uploadKeywordFile(files) {
  return apiRequest('suggestion/upload', 'POST', null, files);
}

export function useGetConceptInsights(conceptId) {
  const query = () => apiRequest(`concept/${conceptId}/insights`);
  return useQuery(['conceptinsights', { conceptId: conceptId }], query);
}

export function authorConceptInsight(conceptId, type) {
  return apiRequest(`concept/${conceptId}/insight`, 'post', {
    type: type,
  }).then((result) => {
    queryClient.refetchQueries('conceptinsights', { force: true });
    return result;
  });
}

export function useGetPageTranslations(slug) {
  const query = () => apiRequest(`page/${slug}/translation`);
  return useQuery(['pagetranslations', { slug: slug }], query);
}

export function addPageTranslation(slug, data) {
  return apiRequest(`page/${slug}/translation`, 'POST', data).then((result) => {
    queryClient.refetchQueries('pagetranslations', { force: true });
    return result;
  });
}

export function updatePageTranslation(slug, data) {
  return apiRequest(`page/${slug}/translation`, 'PUT', data).then((result) => {
    queryClient.refetchQueries('pagetranslations', { force: true });
    return result;
  });
}

export function addProductTranslation(sku, data) {
  return apiRequest(`product/${sku}/translation`, 'POST', data).then(
    (result) => {
      queryClient.refetchQueries('products', { force: true });
      return result;
    },
  );
}

/**
 * Update User Profile
 *
 * @param {string} orgId
 * @param {string} accountId
 * @param {*} options: {displayName, roles, disabled}
 */
export function updateOrganizationUser(orgId, accountId, options) {
  return apiRequest(
    `organization/${orgId}/accounts/${accountId}`,
    'PUT',
    options,
  ).then((result) => {
    queryClient.refetchQueries('orgAccounts', { force: true });
    return result;
  });
}

export function createOrganizationUser(orgId, userInfo) {
  return apiRequest(`organization/${orgId}/accounts`, 'POST', userInfo).then(
    (result) => {
      queryClient.refetchQueries('orgAccounts', { force: true });
      return result;
    },
  );
}

export function useGetWorkflows(options = {}) {
  const query = () => apiRequest(`workflow`);
  return useQuery(['workflows'], query, options);
}

export function useGetWorkflow(workflowId) {
  const query = () => apiRequest(`workflow/${workflowId}`);
  return useQuery(['workflows', { workflowId: workflowId }], query);
}

export function updateWorkflowSettings(setting) {
  return apiRequest('workflow', 'PUT', setting).then((result) => {
    queryClient.refetchQueries('workflows', { force: true });
    return result;
  });
}

export function updateFileWorkflowSettings(formData) {
  return apiRequest('workflow/file-workflow', 'PUT', null, formData).then(
    (result) => {
      queryClient.refetchQueries('workflows', { force: true });
      return result;
    },
  );
}

export function updateWorkflowStatus(workflowId, status) {
  return apiRequest(`workflow/${workflowId}`, 'PUT', {
    workflowId: workflowId,
    status: status,
  }).then((result) => {
    queryClient.refetchQueries('workflows', { force: true });
    return result;
  });
}

export function startWorkflowAutomation(workflowId) {
  return apiRequest(`workflow/${workflowId}/start`, 'PUT');
}

export function stopWorkflowAutomation(workflowId) {
  return apiRequest(`workflow/${workflowId}/stop`, 'PUT');
}

export function getPageWorkflowsByUser(q) {
  return apiRequest(`workflow/page-workflow?q=${q}`);
}

export function getAccounts() {
  return apiRequest(`accounts`);
}

export function getWorkflowProductCount(workflowId) {
  return queryClient.fetchQuery(
    ['workflows', { workflowId: workflowId }, 'productCount'],
    () => apiRequest(`workflow/${workflowId}/count`),
  );
}

export function useGetWorkflowNextProduct(workflowId) {
  const query = () => apiRequest(`workflow/${workflowId}/next`);
  return useQuery(['workflowproducts', { workflowId: workflowId }], query);
}

export function finishWorkflowProduct(workflowId, sku, name, content) {
  return apiRequest(`workflow/${workflowId}/next`, 'POST', {
    sku,
    name,
    content,
  }).then((result) => {
    queryClient.refetchQueries('workflowproducts', { force: true });
    return result;
  });
}

export function getWorkflowExportUrl(workflowId, workflowType) {
  return apiRequest(`workflow/${workflowId}/export`, 'POST', {
    workflowType,
  });
}

export function useGetCompletedWorkflowItems(
  workflowId,
  offset,
  limit,
  sortBy,
) {
  const query = () =>
    apiRequest(
      `workflow/${workflowId}/completedItems?` +
        queryString.stringify({
          offset,
          limit,
          sortBy,
        }),
    );

  return useQuery(
    [
      'completedworkflowitems',
      {
        offset,
        limit,
        sortBy,
      },
    ],
    query,
  );
}

export function useGetWorkflowItems(workflowId) {
  const query = () => apiRequest(`workflow/${workflowId}/items`);
  return useQuery(['workflowitems', { workflowId: workflowId }], query);
}

export function updateWorkflowItem(item) {
  return apiRequest(`workflow/${item.workflowId}/items`, 'POST', {
    item,
  });
}

export function resetWorkflowItem(workflowId, itemId) {
  return apiRequest(`workflow/${workflowId}/items`, 'PUT', {
    itemId,
  }).then((result) => {
    queryClient.refetchQueries('completedworkflowitems', { force: true });
    return result;
  });
}

export function completeWorkflowItem(workflowId, itemId) {
  return apiRequest(`workflow/${workflowId}/complete`, 'POST', {
    itemId,
  });
}

export function sendVerificationEmail(token = null) {
  if (token) {
    return apiRequest(`account/send-verification-email-by-token`, 'POST', {
      token,
    });
  } else {
    return apiRequest(`account/send-verification-email`, 'POST');
  }
}

export function useContentLabelSubscriptions() {
  return useQuery('contentLabelSubscriptions', () =>
    apiRequest(`current-account/content-label-subscription`),
  );
}

export function updateContentLabelSubscriptions(labels) {
  return apiRequest(
    'current-account/content-label-subscription',
    'PUT',
    labels,
  ).then((result) => {
    queryClient.refetchQueries('contentLabelSubscriptions', { force: true });
    return result;
  });
}

export function useGetProductsWithFilters({
  offset,
  limit,
  keyword,
  categories,
  includedFilters,
  missingContent,
  minLowestQuality,
  maxLowestQuality,
}) {
  const query = () =>
    apiRequest(
      `catalog?` +
        queryString.stringify(
          {
            offset,
            limit,
            keyword,
            categories,
            includedFilters,
            missingContent,
            minLowestQuality,
            maxLowestQuality,
          },
          {
            skipEmptyString: true,
            skipNull: true,
          },
        ),
    );

  return useQuery(
    [
      'catalogs',
      {
        offset,
        limit,
        keyword,
        categories,
        includedFilters,
        missingContent,
        minLowestQuality,
        maxLowestQuality,
      },
    ],
    query,
  );
}

export async function updateProductLabels(sku, labels) {
  const result = await apiRequest(`product/${sku}/label`, 'PUT', {
    labels: labels,
  });
  queryClient.refetchQueries('catalogs', { force: true });
  return result;
}

export function runListingQualityService(url) {
  return apiRequest('listing-quality', 'POST', {
    url,
  });
}

export function useAnalysisData(analysisId) {
  const [latestResult, setLatestResult] = useState(undefined);
  const isFinished = !!latestResult?.progress?.finished;
  const { data } = useQuery(
    ['getAnalysisData', analysisId, isFinished],
    async () => {
      if (!analysisId || isFinished) {
        return null;
      }

      const { result } = await apiRequest(
        `listing-quality/${analysisId}`,
        'GET',
      );
      return result;
    },
    {
      refetchInterval: 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  useEffect(() => {
    if (!isFinished) {
      setLatestResult(data);
    }
  }, [data, isFinished]);

  useEffect(() => {
    setLatestResult(undefined);
  }, [analysisId]);

  return { result: latestResult, isFinished };
}

export function revokeGoogleToken(code) {
  return apiRequest(`oauth/revoke?code=${code}`);
}

export function exportPages(options) {
  return apiRequest(`page/export`, 'POST', options);
}

export function useGetListings(
  offset,
  limit,
  filter,
  sortBy,
  marketplace,
  minQuality,
  maxQuality,
) {
  const query = () =>
    apiRequest(
      `listing?` +
        queryString.stringify({
          offset,
          limit,
          filter,
          sortBy,
          marketplace,
          minQuality,
          maxQuality,
        }),
    );
  return useQuery(
    [
      'listing',
      {
        offset,
        limit,
        filter,
        sortBy,
        marketplace,
        minQuality,
        maxQuality,
      },
    ],
    query,
  );
}

export function useGetListing(sku) {
  const query = () => apiRequest(`listing/${sku}`);
  return useQuery(['listings', { sku: sku }], query);
}

export function useGetOrganizationListingSources(orgId) {
  const query = () => apiRequest(`listing/source`);
  return useQuery(['listingSource', { orgId }], query);
}

export function exportListings(filter, marketplace, minQuality, maxQuality) {
  return apiRequest(`listing/export`, 'POST', {
    filter,
    marketplace,
    minQuality,
    maxQuality,
  });
}

export function getNextGrammarSample() {
  return apiRequest(`grammarsample`, 'GET');
}

export function saveGrammarSample(sampleId, edited) {
  return apiRequest(`grammarsample`, 'PUT', {
    sampleId,
    edited,
  });
}

export function useGetAccountActions({
  offset,
  limit,
  filter,
  sortBy,
  accounts,
  actionTypes,
  dateRange,
}) {
  const query = () =>
    apiRequest(
      `account-actions?` +
        queryString.stringify({
          offset,
          limit,
          filter,
          sort: sortBy,
          accounts,
          actionTypes,
          dateRange: dateRange
            ? Object.values(dateRange).map((dt) =>
                dt.toISOString().substr(0, 10),
              )
            : null,
        }),
    );
  return useQuery(
    [
      'accountActions',
      {
        offset,
        limit,
        filter,
        sortBy,
        accounts,
        actionTypes,
        dateRange,
      },
    ],
    query,
  );
}

export function getTranslatedContent(targetLang, text) {
  return apiRequest(`translation/translate-content`, 'post', {
    targetLang: targetLang,
    text: text,
  });
}

export function useGetLanguagesOption() {
  const query = () => apiRequest(`translation/localizations`);
  return useQuery(['languages'], query);
}

export function useGetRelatedPages(
  title,
  pageId,
  pinned,
  excluded,
  enabled = true,
  includeExternal = false,
) {
  const query = () =>
    apiRequest(
      `search-services/related-pages?` +
        queryString.stringify({
          title,
          pageId,
          pinned: pinned ? pinned.join(',') : null,
          excluded: excluded ? excluded.join(',') : null,
          external: includeExternal ? 'true' : 'false',
        }),
    );
  return useQuery(
    ['related-pages', { title, pageId, pinned, excluded }],
    query,
    {
      enabled: enabled,
    },
  );
}

export function updateAuth0User(data) {
  return apiRequest('auth/user', 'PATCH', {
    data,
  });
}

export function resetPasswordAuth0(email) {
  return apiRequest('auth/resetpassword', 'POST', {
    email,
  });
}

export function enableMFAAuth0(email) {
  return apiRequest('auth/mfa', 'POST', {
    email,
  });
}

export function resendVerificationEmail() {
  return apiRequest(`auth/verification-email`, 'POST');
}

export function useFindPagesByResultKey(by, pageId, resultKey, enabled) {
  const query = () =>
    apiRequest(
      `page/find?` +
        queryString.stringify({
          by: FindPagesBy.ResultKey,
          pageId,
          resultKey,
        }),
    );

  return useQuery(
    [
      'findpagesbyresultkey',
      {
        by: FindPagesBy.ResultKey,
        pageId,
        resultKey,
      },
    ],
    query,
    {
      enabled: enabled,
    },
  );
}

export function checkSerp(q) {
  return apiRequest(
    `serp?` +
      queryString.stringify({
        q,
      }),
  );
}

export function findPagesByTitle(title) {
  return apiRequest(`page/find?by=${FindPagesBy.Title}&title=${title}`);
}

export function useGetOrgDefaultTemlpate() {
  const query = () => apiRequest(`settings/default-template`);
  return useQuery(['defaultTemplate'], query);
}
