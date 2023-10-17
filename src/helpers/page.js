import { isEmpty } from 'lodash';
import { PageStatus } from '@util/enum';

export const getPagePreviewLink = (page) => {
  if (isEmpty(page)) return '#';
  let path = '/';
  if (page?.pageSettings?.pagePath) {
    path = page.pageSettings.pagePath;
  }
  const previewKey = `${page?.organizationId}/${page?.pageId}${path}${page?.slug}`;
  return `${process.env.NEXT_PUBLIC_PAGE_PREVIEW_BUCKET_PATH}/${previewKey}`;
};

export const getPageLink = (page, orgSettings) => {
  let pageUrl = '#';
  if (isEmpty(page)) return pageUrl;

  if (page?.status !== PageStatus.PUBLISHED) {
    pageUrl = getPagePreviewLink(page);
  } else {
    let path = '';

    if (page?.pageSettings?.pagePath) {
      path = page.pageSettings.pagePath.substring(1);
    }
    const pageSlug = `${path}${page?.slug}`;

    pageUrl = orgSettings?.urlFormat?.replaceAll('{{slug}}', pageSlug);
  }

  return pageUrl;
};
