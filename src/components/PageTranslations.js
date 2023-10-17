import React, { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import { useGetPageTranslations, addPageTranslation } from '@util/api.js';
import { toast } from 'react-toastify';
import FilterSelect from '@components/FilterSelect';
import classNames from 'classnames';
import PageTranslationEditor from '@components/PageTranslationEditor';

function offset(el) {
  if (el) {
    const rect = el.getBoundingClientRect();
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }
  return { top: 0, left: 0 };
}

const PageTranslations = (props) => {
  const [languages, setLanguages] = useState([]);
  const [activeTab, setActiveTab] = useState();
  const { status, data: translationResults } = useGetPageTranslations(
    props.page.pageId,
  );
  const [indicatorLeft, setIndicatorLeft] = useState(null);
  const [indicatorRight, setIndicatorRight] = useState(null);
  const [currentTabIndex, setCurrentTabIndex] = useState(null);
  const [isReverse, setIsReverse] = useState(false);
  const [working, setWorking] = useState(false);

  const updateIndicator = (id) => {
    const navbar = document.getElementById('fancy-tab-footer');
    if (navbar) {
      const tabnavCurrentItem = document.getElementById(id);
      const navbarLeft = offset(navbar).left;
      const left = offset(tabnavCurrentItem).left - navbarLeft;
      const right = navbar.offsetWidth - (left + tabnavCurrentItem.offsetWidth);
      setIndicatorLeft(left);
      setIndicatorRight(right);
    }
  };

  useEffect(() => {
    if (
      status === 'success' &&
      translationResults &&
      translationResults.translations &&
      !activeTab
    ) {
      setActiveTab(Object.keys(translationResults.translations)[0]);
    }
  }, [status]);

  const handleActiveTab = ({ target }) => {
    const { id, tabIndex } = target;
    setActiveTab(id);
    updateIndicator(id);
    setIsReverse(currentTabIndex > tabIndex);
    setCurrentTabIndex(tabIndex);
  };

  const sendTranslationRequest = async (
    type,
    languageCode,
    language,
    content,
  ) => {
    const data = {
      language: language,
      languageCode: languageCode,
      type: type,
      content: content,
    };
    await addPageTranslation(props.page.pageId, data);
    setWorking(false);
    setLanguages([]);
  };

  const handleTranslateClick = (type) => {
    if (!languages || languages.length < 1) {
      toast.error('Please select at least one language to translate to');
    }
    setWorking(true);
    const content = props.getContent();
    if (content && content.trim().length > 0) {
      languages.forEach((lang) => {
        sendTranslationRequest(type, lang.value, lang.label, content);
      });
    } else {
      toast.error('No content found to translate');
    }
  };

  const options = [
    { value: 'da', label: 'Danish' },
    { value: 'nl', label: 'Dutch' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'el', label: 'Greek' },
    { value: 'fi', label: 'Finnish' },
    { value: 'it', label: 'Italian' },
    { value: 'no', label: 'Norwegian' },
    { value: 'pl', label: 'Polish' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'es', label: 'Spanish' },
    { value: 'sv', label: 'Swedish' },
  ];

  return (
    <>
      <FilterSelect
        label="Select one or more languages to translate to"
        placeholder="Select language(s)..."
        value={languages}
        options={options}
        onChange={(value) => {
          setLanguages(value);
        }}
        isMulti
      />
      <Button
        color="primary"
        onClick={() => handleTranslateClick('machine')}
        disabled={working}
      >
        {working ? 'Working...' : 'Translate Now'}
      </Button>
      {/* &nbsp; <Button onClick={() => handleTranslateClick('human')} disabled={working}>{working ? 'Working...' : 'Request Human Translation'}</Button>*/}
      <br />
      {translationResults && translationResults.translations && (
        <>
          <div className="row">
            <div className="col-12">
              <div
                className="fancy-tab overflow-hidden mt-4"
                id="fancy-tab-footer"
              >
                <div className="nav-bar">
                  {Object.values(translationResults.translations).map(
                    (translation) => (
                      // eslint-disable-next-line react/jsx-key
                      <div
                        className={classNames(
                          'nav-bar-item pl-0 pr-2 pr-sm-4',
                          { active: activeTab === translation.languageCode },
                        )}
                      >
                        <div
                          className="mt-1 fs--1"
                          id={translation.languageCode}
                          tabIndex={1}
                          onClick={handleActiveTab}
                        >
                          {translation.language}
                        </div>
                      </div>
                    ),
                  )}
                  <div
                    className={classNames('tab-indicator', {
                      'transition-reverse': isReverse,
                    })}
                    style={{ left: indicatorLeft, right: indicatorRight }}
                  />
                </div>
                <div className="tab-contents">
                  {Object.values(translationResults.translations).map(
                    (translation) => (
                      // eslint-disable-next-line react/jsx-key
                      <div
                        className={classNames('tab-content', {
                          active: activeTab === translation.languageCode,
                        })}
                      >
                        <p>
                          {(translation.status === 'Translated' ||
                            translation.status === 'Edited') && (
                            <PageTranslationEditor
                              translation={translation}
                              pageId={props.page.pageId}
                            />
                          )}
                          {translation.status !== 'Translated' &&
                            translation.status !== 'Edited' && (
                              <>
                                Your translation has been requested and should
                                appear here within 2 days.
                              </>
                            )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PageTranslations;
