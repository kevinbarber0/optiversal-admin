/* eslint-disable indent */
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { Languages, PageStatusStrings, PresentationMode } from '@util/enum';
import {
  useGetPage,
  updatePageStatus,
  useGetContentTemplate,
  useOrgPageSettings,
} from '@util/api.js';
import { isEqual } from 'lodash';
import { upperTitleize } from '@helpers/utils';

const EditPageContext = React.createContext(null);
EditPageContext.displayName = 'EditPageContext';

const EditPageContextProvider = (props) => {
  const router = useRouter();
  const slug = router.query?.slug;
  const contentTemplateId = props?.contentTemplate?.value || router.query?.ct;

  const [title, setTitle] = useState(props?.page?.title ?? '');
  const [language, setLanguage] = useState();
  const [location, setLocation] = useState(); //current location
  const [presentationMode, setPresentationMode] = useState(
    PresentationMode.Default,
  );
  const [workflow, setWorkflow] = useState(props?.workflow ?? null);
  const [completedWorkflow, setCompltetedWorkflow] = useState(
    props?.completedWorkflow ?? false,
  );
  const [page, setPage] = useState(props?.page ?? null);
  const [pageChanged, setPageChanged] = useState(false);
  const [keyword, setKeyword] = useState(null);
  const [template, setTemplate] = useState();
  const [defaultPage, setDefaultPage] = useState();
  const [locationPages, setLocationPages] = useState(page?.locations ?? []);

  const [enableAutoMeta, setEnableAutoMeta] = useState(false);

  const [isWorking, setIsWorking] = useState(false);

  const { data: contentTemplateResult, isLoading: isContentTemplateLoading } =
    useGetContentTemplate(contentTemplateId);
  const { status, data: pageResult } = useGetPage(slug, !page);
  const { status: orgSettingsStatus, data: orgSettings } = useOrgPageSettings();

  useEffect(() => {
    if (contentTemplateResult && contentTemplateResult.contentTemplate) {
      setTemplate(contentTemplateResult.contentTemplate);
    }
  }, [contentTemplateResult]);

  useEffect(() => {
    setCompltetedWorkflow(props?.completedWorkflow);
  }, [props?.completedWorkflow]);

  useEffect(() => {
    if (pageResult) {
      if (pageResult.status === 'error') {
        router.push('/');
      }
      if (!pageResult.success) {
        if (pageResult.message === 'Not found') {
          router.push('/404');
        } else if (pageResult.message === 'Unauthorized') {
          router.push('/');
        }
      } else if (pageResult.page) {
        setPage(JSON.parse(JSON.stringify(pageResult.page)));
        setTitle(pageResult.page.title ?? '');
        setLocationPages(pageResult.page?.locations ?? []);
      }
    }
  }, [pageResult]);

  useEffect(() => {
    const { query } = router;
    if (!query?.lang) {
      setLanguage('en');
      setPresentationMode(PresentationMode.Languages);
      return;
    }
    if (query.lang !== language) {
      setLanguage(query.lang);
      setPresentationMode(PresentationMode.Languages);
    }
  }, [router.query]);

  useEffect(() => {
    if (!language) return;
    const { query } = router;
    const newLang = language === 'en' ? null : language;
    if (!isEqual(newLang, query.lang) && router.isReady) {
      if (newLang) {
        router.push({
          pathname: query.pathname,
          query: { ...query, lang: newLang },
        });
      } else {
        delete query?.lang;
        router.push({
          pathname: query.pathname,
          query: query,
        });
      }
    }
  }, [language]);

  useEffect(() => {
    if (!props?.keyword && !router.query?.keyword) return;

    setTitle(upperTitleize(props?.keyword || router.query?.keyword).trim());
    setKeyword(upperTitleize(props?.keyword || router.query?.keyword).trim());
  }, [props?.keyword, router.query?.keyword]);

  useEffect(() => {
    if (!props?.page) return;
    setTitle(props?.page?.title.trim());
    setPage(props?.page);
  }, [props?.page]);

  const handleCancel = () => {
    if (props?.onCancel) props.onCancel();
    else router.push('/pages');
  };

  const handleSave = (slug) => {
    if (workflow) return;
    router.push('/page/' + slug);
  };

  const handlePageStatus = async (status) => {
    setIsWorking(true);
    const res = await updatePageStatus(page.pageId, page.slug, status);
    if (res.success) {
      toast.success(`Updated the page status to ${PageStatusStrings[status]}`, {
        theme: 'colored',
      });
    } else {
      toast.error(
        'There was a problem changing the page status: ' + res.message,
        {
          theme: 'colored',
        },
      );
    }
    setIsWorking(false);
    return res;
  };

  const value = {
    page,
    pageChanged,
    setPageChanged,
    defaultPage,
    setDefaultPage,
    title,
    setTitle,
    keyword,
    workflow,
    completedWorkflow,
    language,
    setLanguage,
    location,
    setLocation,
    presentationMode,
    setPresentationMode,
    template,
    locationPages,
    setLocationPages,
    isWorking,
    setIsWorking,
    enableAutoMeta,
    setEnableAutoMeta,
    orgSettingsStatus,
    orgSettings,
    onSave: handleSave,
    onCancel: handleCancel,
    onChangeStatus: handlePageStatus,
  };

  return <EditPageContext.Provider value={value} {...props} />;
};

const useEditPageContext = () => {
  return useContext(EditPageContext) || {};
};

export { EditPageContextProvider, useEditPageContext };
