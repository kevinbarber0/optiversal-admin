import React, { useEffect, useState } from 'react';
import RelatedPage from './RelatedPage';
import { useGetRelatedPages, useGetOrgUrlSettings } from '@util/api';
import Loader from '@components/common/Loader';
import RelatedPageSearchBox from '@components/RelatedPageSearchBox';

const RelatedPages = (props) => {
  const { page, title, pageSettings, setPageSettings } = props;
  const [preventLoad, setPreventLoad] = useState(false);

  const [relatedPages, setRelatedPages] = useState(page?.relatedPages || []);
  const pinned = pageSettings?.relatedPages?.pinned || [];
  const suppressed = pageSettings?.relatedPages?.suppressed || [];

  const { isLoading: isSettingLoading, data: orgSettingResult } =
    useGetOrgUrlSettings('page');
  const { isLoading: isRelatedPagesLoading, data: relatedPagesData } =
    useGetRelatedPages(
      title,
      page?.pageId,
      pinned,
      suppressed,
      relatedPages.length === 0 || preventLoad,
    );

  useEffect(() => {
    if (relatedPagesData?.pages?.length > 0) {
      setRelatedPages(relatedPagesData.pages);
    }
  }, [relatedPagesData]);

  const onPin = (isPinned, pageData) => {
    const settingRelatedPages = pageSettings?.relatedPages || {};
    if (isPinned) settingRelatedPages.pinned = pinned.concat(pageData.pageId);
    else
      settingRelatedPages.pinned = pinned.filter((p) => p !== pageData.pageId);

    setPageSettings('relatedPages', settingRelatedPages);
    setPreventLoad(true);
  };

  const onTrash = (pageData) => {
    const settingRelatedPages = pageSettings?.relatedPages || {};

    settingRelatedPages.suppressed = suppressed.concat(pageData.pageId);
    settingRelatedPages.pinned = pinned.filter((p) => p !== pageData.pageId);

    setPageSettings('relatedPages', settingRelatedPages);
    setPreventLoad(true);
  };

  const addMaualPinned = (page) => {
    if (!page) return;
    const settingRelatedPages = pageSettings?.relatedPages || {};
    settingRelatedPages.pinned = pinned.concat(page.pageId);
    setPreventLoad(false);
    setRelatedPages([
      ...relatedPages.slice(0, pinned.length),
      page,
      ...relatedPages.slice(pinned.length),
    ]);
    // relatedPages.splice(pinned.length, 0, page);
    setPageSettings('relatedPages', settingRelatedPages);
  };

  return (
    <div className="overlaycontainer">
      <div className="overlayunder">
        <RelatedPageSearchBox
          pinned={pinned}
          excluded={suppressed}
          relatedPages={relatedPages}
          addPinned={addMaualPinned}
        />
        <br />
        {relatedPages.length > 0 && (
          <>
            {relatedPages.map((rp, index) => (
              <RelatedPage
                key={index}
                page={rp}
                pinned={pinned.some((p) => p === rp.pageId)}
                urlFormat={orgSettingResult?.settingUrl}
                isLast={index === relatedPages.length - 1}
                onPin={onPin}
                onTrash={onTrash}
              />
            ))}
          </>
        )}
        {relatedPages.length === 0 && (
          <>
            <label p className="mb-1  text-700">
              No related published pages found.
            </label>
            <br />
          </>
        )}
      </div>
      {isRelatedPagesLoading && (
        <div className="overlayover">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default RelatedPages;
