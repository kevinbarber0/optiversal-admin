import classNames from 'classnames';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { Alert, Col, Row, Modal, ModalHeader, ModalBody } from 'reactstrap';
import {
  Header,
  PageSettings,
  PageContent,
  Content,
  RelatedPages,
} from './components';
import { DragDropContext } from 'react-beautiful-dnd';
import ComponentList from './components/ComponentList';
import {
  parseQuery,
  searchProducts,
  getCompletion,
  getProductPageContent,
  useGetComponents,
  updatePage,
  semanticSearchProducts,
  getPageDirect,
  setProductPageContent,
  updateSuggestionStatus,
  saveIdeaWorkflow,
  savePageWorkflow,
  getTranslatedContent,
  useGetLanguagesOption,
  getPagePreview,
} from '@util/api';
import { toast } from 'react-toastify';
import { Constants } from '@util/global';

import {
  SuggestionStatus,
  PresentationMode,
  WorkflowType,
  WorkflowItemAction,
} from '@util/enum';
import * as clipboard from 'clipboard-polyfill';
import { extractContent } from '@helpers/utils';
import CollapsibleCard from '@components/CollapsibleCard';
import ProductAssortmentSettings from './components/ProductAssortmentSettings';
import RelatedProductListSettings from './components/RelatedProductListSettings';
import { omit, isEmpty, isEqual } from 'lodash';
import { isValidURLByRegex } from '@helpers/utils';
import { useEditPageContext } from '@context/EditPageContext';
import { v4 as uuidv4 } from 'uuid';
import Loader from '@components/common/Loader';
import usePrevious from 'hooks/usePrevious';

const EditPage = () => {
  const router = useRouter();
  const {
    page,
    defaultPage,
    setPageChanged,
    title,
    setTitle,
    language,
    location,
    presentationMode,
    setDefaultPage,
    setLocation,
    setLanguage,
    setPresentationMode,
    workflow,
    template,
    keyword,
    locationPages,
    setLocationPages,
    isWorking,
    setIsWorking,
    onSave,
    orgSettingsStatus,
    orgSettings,
    setEnableAutoMeta,
  } = useEditPageContext();

  const [visibleTitle, setVisibleTitle] = useState(title);
  const [isComposed, setIsComposed] = useState(false);
  const [locationPageTitle, setLocationPageTitle] = useState();

  const defaultContentSettings = useRef({});
  const [pageSettings, setPageSettings] = useState({
    labels:
      page && page.labels
        ? page.labels.map((l) => {
            return { value: l, label: l };
          })
        : [],
    ...((page && page.pageSettings) || {}),
  });
  const prevPageSettings = usePrevious(pageSettings);

  const [metaDescription, setMetaDescription] = useState(
    pageSettings.metaDescription,
  );

  const [suggestedPath, setSuggestedPath] = useState();

  const { status, data: langsData } = useGetLanguagesOption();

  const { status: componentsStatus, data: componentsResult } = useGetComponents(
    0,
    100,
  );

  const [isComponentsReady, setIsComponentsReady] = useState(false);

  const [contentBlocks, setContentBlocks] = useState(
    page && page.content ? adjustContentBlocks(page) : [],
  );
  const prevContentBlocks = usePrevious(contentBlocks);

  const [preview, setPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState(null);

  const settingPannel = useRef();
  const [settingPannelHeight, setSettingPannelHeight] = useState(0);

  const adjustSettingPannelHeight = () => {
    const settingPannelEl = settingPannel.current;
    const rect = settingPannelEl.getBoundingClientRect();
    setSettingPannelHeight(`calc(100vh - ${rect.y}px)`);
  };

  useEffect(() => {
    if (
      componentsStatus === 'success' &&
      componentsResult &&
      componentsResult.success
    )
      setIsComponentsReady(true);
  }, [componentsStatus, componentsResult]);

  useEffect(() => {
    if (
      !isComponentsReady ||
      isEmpty(orgSettings?.settings) ||
      isEmpty(template)
    )
      return;
    if (keyword) {
      handleSearch();
      setEnableAutoMeta(true);
    } else {
      contentBlocks.forEach((contentRow) => {
        contentRow.forEach((contentBlock) => {
          if (
            contentBlock.component.componentId ===
              Constants.ProductAssortmentComponentId &&
            (contentBlock.settings === null ||
              contentBlock.settings.searchParameters === null)
          ) {
            authorContentBlock(contentBlock.contentBlockId);
          }
        });
      });

      setIsComposed(true);
    }
  }, [orgSettings?.settings, template, keyword, isComponentsReady]);

  useEffect(() => {
    adjustSettingPannelHeight();

    window.addEventListener('scroll', adjustSettingPannelHeight, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', adjustSettingPannelHeight);
    };
  }, []);

  useEffect(() => {
    if (
      !isEmpty(contentBlocks) &&
      !isEmpty(prevContentBlocks) &&
      !isEqual(contentBlocks, prevContentBlocks)
    ) {
      setPageChanged(true);
    }

    if (
      !isEmpty(pageSettings) &&
      !isEmpty(prevPageSettings) &&
      !isEqual(pageSettings, prevPageSettings)
    ) {
      setPageChanged(true);
    }
  }, [contentBlocks, pageSettings]);

  const defaultActiveComponent = useMemo(() => {
    const { rowIndex, colIndex } = findFirstContentByComponent(
      contentBlocks,
      Constants.ProductAssortmentComponentId,
    );

    const firstProductAssortmentContentId =
      rowIndex > -1 && colIndex > -1
        ? contentBlocks[rowIndex][colIndex].contentBlockId
        : null;
    return firstProductAssortmentContentId;
  }, []);

  const [activeComponent, setActiveComponent] = useState(
    defaultActiveComponent,
  );

  const activeContent = useMemo(() => {
    const { rowIndex, colIndex } = findContent(contentBlocks, activeComponent);
    if (rowIndex > -1 && colIndex > -1) {
      return contentBlocks[rowIndex][colIndex];
    }
    return null;
  }, [contentBlocks, activeComponent]);

  useEffect(() => {
    //only for the existing pages
    if (page || isEmpty(activeContent?.settings)) return;
    const getSuggestedPath = async () => {
      const res = await doSearch(activeContent.settings);
      const suggestedPath = getSuggestedPathFromResponse(res);
      if (res.success && suggestedPath?.length > 0) {
        setSuggestedPath(suggestedPath);
      }
    };

    getSuggestedPath().catch(console.error('Error getting suggested path.'));
  }, [activeContent]);

  const updatedContentBlocks = (contentBlocks) =>
    contentBlocks.map((contentBlock) =>
      contentBlock.map((cb) => {
        let translations;
        if (cb.drafts) {
          cb.drafts.map((d) => {
            if (
              d.isCurrent &&
              d.hasOwnProperty('translations') &&
              d.translations.hasOwnProperty('en')
            ) {
              cb.content.text = d.text = d.translations.en.text;
              cb.content.html = d.html = d.translations.en.html;
              translations = d.translations;
              translations = omit(translations, 'en');
              cb.content.translations = translations;
            }
            return d;
          });
        }

        return cb;
      }),
    );

  // Callbacks

  const doValidationForPage = () => {
    if (!title || title.trim().length === 0) {
      return { success: false, message: 'You must enter a page title' };
    }

    if (
      pageSettings.pagePath &&
      !(
        pageSettings.pagePath.startsWith('/') &&
        pageSettings.pagePath.endsWith('/')
      )
    ) {
      return {
        success: false,
        message:
          'Page Path must begin and end with a forward slash, e.g. /shoes/hightops/',
      };
    }

    if (
      pageSettings.redirectUrl &&
      !isValidURLByRegex(pageSettings.redirectUrl)
    ) {
      return { success: false, message: 'You must enter a valid redirect url' };
    }

    return { success: true };
  };

  const getPageData = async () => {
    const { rowIndex, colIndex } = findFirstContentByComponent(
      contentBlocks,
      Constants.ProductAssortmentComponentId,
    );

    const firstProductAssortmentContent =
      rowIndex > -1 && colIndex > -1 ? contentBlocks[rowIndex][colIndex] : null;

    const { labels, ...otherPageSettings } = pageSettings;
    let pageData = {
      pageId: page?.pageId,
      slug: page?.slug,
      keyword: keyword,
      title: title.trim(),
      content: updatedContentBlocks(contentBlocks),
      contentTemplateId: page
        ? page.contentTemplateId
        : template
        ? template.contentTemplateId
        : null,
      contentSettings: firstProductAssortmentContent?.settings.contentSettings,
      searchParameters:
        firstProductAssortmentContent?.settings?.searchParameters,
      query: firstProductAssortmentContent?.settings
        ? getSearchQuery(firstProductAssortmentContent.settings)
        : {}, //currentQuery,
      labels: (labels || []).map((v) => v.value),
      pageSettings: otherPageSettings,
      results: firstProductAssortmentContent?.products,
      qualityMetrics: firstProductAssortmentContent?.qualityMetrics,
      locations: locationPages,
    };

    if (presentationMode === PresentationMode.Location && location) {
      const locationPage = locationPages.find(
        (loc) => loc.locationId === location.id,
      );

      if (locationPage) {
        locationPage.content = {
          title: pageData.title,
          searchSettings: pageData.searchParameters,
          metaDescription: pageData.pageSettings?.metaDescription,
        };

        const updatedLocationPage = await Promise.all(
          pageData.content.map(async (contentRow) => {
            if (contentRow[0]) {
              if (
                contentRow[0].component.componentId !==
                Constants.ProductAssortmentComponentId
              ) {
                locationPage.content[contentRow[0].contentBlockId] = {
                  content: contentRow[0].content,
                };
              }
            }
            if (contentRow[1]) {
              if (
                contentRow[1].component.componentId !==
                Constants.ProductAssortmentComponentId
              ) {
                locationPage.content[contentRow[1].contentBlockId] = {
                  content: contentRow[1].content,
                };
              }
            }
          }),
        ).then(() => locationPage);

        const updatedLocations = locationPages.filter(
          (loc) => loc.locationId !== location.id,
        );
        updatedLocations.push(updatedLocationPage);

        pageData = JSON.parse(JSON.stringify(defaultPage));
        pageData.locations = updatedLocations;
      }
    }

    return pageData;
  };

  const doUpdatePage = async () => {
    const pageData = await getPageData();
    return await updatePage(pageData);
  };

  const savePage = async () => {
    const resValid = doValidationForPage();

    if (!resValid.success) {
      toast.error(resValid.message, { theme: 'colored' });
      return { success: false };
    }

    const res = await doUpdatePage();
    if (res.success) {
      toast.success('Page saved!', { theme: 'colored' });
      if (!!keyword && keyword !== '') {
        updateSuggestionStatus(keyword, SuggestionStatus.SAVED);
      }
      setPageChanged(false);
      setPreviewPage(null);
    } else {
      toast.error('Failed to save the page: ' + res.message, {
        theme: 'colored',
      });
    }
    return res;
  };

  const handleSave = useCallback(async () => {
    setIsWorking(true);

    const res = await savePage();
    if (res.success && onSave) {
      onSave(res.slug);
    }

    setIsWorking(false);
  }, [savePage]);

  const handlePageSettingsChange = useCallback((key, value) => {
    setPageSettings((oldPageSettings) => ({
      ...oldPageSettings,
      [key]: value,
    }));
  }, []);

  const handleAccept = async () => {
    setIsWorking(true);

    const resValid = doValidationForPage();

    if (!resValid.success) {
      toast.error(resValid.message, { theme: 'colored' });
      setIsWorking(false);
      return { success: false };
    }

    let res = null;

    if (workflow?.workflowType == WorkflowType.Idea)
      res = await saveIdeaWorkflowItem(WorkflowItemAction.APPROVE);
    else if (workflow?.workflowType == WorkflowType.Page)
      res = await savePageWorkflowItem(WorkflowItemAction.APPROVE);
    if (res.success) {
      setActiveComponent(null);
      toast.info('Moving to the next workflow content item', {
        theme: 'colored',
      });
      const query = router.query;
      if (query?.keyword) {
        delete query['keyword'];
        router.push({
          query: query,
        });
      } else if (query?.pageId) {
        delete query['pageId'];
        router.push({
          query: query,
        });
      } else {
        router.reload();
      }
    } else {
      toast.error(
        'Workflow content item could not be updated: ' + res.message,
        {
          theme: 'colored',
        },
      );
    }
    setIsWorking(false);
  };

  const handleReject = async () => {
    setIsWorking(true);

    let res = null;
    if (workflow?.workflowType == WorkflowType.Idea)
      res = await saveIdeaWorkflowItem(WorkflowItemAction.REJECT);
    else if (workflow?.workflowType == WorkflowType.Page)
      res = await savePageWorkflowItem(WorkflowItemAction.REJECT);
    if (res.success) {
      setActiveComponent(null);
      toast.info('Moving to the next workflow content item', {
        theme: 'colored',
      });
      const query = router.query;
      if (query?.keyword) {
        delete query['keyword'];
        router.push({
          query: query,
        });
      } else if (query?.pageId) {
        delete query['pageId'];
        router.push({
          query: query,
        });
      } else {
        router.reload();
      }
    } else {
      toast.error(
        'Workflow content item could not be updated: ' + res.message,
        {
          theme: 'colored',
        },
      );
    }
    setIsWorking(false);
  };

  const saveIdeaWorkflowItem = async (action) => {
    const pageData = await getPageData();
    return await saveIdeaWorkflow(workflow, keyword, pageData, action);
  };

  const savePageWorkflowItem = async (action) => {
    const pageData = await getPageData();
    return await savePageWorkflow(workflow, pageData, action);
  };

  const updateContentData = useCallback((contentBlockId, updateData) => {
    setContentBlocks((contentBlocks) => {
      const { rowIndex, colIndex } = findContent(contentBlocks, contentBlockId);
      const newContentBlocks = [...contentBlocks];
      if (rowIndex > -1 && colIndex > -1) {
        newContentBlocks[rowIndex][colIndex] = {
          ...newContentBlocks[rowIndex][colIndex],
          ...updateData,
        };
      }

      return newContentBlocks;
    });
  }, []);

  const removeContentBlock = useCallback((contentBlockId) => {
    setContentBlocks((contentBlocks) => {
      const { rowIndex, colIndex } = findContent(contentBlocks, contentBlockId);
      contentBlocks[rowIndex].splice(colIndex, 1);
      return contentBlocks.filter((cb) => cb.length > 0);
    });
  }, []);

  const onChangeLanguage = (lang) => {
    setPresentationMode(PresentationMode.Languages);
    setLanguage(lang);
  };

  useEffect(() => {
    const translateContent = async (lang) => {
      setIsWorking(true);
      const title = await handleTitleTranslation(lang);
      const metaDescription = await handleMetaDescTranslation(lang);

      if (title || metaDescription) {
        const data = pageSettings.translations?.[lang] || {};
        if (title) data.title = title;
        if (metaDescription) data.metaDescription = metaDescription;
        handlePageSettingsChange('translations', {
          ...pageSettings.translations,
          [lang]: data,
        });
      }

      setIsWorking(false);
    };

    translateContent(language);
  }, [language]);

  const handleTitleTranslation = async (language) => {
    if (!title || presentationMode !== PresentationMode.Languages) return;
    setLocation(null);

    if (language === 'en') {
      setVisibleTitle(title);
      return;
    }

    if (pageSettings.translations?.[language]?.title) {
      setVisibleTitle(pageSettings.translations[language].title);
      return;
    }

    const res = await getTranslatedContent(language, title);

    if (res.success) {
      setVisibleTitle(res.translation);
      return res.translation;
    } else {
      toast.error('Unable to translate at this time: ' + res.message, {
        theme: 'colored',
      });
    }
  };

  const handleMetaDescTranslation = async (lang) => {
    if (!pageSettings.metaDescription) return;
    if (lang == 'en') {
      setMetaDescription(pageSettings.metaDescription);
      return;
    }

    if (pageSettings.translations?.[lang]?.metaDescription) {
      setMetaDescription(pageSettings.translations?.[lang].metaDescription);
      return;
    }

    const res = await getTranslatedContent(lang, pageSettings.metaDescription);

    if (res.success) {
      setMetaDescription(res.translation);
      return res.translation;
    } else {
      toast.error('Unable to translate at this time: ' + res.message, {
        theme: 'colored',
      });
      return null;
    }
  };

  const getAllHtml = () => {
    let content = '<h2>' + title + '</h2>';
    for (let i = 0; i < contentBlocks.length; i++) {
      for (let j = 0; j < contentBlocks[i].length; j++) {
        if (contentBlocks[i][j]) {
          if (
            contentBlocks[i][j].header &&
            contentBlocks[i][j].header.trim().length > 0
          ) {
            content += '<h4>' + contentBlocks[i][j].header.trim() + '</h4>';
          }

          if (
            [
              Constants.GlossaryTermComponentId,
              Constants.FaqListComponentId,
            ].includes(contentBlocks[i][j].component.componentId)
          ) {
            content +=
              '<p><ol>' +
              contentBlocks[i][j].data
                .map(
                  (bullet) =>
                    '<li>' + bullet.trim().replace(/\n/g, '') + '</li>',
                )
                .join('') +
              '</ol></p><br/>';
          } else if (
            [
              Constants.ProductAssortmentComponentId,
              Constants.RelatedProductsListComponentId,
            ].includes(contentBlocks[i][j].component.componentId)
          ) {
            content +=
              '<p><ol>' +
              contentBlocks[i][j].data
                .map(
                  (product) =>
                    '<li>' + product.name.trim().replace(/\n/g, '') + '</li>',
                )
                .join('') +
              '</ol></p><br/>';
          } else if (contentBlocks[i][j].data) {
            if (Array.isArray(contentBlocks[i][j].data)) {
              content +=
                '<p><ol>' +
                contentBlocks[i][j].data
                  .map(
                    (item) => '<li>' + item.trim().replace(/\n/g, '') + '</li>',
                  )
                  .join('') +
                '</ol></p><br/>';
            } else {
              content +=
                '<p>' + contentBlocks[i][j].data.toString() + '</p><br/>';
            }
          } else if (
            contentBlocks[i][j].content &&
            contentBlocks[i][j].content.text?.trim() !== ''
          ) {
            content +=
              '<p>' + contentBlocks[i][j].content.html.trim() + '</p><br/>';
          }
        }
      }
    }
    return content;
  };

  const getAllText = () => {
    let content = title + '\n\n';
    for (let i = 0; i < contentBlocks.length; i++) {
      for (let j = 0; j < contentBlocks[i].length; j++) {
        if (contentBlocks[i][j]) {
          if (
            contentBlocks[i][j].header &&
            contentBlocks[i][j].header.trim().length > 0
          ) {
            content += '\n' + contentBlocks[i][j].header.trim() + '\n';
          }

          if (
            [
              Constants.GlossaryTermComponentId,
              Constants.FaqListComponentId,
            ].includes(contentBlocks[i][j].component.componentId)
          ) {
            content +=
              '\n' +
              contentBlocks[i][j].data
                .map((bullet) =>
                  extractContent(bullet.trim().replace(/\n/g, '')),
                )
                .join('\n') +
              '\n\n';
          } else if (
            [
              Constants.ProductAssortmentComponentId,
              Constants.RelatedProductsListComponentId,
            ].includes(contentBlocks[i][j].component.componentId)
          ) {
            content +=
              '\n' +
              contentBlocks[i][j].data
                .map((product) =>
                  extractContent(product.name.trim().replace(/\n/g, '')),
                )
                .join('\n') +
              '\n\n';
          } else if (contentBlocks[i][j].data) {
            if (Array.isArray(contentBlocks[i][j].data)) {
              content +=
                '\n' +
                contentBlocks[i][j].data
                  .map((item) => item.trim().replace(/\n/g, ''))
                  .join('\n') +
                '\n\n';
            } else {
              content +=
                '<p>' + contentBlocks[i][j].data.toString() + '</p><br/>';
            }
          } else if (
            contentBlocks[i][j].content &&
            contentBlocks[i][j].content.text?.trim() !== ''
          ) {
            content +=
              extractContent(contentBlocks[i][j].content.text.trim()) + '\n\n';
          }
        }
      }
    }
    return content;
  };

  const getPreface = useCallback(
    (contentBlockId) => {
      let preface = '';

      let found = false;
      for (let i = 0; i < contentBlocks.length && !found; i++) {
        for (let j = 0; j < contentBlocks[i].length; j++) {
          const cb = contentBlocks[i][j];
          if (cb.contentBlockId === contentBlockId) {
            found = true;
            break;
          }
          if (cb?.content?.text && cb?.content?.text?.trim() !== '') {
            preface += cb.header + '\n' + cb.content.text + '\n\n';
          }
        }
      }
      return preface;
    },
    [contentBlocks],
  );

  const getSectionContext = (header, sectionContext) => {
    if (sectionContext) {
      let context = `Section ${sectionContext.section} of ${sectionContext.sectionCount}: ${header}\nContent:`;
      if (sectionContext.previousHeader) {
        context = `Section ${sectionContext.section - 1} of ${
          sectionContext.sectionCount
        }: ${sectionContext.previousHeader}\nContent: ${
          sectionContext.previousContent
        }\n${context}`;
      }
      return context;
    } else {
      return `Section: ${header}\nContent:`;
    }
  };

  const fetchCompletion = useCallback(
    async ({
      contentBlockId,
      component,
      header,
      content,
      sectionContext,
      topic,
    }) => {
      if (
        component?.componentId === Constants.BlankComponentId ||
        ((component?.componentId === Constants.TopicParagraphComponentId ||
          component?.componentId === Constants.TopicKeyPointsComponentId ||
          component?.componentId === Constants.TopicHtmlComponentId) &&
          (!header || header.trim().length === 0))
      ) {
        return { composition: '[BLANK]' };
      }
      let preface = getPreface(contentBlockId);
      let context = getSectionContext(header, sectionContext);
      const settings = {
        topic: topic || title,
        componentId: component?.componentId,
        header: header ? header.trim() + '\n' : null,
        preface: preface,
        content: content,
        sectionContext: context,
      };
      const res = await getCompletion(settings);
      if (res.success) {
        return res;
      } else {
        toast.error('Unable to compose: ' + res.message, { theme: 'colored' });
        return null;
      }
    },
    [getPreface, title],
  );

  const doSearch = useCallback(async (settings) => {
    if (settings) {
      const q = getSearchQuery(settings);
      const loc = settings?.searchParameters?.searchLocation ?? location?.id;
      const res = await searchProducts(q, loc);
      const suggestedPath = getSuggestedPathFromResponse(res);
      if (res.success) {
        if (suggestedPath?.length > 0) {
          setSuggestedPath(suggestedPath);
        }
        if (res.products) {
          const contentRes = await getProductPageContent(
            res.products.map((product) => product.id),
          );
          if (contentRes.success) {
            res.products.forEach((product) => {
              if (contentRes.productContent[product.id]) {
                const content = contentRes.productContent[product.id];
                product.highlights =
                  content.highlights || product.highlights || [];
                product.suppressedReviewExcerpts =
                  content.suppressedReviewExcerpts ||
                  product.suppressedReviewExcerpts ||
                  [];
                if (
                  content['image|' + title.toLowerCase().replace(/"/g, '\\"')]
                ) {
                  product.image =
                    content[
                      'image|' + title.toLowerCase().replace(/"/g, '\\"')
                    ];
                }
              }
            });
          }
          return {
            products: res.products,
            qualityMetrics: res.qualityMetrics,
            resultKey: res.resultKey,
          };
        }
      } else {
        toast.error('Product searching failed', {
          theme: 'colored',
        });
        return { products: null, qualityMetrics: null, resultKey: null };
      }
    }
    return null;
  }, []);

  const authorContentBlock = useCallback(
    async (contentBlockId, header, query) => {
      if (!query && (!title || title.trim().length === 0)) {
        toast.error('You must enter a title before content can be authored', {
          theme: 'colored',
        });
        removeContentBlock(contentBlockId);
        return;
      }
      const { rowIndex, colIndex } = findContent(contentBlocks, contentBlockId);

      if (rowIndex > -1 && colIndex > -1) {
        const contentBlock = contentBlocks[rowIndex][colIndex];
        const component = contentBlock.component;
        const componentId = contentBlock.component.componentId;

        updateContentData(contentBlock.contentBlockId, {
          isComposing: true,
          lastUpdated: new Date(),
        });

        const newData = {};

        if (component.name === 'Product Assortment') {
          const parseRes = await parseQuery((query || title).toLowerCase());
          const q = {
            concepts: [],
            filters: [],
            keywords: '',
            excludedKeywords: '',
            pinnedSkus: [],
            excludedSkus: [],
            categories: [],
            categoryIds: [],
            excludedCategories: [],
            excludedCategoryIds: [],
            originalQuery: query || title,
            maxResults: orgSettings?.settings?.maxResults || 10,
            includedFilters: [],
            excludedFilters: [],
            collapseBrands: false,
            searchLocation: location?.id || null,
          };

          newData.settings = {
            ...contentBlock.settings,
            searchParameters: {
              ...(contentBlock.settings?.searchParameters || {}),
            },
            contentSettings: {
              ...(contentBlock.settings?.contentSettings || {}),
              ...defaultContentSettings.current,
            },
            searchType: contentBlock.settings?.searchType || '',
          };
          newData.settings.searchParameters = q;

          if (parseRes && parseRes.success) {
            q.originalQuery = parseRes.query.originalQuery;
            if (parseRes.query.concepts && parseRes.query.concepts.length > 0) {
              const concepts = [];
              parseRes.query.concepts.forEach((c) => {
                concepts.push({ value: c.conceptId, label: c.name });
                q.concepts.push(c);
              });
              newData.settings.searchParameters.concepts = concepts;
            }

            if (
              parseRes.query.includedFilters &&
              parseRes.query.includedFilters.length > 0
            ) {
              const attrs = [];
              parseRes.query.includedFilters.forEach((f) => {
                if (f.dataType === 'DOUBLE' || f.dataType === 'DATE') {
                  if (f.comparison === 'LESSTHANOREQUAL') {
                    attrs.push({
                      value: f.attributeName + ':|' + f.value,
                      label: f.attributeName + ':->' + f.value,
                    });
                    q.includedFilters.push(f.attributeName + ':|' + f.value);
                  } else if (f.comparison === 'GREATERTHANOREQUAL') {
                    attrs.push({
                      value: f.attributeName + ':' + f.value + '|',
                      label: f.attributeName + ':' + f.value + '->',
                    });
                    q.includedFilters.push(
                      f.attributeName + ':' + f.value + '|',
                    );
                  }
                } else {
                  attrs.push({
                    value: f.attributeName + ':' + f.value,
                    label: f.attributeName + ':' + f.value,
                  });
                  q.includedFilters.push(f.attributeName + ':' + f.value);
                }
              });
              newData.settings.searchParameters.includedFilters = attrs;
            }

            if (
              parseRes.query.excludedFilters &&
              parseRes.query.excludedFilters.length > 0
            ) {
              const attrs = [];
              parseRes.query.excludedFilters.forEach((f) => {
                if (f.dataType === 'DOUBLE' || f.dataType === 'DATE') {
                  if (f.comparison === 'LESSTHANOREQUAL') {
                    attrs.push({
                      value: f.attributeName + ':|' + f.value,
                      label: f.attributeName + ':->' + f.value,
                    });
                    q.excludedFilters.push(f.attributeName + ':|' + f.value);
                  } else if (f.comparison === 'GREATERTHANOREQUAL') {
                    attrs.push({
                      value: f.attributeName + ':' + f.value + '|',
                      label: f.attributeName + ':' + f.value + '->',
                    });
                    q.excludedFilters.push(
                      f.attributeName + ':' + f.value + '|',
                    );
                  }
                } else {
                  attrs.push({
                    value: f.attributeName + ':' + f.value,
                    label: f.attributeName + ':' + f.value,
                  });
                  q.excludedFilters.push(f.attributeName + ':' + f.value);
                }
              });
              newData.settings.searchParameters.excludedFilters = attrs;
            }

            if (parseRes.query.keywords && parseRes.query.keywords !== '') {
              newData.settings.searchParameters.keywords =
                parseRes.query.keywords;
            }
            q.keywords = parseRes.query.keywords;

            if (
              parseRes.query.excludedKeywords &&
              parseRes.query.excludedKeywords !== ''
            ) {
              newData.settings.searchParameters.excludedKeywords =
                parseRes.query.excludedKeywords;
            }
            q.excludedKeywords = parseRes.query.excludedKeywords || null;
          }
          const { products, qualityMetrics, resultKey } = await doSearch({
            searchType: '',
            searchParameters: q,
          });
          newData.data = products;
          newData.qualityMetrics = qualityMetrics;
          newData.resultKey = resultKey;
        } else if (
          component.settings?.componentType === 'search' ||
          component?.componentType === 'search'
        ) {
          const settings = {
            topic: query || title,
            componentId: componentId,
          };
          const searchRes = await semanticSearchProducts(settings);
          if (searchRes.success) {
            newData.data = searchRes.products;
            newData.header = searchRes.header;
          } else {
            removeContentBlock(contentBlockId);
            return;
          }
        } else {
          const completion = await fetchCompletion({
            contentBlockId,
            component,
            header,
            topic: query,
          });
          if (completion) {
            newData.content = {
              text: completion.composition,
              html: completion.composition,
            };
            newData.data = completion.data;
            if (header) {
              newData.header = header;
            } else {
              newData.header = component.settings?.header;
            }
          } else {
            removeContentBlock(contentBlockId);
            return;
          }
        }

        updateContentData(contentBlock.contentBlockId, {
          ...newData,
          isComposing: false,
        });
      }
    },
    [title, contentBlocks, orgSettings],
  );

  const authorBlurb = async (id, name) => {
    let blurb = '';
    const settings = {
      topic: title,
      header: name,
      componentId: 'Product Blurb',
    };
    const res = await getCompletion(settings);
    if (res.success) {
      blurb = res.data[0].trim();
      await setProductPageContent(
        id,
        'blurb|' + title.toLowerCase().replace(/"/g, '\\"'),
        blurb,
      );
    } else {
      toast.error('Unable to compose blurb: ' + res.message, {
        theme: 'colored',
      });
    }
    return blurb;
  };

  const authorParagraph = async (id, name, description) => {
    if (!description || description.trim() === '') {
      return '[Cannot author without product description]';
    }
    let paragraph = '';
    const settings = {
      topic: title,
      header: name + ': ' + description,
      componentId: 'Product Paragraph',
    };
    const res = await getCompletion(settings);
    if (res.success) {
      paragraph = res.composition.trim();
      await setProductPageContent(
        id,
        'paragraph|' + title.toLowerCase().replace(/"/g, '\\"'),
        paragraph,
      );
    } else {
      toast.error('Unable to compose paragraph: ' + res.message, {
        theme: 'colored',
      });
    }
    return paragraph;
  };

  const autoComposeBlurbs = async () => {
    for (let i = 0; i < activeContent.data.length; i++) {
      const blurbKey = 'blurb|' + title.toLowerCase().replace(/"/g, '\\"');
      if (!activeContent.data[i].pageContent[blurbKey]) {
        updateContentData(activeContent.contentBlockId, {
          authoringIndex: 'b' + i,
        });
        activeContent.data[i].pageContent[blurbKey] = await authorBlurb(
          activeContent.data[i].id,
          activeContent.data[i].name,
        );
        updateContentData(activeContent.contentBlockId, {
          data: activeContent.data,
        });
      }
    }
    updateContentData(activeContent.contentBlockId, {
      authoringIndex: null,
    });
  };

  const autoComposeParagraphs = async () => {
    for (let i = 0; i < activeContent.data.length; i++) {
      const paragraphKey =
        'paragraph|' + title.toLowerCase().replace(/"/g, '\\"');
      if (!activeContent.data[i].pageContent[paragraphKey]) {
        updateContentData(activeContent.contentBlockId, {
          authoringIndex: 'p' + i,
        });
        activeContent.data[i].pageContent[paragraphKey] = await authorParagraph(
          activeContent.data[i].id,
          activeContent.data[i].name,
          activeContent.data[i].description,
        );
        updateContentData(activeContent.contentBlockId, {
          data: activeContent.data,
        });
      }
    }
    updateContentData(activeContent.contentBlockId, {
      authoringIndex: null,
    });
  };

  const handleContentSettingsChange = async (settings) => {
    const oldSettings = activeContent.settings;
    updateContentData(activeContent.contentBlockId, {
      settings: settings,
    });
    if (
      settings.searchType !== oldSettings.searchType ||
      !isEqual(settings.searchParameters, oldSettings.searchParameters)
    ) {
      updateContentData(activeContent.contentBlockId, {
        isComposing: true,
      });
      const { products, qualityMetrics, resultKey } = await doSearch(settings);
      const oldProducts = products.filter((p) =>
        activeContent.data.find((d) => p.id === d.id),
      );

      const existProducts = oldProducts.map((o) => {
        o.pageContent =
          activeContent.data.find((d) => o.id === d.id)?.pageContent || {};
        return o;
      });

      const newProducts = products.filter(
        (p) => !oldProducts.find((o) => o.id === p.id),
      );

      if (settings.contentSettings.includeBlurbs) {
        await getProductsBlurbs(newProducts);
      }
      if (settings.contentSettings.includeParagraphs) {
        await getProductParagraphs(newProducts);
      }

      activeContent.data = [...existProducts, ...newProducts];
      activeContent.qualityMetrics = qualityMetrics;
      activeContent.resultKey = resultKey;
      updateContentData(activeContent.contentBlockId, {
        isComposing: false,
        data: activeContent.data,
        qualityMetrics: activeContent.qualityMetrics,
        resultKey: activeContent.resultKey,
      });
    }
    if (!isEqual(settings.contentSettings, oldSettings.contentSettings)) {
      if (settings.contentSettings.includeBlurbs) {
        await autoComposeBlurbs();
      }
      if (settings.contentSettings.includeParagraphs) {
        await autoComposeParagraphs();
      }
    }
  };

  const getProductsBlurbs = useCallback(async (products) => {
    const blurbKey = 'blurb|' + title.toLowerCase().replace(/"/g, '\\"');

    for (const product of products) {
      product.pageContent[blurbKey] = await authorBlurb(
        product.id,
        product.name,
      );
    }
  }, []);

  const getProductParagraphs = useCallback(async (products) => {
    const paragraphKey =
      'paragraph|' + title.toLowerCase().replace(/"/g, '\\"');
    for (const product of products) {
      product.pageContent[paragraphKey] = await authorParagraph(
        product.id,
        product.name,
        product.description,
      );
    }
  }, []);

  const insertComponent = useCallback(
    (destination, componentId) => {
      // Add blocks
      const component = componentsResult.components.find(
        (comp) => comp.componentId === componentId,
      );

      if (!component) return;

      const newComponent = {
        contentBlockId: uuidv4(),
        component: component,
        content: null,
        settings: component.settings,
      };

      if (destination === 'DROPPABLE_TOP') {
        // add to top
        setContentBlocks((contentBlocks) => {
          contentBlocks.splice(0, 0, [newComponent]);
          return contentBlocks;
        });
      } else if (destination.startsWith('DROPPABLE_LEFT')) {
        // add to right

        const rowIndex = +destination.substr(15);
        setContentBlocks((contentBlocks) => {
          contentBlocks[rowIndex] = [...contentBlocks[rowIndex], newComponent];
          return contentBlocks;
        });
      } else if (destination.startsWith('DROPPABLE_BOTTOM')) {
        // add to bottom
        const rowIndex = +destination.substr(17);
        setContentBlocks((contentBlocks) => {
          contentBlocks.splice(rowIndex + 1, 0, [newComponent]);
          return contentBlocks;
        });
      } else {
        return;
      }

      // To avoid side effect
      authorContentBlock(newComponent.contentBlockId);
    },
    [authorContentBlock, componentsResult],
  );

  const onDragEnd = useCallback(
    (e) => {
      if (!e.destination || !componentsResult || !componentsResult.success) {
        return;
      }

      // Add blocks
      if (e.source.droppableId === 'COMPONENTS') {
        const component = componentsResult.components.find(
          (comp) => comp.componentId === e.draggableId,
        );
        const newComponent = {
          contentBlockId: uuidv4(),
          component: component,
          content: null,
          settings: component.settings,
        };

        if (e.destination.droppableId === 'DROPPABLE_TOP') {
          // add to top
          setContentBlocks((contentBlocks) => {
            contentBlocks.splice(0, 0, [newComponent]);
            return contentBlocks;
          });
        } else if (e.destination.droppableId.startsWith('DROPPABLE_LEFT')) {
          // add to right

          const rowIndex = +e.destination.droppableId.substr(15);
          setContentBlocks((contentBlocks) => {
            contentBlocks[rowIndex] = [
              ...contentBlocks[rowIndex],
              newComponent,
            ];
            return contentBlocks;
          });
        } else if (e.destination.droppableId.startsWith('DROPPABLE_BOTTOM')) {
          // add to bottom
          const rowIndex = +e.destination.droppableId.substr(17);
          setContentBlocks((contentBlocks) => {
            contentBlocks.splice(rowIndex + 1, 0, [newComponent]);
            return contentBlocks;
          });
        } else {
          return;
        }

        // To avoid side effect
        authorContentBlock(newComponent.contentBlockId);
      } else if (e.source.droppableId === 'CONTENT_BLOCK') {
        // move content block
        if (e.destination.droppableId === 'DROPPABLE_TOP') {
          // Add to top
          setContentBlocks((contentBlocks) => {
            const { rowIndex, colIndex } = findContent(
              contentBlocks,
              e.draggableId,
            );

            if (rowIndex > -1 && colIndex > -1) {
              const component = contentBlocks[rowIndex][colIndex];
              contentBlocks[rowIndex].splice(colIndex, 1);
              return [[component], ...contentBlocks].filter(
                (cb) => cb.length > 0,
              );
            } else {
              return contentBlocks;
            }
          });
        } else if (e.destination.droppableId.startsWith('DROPPABLE_LEFT')) {
          // Add to right
          const row = +e.destination.droppableId.substr(15);
          setContentBlocks((contentBlocks) => {
            const { rowIndex, colIndex } = findContent(
              contentBlocks,
              e.draggableId,
            );

            if (rowIndex > -1 && colIndex > -1) {
              const component = contentBlocks[rowIndex][colIndex];
              contentBlocks[rowIndex].splice(colIndex, 1);
              return contentBlocks
                .map((cb, index) => {
                  return index === row ? [...cb, component] : cb;
                })
                .filter((cb) => cb.length > 0);
            } else {
              return contentBlocks;
            }
          });
        } else if (e.destination.droppableId.startsWith('DROPPABLE_BOTTOM')) {
          // Add to bottom
          const row = +e.destination.droppableId.substr(17);
          setContentBlocks((contentBlocks) => {
            const { rowIndex, colIndex } = findContent(
              contentBlocks,
              e.draggableId,
            );

            if (rowIndex > -1 && colIndex > -1) {
              const component = contentBlocks[rowIndex][colIndex];
              contentBlocks[rowIndex].splice(colIndex, 1);
              contentBlocks.splice(row + 1, 0, [component]);
              return contentBlocks.filter((cb) => cb.length > 0);
            } else {
              return contentBlocks;
            }
          });
        }
      }
    },
    [authorContentBlock, componentsResult],
  );

  const handleSearch = async (query = null) => {
    if (!query && (!title || title.trim().length === 0)) {
      toast.error('You must enter a page title', { theme: 'colored' });
      return { success: false };
    }
    if (template) {
      const contentTemplate = adjustContentTemplate(template.content);
      const newContentBlock = contentTemplate.map((contentTemplateRow) => {
        return contentTemplateRow.map(({ component }) => {
          const comp =
            componentsResult?.components?.find(
              (c) => c.componentId === component.componentId,
            ) || component;
          return {
            contentBlockId: uuidv4(),
            component: comp,
            content: null,
            settings: comp.settings || {},
          };
        });
      });

      setContentBlocks((contentBlocks) => {
        contentBlocks.splice(0, contentBlocks.length);
        contentBlocks.push(...newContentBlock);
        return contentBlocks;
      });

      setTimeout(() => {
        newContentBlock.forEach((contentBlockRow) => {
          contentBlockRow.forEach((contentBlock) => {
            authorContentBlock(contentBlock.contentBlockId, null, query);
          });
        });
      });
    }
    setIsComposed(true);
  };

  const handleCompose = useCallback(
    async ({ contentBlockId, component, header, content, context, topic }) => {
      return await fetchCompletion({
        contentBlockId,
        component,
        header,
        content,
        context,
        topic,
      });
    },
    [fetchCompletion],
  );

  const handleSettingsChange = useCallback(async (contentBlockId, settings) => {
    const newData = {};

    //refresh search results
    if (
      settings.searchType === 'query' &&
      settings.searchQuery &&
      settings.searchQuery.trim().length > 0
    ) {
      const searchSettings = {
        topic: settings.searchQuery,
        componentId: Constants.RelatedProductsListComponentId,
      };
      const searchRes = await semanticSearchProducts(searchSettings);
      if (searchRes.success) {
        newData.data = searchRes.products;
        newData.header = searchRes.header;
      }
    } else if (settings.searchType === 'assortment' && settings.assortment) {
      //get page results by assortment ID
      const slug = settings.assortment.value;
      const pageRes = await getPageDirect(slug);
      if (pageRes && pageRes.success && pageRes.page) {
        newData.data = pageRes.page.results.slice(0, 5);
      }
    }

    newData.settings = settings;
    updateContentData(contentBlockId, newData);
  }, []);

  const addContentBlockToNextRow = (contentBlockId, newContentBlock) => {
    // add to bottom
    setContentBlocks((contentBlocks) => {
      const { rowIndex } = findContent(contentBlocks, contentBlockId);
      contentBlocks.splice(rowIndex + 1, 0, [newContentBlock]);
      return contentBlocks;
    });
  };

  // Life Cycles
  useEffect(() => {
    if (!title || title == visibleTitle) return;
    setVisibleTitle(title);
  }, [title]);

  useEffect(() => {
    if (!visibleTitle || visibleTitle == title) return;
    if (presentationMode === PresentationMode.Languages) {
      if (language === 'en') {
        setTitle(visibleTitle);
      } else {
        handlePageSettingsChange('translations', {
          ...pageSettings.translations,
          [language]: {
            ...pageSettings.translations?.[language],
            title: visibleTitle,
          },
        });
      }
    } else {
      setTitle(visibleTitle);
    }
  }, [visibleTitle]);

  useEffect(() => {
    if (activeComponent === null) {
      const firstProductAssortmentComponent = findFirstContentByComponent(
        contentBlocks,
        Constants.ProductAssortmentComponentId,
      );
      const firstRelatedProductListComponent = findFirstContentByComponent(
        contentBlocks,
        Constants.RelatedProductsListComponentId,
      );
      if (
        firstProductAssortmentComponent.rowIndex > -1 &&
        firstProductAssortmentComponent.colIndex > -1
      ) {
        const { rowIndex, colIndex } = firstProductAssortmentComponent;
        setActiveComponent(contentBlocks[rowIndex][colIndex].contentBlockId);
      } else if (
        firstRelatedProductListComponent.rowIndex > -1 &&
        firstRelatedProductListComponent.colIndex > -1
      ) {
        const { rowIndex, colIndex } = firstRelatedProductListComponent;
        setActiveComponent(contentBlocks[rowIndex][colIndex].contentBlockId);
      }
    }
  }, [contentBlocks]);

  useEffect(() => {
    if (page?.content) {
      setContentBlocks(page.content ? adjustContentBlocks(page) : []);
    }
    setIsComposed(true);
  }, []);

  useEffect(() => {
    if (orgSettingsStatus === 'success' && orgSettings?.settings) {
      setLocationPageTitle(orgSettings.settings?.locationPageTitle);
      if (!page) {
        defaultContentSettings.current = {
          includeReviewExcerpts: orgSettings.settings.includeReviewExcerpts,
          includePros: orgSettings.settings.includePros,
          includeCons: orgSettings.settings.includeCons,
          includeBlurbs: orgSettings.settings.includeBlurbs,
          includeParagraphs: orgSettings.settings.includeParagraphs,
        };
      }
    }
  }, [orgSettingsStatus, orgSettings]);

  const removeTitleTrans = () => {
    let translations = pageSettings.translations || {};

    if (isEmpty(translations) || !langsData) return;

    langsData.languages?.forEach((item) => {
      translations[item] = omit(translations[item], 'title');
    });

    handlePageSettingsChange('translations', translations);
  };

  const handleCopy = async () => {
    const item = new clipboard.ClipboardItem({
      'text/html': new Blob([getAllHtml()], { type: 'text/html' }),
      'text/plain': new Blob([getAllText()], { type: 'text/plain' }),
    });
    await clipboard.write([item]);
    toast.success('Page copied to clipboard!', { theme: 'colored' });
  };

  const handleExportDocx = async () => {
    const preHtml =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const postHtml = '</body></html>';
    const html = preHtml + getAllHtml() + postHtml;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword',
    });

    // Specify link url
    const url =
      'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);

    // Specify file name
    const filename = `${title}.doc`;

    // Create download link element
    const downloadLink = document.createElement('a');

    document.body.appendChild(downloadLink);

    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      // Create a link to the file
      downloadLink.href = url;

      // Setting the file name
      downloadLink.download = filename;

      //triggering the function
      downloadLink.click();
    }

    document.body.removeChild(downloadLink);
  };

  const getContentByLocation = (content, location, title) => {
    if (!content)
      return {
        content: null,
      };
    const html = content.html
      ? content.html
          .replaceAll('{{city}}', location.city)
          .replaceAll('{{state}}', location.state)
          .replaceAll('{{title}}', title)
      : null;
    const text = content.text
      ? content.text
          .replaceAll('{{city}}', location.city)
          .replaceAll('{{state}}', location.state)
          .replaceAll('{{title}}', title)
      : null;

    return {
      content: { html, text },
    };
  };

  const onSavePageLocations = async (seletedLcoations) => {
    const defaultPageData = await getDefaultPageData();

    const selectedPageLocations = await Promise.all(
      seletedLcoations.map(async (loc) => {
        let data;
        data = locationPages.find(
          (locationPage) => locationPage.locationId === loc.id,
        );

        if (!data) data = await getLocationPageData(loc, defaultPageData);
        return data;
      }),
    );

    setLocationPages(selectedPageLocations);
  };

  const onClickLocation = async (location) => {
    if (!location) return;
    let selectedLocationPageData = locationPages.find(
      (locationPage) => locationPage.locationId === location.id,
    );

    const defaultPageData = await getDefaultPageData();

    if (!selectedLocationPageData) {
      selectedLocationPageData = await getLocationPageData(
        location,
        defaultPageData,
      );
      setLocationPages([...locationPages, selectedLocationPageData]);
    }
  };

  const getDefaultPageData = async () => {
    let pageData;

    if (defaultPage) pageData = defaultPage;
    else {
      pageData = await getPageData();
      setDefaultPage(JSON.parse(JSON.stringify(pageData)));
    }

    return pageData;
  };

  const getLocationPageData = async (loc, defaultPageData) => {
    const locationPageData = {
      locationId: loc.id,
      content: {},
    };

    locationPageData.content.title = locationPageTitle
      ? locationPageTitle
          .replaceAll('{{city}}', loc.city)
          .replaceAll('{{state}}', loc.state)
          .replaceAll('{{title}}', defaultPageData.title)
      : title;
    locationPageData.content.metaDescription = defaultPageData.pageSettings
      ?.metaDescription
      ? defaultPageData.pageSettings.metaDescription
          .replaceAll('{{city}}', loc.city)
          .replaceAll('{{state}}', loc.state)
      : '';
    locationPageData.content.searchSettings =
      activeContent.component.componentId ===
      Constants.ProductAssortmentComponentId
        ? defaultPageData.searchParameters
        : activeContent.component.componentId ===
          Constants.RelatedProductsListComponentId
        ? defaultPageData.pageSettings
        : null;

    return await Promise.all(
      contentBlocks.map(async (contentRow) => {
        if (contentRow[0]) {
          if (
            contentRow[0].component.componentId !==
            Constants.ProductAssortmentComponentId
          ) {
            locationPageData.content[contentRow[0].contentBlockId] =
              getContentByLocation(
                getDefaultContent(
                  defaultPageData,
                  contentRow[0].contentBlockId,
                ),
                loc,
                defaultPageData.title,
              );
          }
        }
        if (contentRow[1]) {
          if (
            contentRow[1].component.componentId !==
            Constants.ProductAssortmentComponentId
          ) {
            locationPageData.content[contentRow[1].contentBlockId] =
              getContentByLocation(
                getDefaultContent(
                  defaultPageData,
                  contentRow[1].contentBlockId,
                ),
                loc,
                defaultPageData.title,
              );
          }
        }
      }),
    ).then(() => locationPageData);
  };

  const getDefaultContent = (pageData, contentBlockId) => {
    const { rowIndex, colIndex } = findContent(
      pageData.content,
      contentBlockId,
    );

    return pageData.content[rowIndex][colIndex].content;
  };

  const handlePreview = async () => {
    if (page?.slug) {
      setPreview(!preview);
      setIsWorking(true);
      if (!previewPage) {
        const data = await getPagePreview(page?.slug);
        if (data) {
          setPreviewPage(data);
        }
      }
      setIsWorking(false);
    }
  };
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Header
        onSave={handleSave}
        onAccept={handleAccept}
        onReject={handleReject}
        onPreview={handlePreview}
      />
      <br />
      <Row noGutters>
        <Col
          lg="8"
          className={classNames('pr-lg-2', { 'mb-3': false })}
          id="content"
        >
          <PageContent
            title={visibleTitle}
            setTitle={setVisibleTitle}
            language={language}
            onChangeLanguage={onChangeLanguage}
            locationPages={locationPages}
            onSavePageLocations={onSavePageLocations}
            onClickLocation={onClickLocation}
            onSearch={handleSearch}
            onCopy={handleCopy}
            onExportDocx={handleExportDocx}
            showComposeButton={!!template}
            isComposed={isComposed}
            removeTitleTrans={removeTitleTrans}
            contentTemplateId={
              page
                ? page.contentTemplateId
                : template
                ? template.contentTemplateId
                : null
            }
          />
          {isComponentsReady && isComposed && (
            <Content
              page={page}
              title={title}
              pageLang={language}
              contentBlocks={contentBlocks}
              componentsResult={componentsResult}
              onCompose={handleCompose}
              onUpdateContentData={updateContentData}
              onSettingsChange={handleSettingsChange}
              onRemove={removeContentBlock}
              doSearch={doSearch}
              doUpdatePage={doUpdatePage}
              fetchCompletion={fetchCompletion}
              addContentBlockToNextRow={addContentBlockToNextRow}
              activeComponent={activeComponent}
              setActiveComponent={setActiveComponent}
              insertComponent={insertComponent}
            />
          )}
        </Col>
        <Col lg="4" className={classNames('pl-lg-2', { 'mb-3': false })}>
          <div ref={settingPannel} style={{ position: 'sticky', top: 150 }}>
            <div
              style={{ maxHeight: `${settingPannelHeight}`, overflowY: 'auto' }}
            >
              {activeContent && (
                <>
                  <CollapsibleCard
                    title="Component Settings"
                    renderer={() =>
                      activeContent.component.componentId ===
                      Constants.ProductAssortmentComponentId ? (
                        <ProductAssortmentSettings
                          settings={activeContent.settings}
                          onChangeParameters={handleContentSettingsChange}
                        />
                      ) : activeContent.component.componentId ===
                        Constants.RelatedProductsListComponentId ? (
                        <RelatedProductListSettings
                          contentBlock={activeContent}
                          title={title}
                          onSettingsChange={handleSettingsChange}
                        />
                      ) : null
                    }
                  />
                  <br />
                </>
              )}
              {isComponentsReady && isComposed && (
                <>
                  <CollapsibleCard
                    title="Content Blocks"
                    defaultCollapsed={!!defaultActiveComponent}
                    renderer={() => (
                      <ComponentList components={componentsResult.components} />
                    )}
                  />
                  <br />
                </>
              )}
              <CollapsibleCard
                title="Page Settings"
                defaultCollapsed={!!defaultActiveComponent}
                renderer={() => (
                  <PageSettings
                    page={page}
                    title={title}
                    pageLang={language}
                    metaDescription={metaDescription}
                    setMetaDescription={setMetaDescription}
                    pageSettings={pageSettings}
                    setPageSettings={handlePageSettingsChange}
                    handleMetaDescTranslation={handleMetaDescTranslation}
                    suggestedPath={suggestedPath}
                  />
                )}
              />
              <br />
              {title && (
                <CollapsibleCard
                  title="Related Pages"
                  defaultCollapsed={!!defaultActiveComponent}
                  renderer={() => (
                    <>
                      <RelatedPages
                        page={page}
                        title={title}
                        pageSettings={pageSettings}
                        setPageSettings={handlePageSettingsChange}
                      />
                    </>
                  )}
                />
              )}
            </div>
          </div>
        </Col>
      </Row>
      <Modal
        isOpen={preview}
        centered={true}
        size="xl"
        toggle={() => setPreview(!preview)}
      >
        <ModalHeader toggle={() => setPreview(!preview)}>Preview</ModalHeader>
        <ModalBody>
          {previewPage?.success && previewPage?.data && (
            <div style={{ height: '80vh' }}>
              <iframe
                title={page.title}
                width="100%"
                height="100%"
                srcdoc={previewPage.data}
                frameborder="0"
              ></iframe>
            </div>
          )}
          {!previewPage?.success && previewPage?.message && (
            <div style={{ height: '160px' }}>
              <Alert color="danger">{previewPage?.message}</Alert>
            </div>
          )}
          {isWorking && <Loader />}
        </ModalBody>
      </Modal>
    </DragDropContext>
  );
};

function adjustContentTemplate(contentTemplate) {
  return contentTemplate.map((contentBlockRow) => {
    return Array.isArray(contentBlockRow) ? contentBlockRow : [contentBlockRow];
  });
}

function adjustContentBlocks(page) {
  let isFirstProductAssortment = true;

  return page.content.map((contentBlockRow) => {
    if (Array.isArray(contentBlockRow)) {
      //if component settings are missing, get them from the page
      contentBlockRow.forEach((contentBlock) => {
        if (
          contentBlock.component.componentId ===
            Constants.ProductAssortmentComponentId &&
          isFirstProductAssortment
        ) {
          isFirstProductAssortment = false;
          if (!contentBlock.settings) {
            contentBlock.settings = {
              searchParameters: page.searchParameters,
              contentSettings: page.contentSettings,
            };
          }
        }
      });
      return contentBlockRow;
    }

    const newContentBlockRow = {
      ...contentBlockRow,
      settings: {},
    };

    if (
      contentBlockRow.component.componentId ===
        Constants.ProductAssortmentComponentId &&
      isFirstProductAssortment
    ) {
      isFirstProductAssortment = false;
      return [
        {
          ...newContentBlockRow,
          settings: {
            ...newContentBlockRow.settings,
            searchParameters: page.searchParameters,
            contentSettings: page.contentSettings,
          },
        },
      ];
    }
    return [contentBlockRow];
  });
}

function findContent(contentBlocks, id) {
  let rowIndex = null,
    colIndex = null;

  rowIndex = contentBlocks.findIndex((contentBlock) => {
    colIndex = contentBlock.findIndex((cb) => cb.contentBlockId === id);
    return colIndex > -1;
  });
  return { rowIndex, colIndex };
}

function findFirstContentByComponent(contentBlocks, componentId) {
  let rowIndex = null,
    colIndex = null;

  rowIndex = contentBlocks.findIndex((contentBlock) => {
    colIndex = contentBlock.findIndex(
      (cb) => cb.component.componentId === componentId,
    );
    return colIndex > -1;
  });
  return { rowIndex, colIndex };
}

function getSearchQuery(settings) {
  return {
    ...(settings.searchParameters || {}),
    searchType: settings?.searchType || '',
    concepts:
      settings?.searchType === 'review' || settings?.searchType === 'semantic'
        ? []
        : (settings?.searchParameters?.concepts || []).map((c) => ({
            name: c.label,
            conceptId: c.value,
          })),
    keywords:
      settings?.searchType === 'semantic'
        ? ''
        : settings?.searchParameters?.keywords,
    includedFilters: (settings?.searchParameters?.includedFilters || []).map(
      ({ value }) => value,
    ),
    excludedFilters: (settings?.searchParameters?.excludedFilters || []).map(
      ({ value }) => value,
    ),
    pinnedSkus: (settings?.searchParameters?.pinnedSkus || []).map(
      ({ value }) => value,
    ),
    excludedSkus: (settings?.searchParameters?.excludedSkus || []).map(
      ({ value }) => value,
    ),
    categoryIds: (settings?.searchParameters?.categories || []).map(
      ({ value }) => value,
    ),
    excludedCategoryIds: (
      settings?.searchParameters?.excludedCategories || []
    ).map(({ value }) => value),
  };
}

function getSuggestedPathFromResponse(res) {
  if (!res.success || !res?.searchMetadata?.suggestedPath) return null;
  return res.searchMetadata.suggestedPath.trim();
}

export default EditPage;
