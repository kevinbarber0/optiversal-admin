import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Product from '@components/e-commerce/product/Product';
import { isIterableArray } from '@helpers/utils';
import {
  getCompletion,
  setProductPageContent,
  useFindPagesByResultKey,
} from '@util/api';
import { toast } from 'react-toastify';
import { isEqual } from 'lodash';
import { Spinner, UncontrolledAlert } from 'reactstrap';

const ProductList = ({
  page,
  title,
  content,
  doSearch,
  doUpdatePage,
  onUpdateContentData,
}) => {
  // const { location, locationPages, presentationMode } = useEditPageContext();
  const {
    status,
    isLoading: finding,
    data: findResults,
  } = useFindPagesByResultKey(
    page?.pageId,
    content?.resultKey,
    !!(!content.isComposing && content?.resultKey),
  );

  const authorBlurb = useCallback(
    async (id, name) => {
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
        // if (page) {
        //   doUpdatePage();
        // }
      } else {
        toast.error('Unable to compose blurb: ' + res.message);
      }
      return blurb;
    },
    [page, title, doUpdatePage],
  );

  const authorParagraph = useCallback(
    async (id, name, description) => {
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
        // if (page) {
        //   doUpdatePage();
        // }
      } else {
        toast.error('Unable to compose paragraph: ' + res.message);
      }
      return paragraph;
    },
    [page, title, doUpdatePage],
  );

  const handleRewriteBlurb = useCallback(
    async (index) => {
      const blurbKey = 'blurb|' + title.toLowerCase().replace(/"/g, '\\"');
      content.data[index].pageContent[blurbKey] = null;

      onUpdateContentData(content.contentBlockId, {
        data: content.data,
        authoringIndex: 'b' + index,
      });

      content.data[index].pageContent[blurbKey] = await authorBlurb(
        content.data[index].id,
        content.data[index].name,
      );

      onUpdateContentData(content.contentBlockId, {
        data: content.data,
        authoringIndex: null,
      });
    },
    [content, onUpdateContentData, authorBlurb],
  );

  const handleUpdateBlurb = useCallback(
    async (index, newBlurb) => {
      const blurbKey = 'blurb|' + title.toLowerCase().replace(/"/g, '\\"');
      content.data[index].pageContent[blurbKey] = newBlurb;
      await setProductPageContent(content.data[index].id, blurbKey, newBlurb);
      // if (page) {
      //   doUpdatePage();
      // }

      onUpdateContentData(content.contentBlockId, {
        data: content.data,
      });
    },
    [page, doUpdatePage, content, onUpdateContentData],
  );

  const handleRewriteParagraph = useCallback(
    async (index) => {
      const paragraphKey =
        'paragraph|' + title.toLowerCase().replace(/"/g, '\\"');
      content.data[index].pageContent[paragraphKey] = null;

      onUpdateContentData(content.contentBlockId, {
        data: content.data,
        authoringIndex: 'p' + index,
      });
      content.data[index].pageContent[paragraphKey] = await authorParagraph(
        content.data[index].id,
        content.data[index].name,
        content.data[index].description,
      );

      onUpdateContentData(content.contentBlockId, {
        data: content.data,
        authoringIndex: null,
      });
    },
    [content, authorParagraph, onUpdateContentData],
  );

  const handleChangeImage = useCallback(
    async (id, index, imageUrl) => {
      await setProductPageContent(
        id,
        'image|' + title.toLowerCase().replace(/"/g, '\\"'),
        imageUrl,
      );
      // if (page) {
      //   doUpdatePage();
      // }
      content.data[index].image = imageUrl;

      onUpdateContentData(content.contentBlockId, {
        data: content.data,
      });
    },
    [page, doUpdatePage, content],
  );

  const handleSuppressExcerpt = useCallback(
    async (productIndex, excerptIndex) => {
      content.data[productIndex].suppressedReviewExcerpts = [
        ...(content.data[productIndex].suppressedReviewExcerpts || []),
        content.data[productIndex].highlights[excerptIndex],
      ];
      content.data[productIndex].highlights.splice(excerptIndex, 1);
      await Promise.all([
        setProductPageContent(
          content.data[productIndex].id,
          'highlights',
          content.data[productIndex].highlights,
        ),
        setProductPageContent(
          content.data[productIndex].id,
          'suppressedReviewExcerpts',
          content.data[productIndex].suppressedReviewExcerpts,
        ),
      ]);
      // if (page) {
      //   doUpdatePage();
      // }

      onUpdateContentData(content.contentBlockId, {
        data: content.data,
      });
    },
    [page, doUpdatePage, content, onUpdateContentData],
  );

  const handleUpdateExcerpt = useCallback(
    async (productIndex, excerptIndex, newExcerpt) => {
      content.data[productIndex].highlights[excerptIndex] = newExcerpt;
      await setProductPageContent(
        content.data[productIndex].id,
        'highlights',
        content.data[productIndex].highlights,
      );
      // if (page) {
      //   doUpdatePage();
      // }
      onUpdateContentData(content.contentBlockId, {
        data: content.data,
      });
    },
    [page, doUpdatePage, content],
  );

  const autoComposeBlurbs = async () => {
    for (let i = 0; i < content.data.length; i++) {
      if (!content.data[i].blurb) {
        onUpdateContentData(content.contentBlockId, {
          authoringIndex: 'b' + i,
        });
        content.data[i].blurb = await authorBlurb(
          content.data[i].id,
          content.data[i].name,
        );
        onUpdateContentData(content.contentBlockId, {
          data: content.data,
        });
      }
    }
    onUpdateContentData(content.contentBlockId, {
      authoringIndex: null,
    });
  };

  const autoComposeParagraphs = async () => {
    for (let i = 0; i < content.data.length; i++) {
      if (!content.data[i].paragraph) {
        onUpdateContentData(content.contentBlockId, {
          authoringIndex: 'p' + i,
        });
        content.data[i].paragraph = await authorParagraph(
          content.data[i].id,
          content.data[i].name,
          content.data[i].description,
        );
        onUpdateContentData(content.contentBlockId, {
          data: content.data,
        });
      }
    }
    onUpdateContentData(content.contentBlockId, {
      authoringIndex: null,
    });
  };

  const handleSettingsChange = useCallback(
    async (settings) => {
      const oldSettings = content.settings;
      onUpdateContentData(content.contentBlockId, {
        settings: settings,
      });

      if (!isEqual(settings.searchParameters, oldSettings.searchParameters)) {
        onUpdateContentData(content.contentBlockId, {
          isComposing: true,
        });

        const { products, qualityMetrics } = await doSearch(settings);
        const oldProducts = products.filter((p) =>
          content.data.find((d) => p.id === d.id),
        );

        const existProducts = oldProducts.map((o) => {
          o.pageContent =
            content.data.find((d) => o.id === d.id)?.pageContent || {};
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

        content.data = [...existProducts, ...newProducts];
        content.qualityMetrics = qualityMetrics;
        onUpdateContentData(content.contentBlockId, {
          isComposing: false,
          data: content.data,
          qualityMetrics: content.qualityMetrics,
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
    },
    [onUpdateContentData, doSearch, autoComposeBlurbs, autoComposeParagraphs],
  );

  const handlePin = useCallback(
    (sku) => {
      const excludedSkus =
        content.settings.searchParameters?.excludedSkus || [];
      const pinnedSkus = content.settings.searchParameters?.pinnedSkus || [];

      if (excludedSkus.some((e) => e.value === sku)) {
        toast.error('Excluded products cannot be pinned.', {
          theme: 'colored',
        });
        return;
      }

      if (pinnedSkus.some((e) => e.value === sku)) {
        handleSettingsChange({
          ...content.settings,
          searchParameters: {
            ...(content.settings.searchParameters || {}),
            pinnedSkus: pinnedSkus.filter((s) => s.value !== sku),
          },
        });
      } else {
        handleSettingsChange({
          ...content.settings,
          searchParameters: {
            ...(content.settings.searchParameters || {}),
            pinnedSkus: [
              ...(content.settings.searchParameters?.pinnedSkus || []),
              { value: sku, label: sku },
            ],
          },
        });
      }
    },
    [handleSettingsChange, content.settings],
  );

  const handleExclude = useCallback(
    (sku) => {
      const pinnedSkus = content.settings.searchParameters?.pinnedSkus || [];

      if (pinnedSkus.some((e) => e.value === sku)) {
        toast.error('Pinned products cannot be excluded.', {
          theme: 'colored',
        });
        return;
      }

      handleSettingsChange({
        ...content.settings,
        searchParameters: {
          ...(content.settings.searchParameters || {}),
          excludedSkus: [
            ...(content.settings.searchParameters?.excludedSkus || []),
            { value: sku, label: sku },
          ],
        },
      });
    },
    [handleSettingsChange, content.settings],
  );

  const handleExcludedCategory = useCallback(
    (category) => {
      const categories = content.settings.searchParameters?.categories || [];

      if (categories.some((e) => e.value === category)) {
        toast.error('Included category cannot be excluded.', {
          theme: 'colored',
        });
        return;
      }
      handleSettingsChange({
        ...content.settings,
        searchParameters: {
          ...(content.settings.searchParameters || {}),
          excludedCategories: [
            ...(content.settings.searchParameters?.excludedCategories || []),
            { value: category, label: category },
          ],
        },
      });
    },
    [handleSettingsChange, content.settings],
  );

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
  return content?.data && content.data.length > 0 ? (
    <div>
      {finding && <Spinner size="sm" color="primary" />}
      {findResults?.pages?.length > 0 && (
        <UncontrolledAlert color="warning" className="mb-0">
          There is an existing page with this assortment: <br />
          <Link href={`/page/${findResults.pages[0].slug}`} legacyBehavior>
            <a target="_blank">{findResults.pages[0].title}</a>
          </Link>
        </UncontrolledAlert>
      )}
      {isIterableArray(content.data) &&
        content.data
          .slice(0, content.settings?.searchParameters?.maxResults || 10)
          .map((product, index) => (
            <Product
              {...product}
              pagetitle={title}
              key={product.id}
              index={index}
              pinned={content.settings.searchParameters?.pinnedSkus?.some(
                (e) => e.value === product.id,
              )}
              handlePin={handlePin}
              handleExclude={handleExclude}
              handleExcludedCategory={handleExcludedCategory}
              includeReviewExcerpts={
                content.settings?.contentSettings?.includeReviewExcerpts
              }
              includeBlurbs={content.settings?.contentSettings?.includeBlurbs}
              includeParagraphs={
                content.settings?.contentSettings?.includeParagraphs
              }
              includePros={content.settings?.contentSettings?.includePros}
              includeCons={content.settings?.contentSettings?.includeCons}
              onRewriteBlurb={handleRewriteBlurb}
              onUpdateBlurb={handleUpdateBlurb}
              onRewriteParagraph={handleRewriteParagraph}
              isAuthoringBlurb={content.authoringIndex === 'b' + index}
              isAuthoringParagraph={content.authoringIndex === 'p' + index}
              onChangeImage={handleChangeImage}
              onSuppressExcerpt={handleSuppressExcerpt}
              onUpdateExcerpt={handleUpdateExcerpt}
            />
          ))}
    </div>
  ) : (
    <div className="p-3">No items match your search parameters</div>
  );
};

export default ProductList;
