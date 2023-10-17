import React, { useState, useMemo, useEffect } from 'react';
import FilterSelect from '@components/FilterSelect';
import { loadLabelsOptions } from '@util/load-options';
import { dateFormatter } from '@helpers/formatter';
import FormGroupInput from '@components/common/FormGroupInput';
import FormGroupSelect from '@components/common/FormGroupSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic } from '@fortawesome/free-solid-svg-icons';
import { getCompletion, useGetLanguagesOption } from '@util/api';
import { toast } from 'react-toastify';
import { Languages } from '@util/enum';
import { useEditPageContext } from '@context/EditPageContext';
import {
  Button,
  InputGroup,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { omit, isEmpty } from 'lodash';

const PageSettings = ({
  page,
  title,
  pageLang,
  metaDescription,
  setMetaDescription,
  pageSettings,
  setPageSettings,
  handleMetaDescTranslation,
  suggestedPath,
}) => {
  const {
    location,
    locationPages,
    defaultPage,
    isWorking,
    setIsWorking,
    enableAutoMeta,
    setEnableAutoMeta,
  } = useEditPageContext();

  const [isOpen, setIsOpen] = useState(false);

  const [language, setLanguage] = useState(pageLang);
  const { status, data: langsData } = useGetLanguagesOption();

  useEffect(() => {
    setLanguage(pageLang);
  }, [pageLang]);

  useEffect(() => {
    if (!enableAutoMeta || !title ) return;
    const autoAuthorMetaDescription = async () => {
      await authorMetaDescription();
      setEnableAutoMeta(false);
    };

    autoAuthorMetaDescription();
  }, [enableAutoMeta, title]);

  useEffect(() => {
    if (location && locationPages.length > 0) {
      const locationPage = locationPages.find(
        (page) => page.locationId === location.id,
      ).content;

      if (!locationPage) return;

      if (locationPage.metaDescription) {
        const locationMeta = locationPage.metaDescription
          .replaceAll('{{title}}', defaultPage.title)
          .replaceAll('{{city}}', location.city)
          .replaceAll('{{state}}', location.state);
        setMetaDescription(locationMeta);
        handleMetaDescription(locationMeta);
      }
    }
  }, [location]);

  const menuItems = useMemo(() => {
    if (status && langsData?.languages?.length > 0) {
      return ['en', ...langsData.languages];
    }
    return [];
  }, [langsData?.languages]);

  const authorMetaDescription = async () => {
    if (!title || title.trim().length === 0) {
      toast.error('You must enter a page title to author a meta description', {
        theme: 'colored',
      });
      return;
    }
    setIsWorking(true);
    const settings = {
      topic: title,
      componentId: 'Meta Description',
    };
    const res = await getCompletion(settings);
    if (res.success && res.composition) {
      removeTransMetaDescription();
      setPageSettings('metaDescription', res.composition.trim());
      setMetaDescription(res.composition.trim());
      setLanguage('en');
    }
    setIsWorking(false);
  };

  const removeTransMetaDescription = () => {
    let translations = pageSettings.translations || {};

    if (isEmpty(translations)) return;
    if (langsData?.languages?.length > 0) {
      langsData?.languages?.forEach((item) => {
        translations[item] = omit(translations[item], 'metaDescription');
      });

      setPageSettings('translations', translations);
    }
  };

  const handleMetaDescription = (value) => {
    if (language === 'en') {
      removeTransMetaDescription();
      setPageSettings('metaDescription', value);
    } else {
      setPageSettings('translations', {
        ...pageSettings?.translations,
        [language]: {
          ...pageSettings?.translations?.[language],
          metaDescription: value,
        },
      });
    }
    setMetaDescription(value);
  };

  const onTranslation = async (lang) => {
    setIsWorking(true);
    setLanguage(lang);
    const translatedMetaDesc = await handleMetaDescTranslation(lang);
    if (translatedMetaDesc) {
      const data = pageSettings.translations?.[lang] || {};
      data.metaDescription = translatedMetaDesc;
      setPageSettings('translations', {
        ...pageSettings.translations,
        [lang]: data,
      });
    }
    setIsWorking(false);
  };

  return (
    <>
      <FormGroupInput
        id="metaDescription"
        type="textarea"
        rows={4}
        label={
          <InputGroup className="align-items-center">
            <span className="mr-auto mb-0">Meta Description</span>
            <Button
              color="secondary"
              size="sm"
              outline
              onClick={authorMetaDescription}
              disabled={isWorking}
            >
              <FontAwesomeIcon icon={faMagic} />
            </Button>
            {menuItems.length > 0 && (
              <Dropdown
                isOpen={isOpen}
                toggle={() => setIsOpen(!isOpen)}
                size="sm"
                className="ml-2 trans-menu-meta-desc"
              >
                <DropdownToggle outline className="btn" disabled={isWorking}>
                  {Languages[language]}
                </DropdownToggle>
                <DropdownMenu>
                  {menuItems.map((l, index) => (
                    <DropdownItem key={index} onClick={() => onTranslation(l)}>
                      {Languages[l]}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}
          </InputGroup>
        }
        labelClass="label-meta-description"
        value={metaDescription}
        onChange={(ev) => handleMetaDescription(ev.target.value)}
      />
      <FormGroupInput
        id="pagePath"
        label={
          suggestedPath ? (
            <>
              Page Path{' '}
              <small>
                (Suggested:{' '}
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    setPageSettings('pagePath', suggestedPath);
                    return false;
                  }}
                  href="/"
                >
                  {suggestedPath})
                </a>
              </small>
            </>
          ) : (
            'Page Path'
          )
        }
        placeholder="Example: /shoes/hightops/"
        value={pageSettings.pagePath}
        onChange={(ev) => setPageSettings('pagePath', ev.target.value)}
      />
      <FormGroupInput
        id="redirectUrl"
        label="Redirect URL"
        value={pageSettings.redirectUrl}
        onChange={(ev) => setPageSettings('redirectUrl', ev.target.value)}
      />
      <FormGroupSelect
        loading={false}
        id="redirectType"
        label="Redirect Type"
        value={pageSettings.redirectType || ''}
        options={[
          { value: '', label: '' },
          { value: 301, label: '301' },
          { value: 302, label: '302' },
        ]}
        onChange={(ev) => setPageSettings('redirectType', ev.target.value)}
      />
      <FilterSelect
        label="Labels"
        placeholder="Select labels..."
        value={pageSettings.labels}
        onChange={(value) => setPageSettings('labels', value)}
        defaultOptions
        loadOptions={loadLabelsOptions}
        isMulti
        isCreatable={true}
      />
      <hr className="border-dashed border-bottom-0" />
      {page && page.authorEmail && (
        <p className="fs--2">
          Created by {page.authorEmail} on {dateFormatter(page.dateAdded)}
        </p>
      )}
      {page && page.lastEditorEmail && (
        <p className="fs--2">
          Last edited by {page.lastEditorEmail} on{' '}
          {dateFormatter(page.dateModified)}
        </p>
      )}
      {page && page.lastUpdated && (
        <p className="fs--2">
          Last refreshed on {dateFormatter(page.lastUpdated)}
        </p>
      )}
    </>
  );
};

export default PageSettings;
