import React, { useState, useCallback, Fragment } from 'react';
import { limitString } from '@helpers/utils';
import { useGetRelatedPages, getCompletion } from '@util/api';
import { useEditPageContext } from '@context/EditPageContext';
import {
  Input,
  Button,
  Form,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownMenu,
  Collapse,
  Spinner,
  Tooltip,
} from 'reactstrap';
import { isIterableArray } from '@helpers/utils';
import { debounce } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh, fas } from '@fortawesome/free-solid-svg-icons';
import Loader from '@components/common/Loader';
import Flex from '@components/common/Flex';
import { isEqual } from 'lodash';
import { toast } from 'react-toastify';

const AutoLink = (props) => {
  const {
    contentBlockId,
    content,
    isComposing,
    setIsComposing,
    getCurrentContent,
    replaceAllContent,
  } = props;

  const { page } = useEditPageContext();
  const [showMore, setShowMore] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchContent, setSearchContent] = useState(content);

  const { isLoading: isRelatedPagesLoading, data: relatedPages } =
    useGetRelatedPages(
      limitString(searchContent?.text, 500),
      page?.pageId,
      null,
      null,
      searchContent?.text?.length > 0,
      true,
    );
  const { isLoading: isSearchRPLoading, data: searchRelatedPages } =
    useGetRelatedPages(
      searchInputValue,
      page?.pageId,
      null,
      null,
      searchInputValue.length > 0,
      true,
    );

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const debouncedSearchInput = useCallback(
    debounce((value) => {
      setSearchInputValue(value);
    }, 300),
    [],
  );

  const handleCompose = async (component, topic, content) => {
    const settings = {
      header: topic,
      topic: content,
      componentId: component?.componentId,
    };
    const res = await getCompletion(settings);
    if (res.success) {
      return res;
    } else {
      toast.error('Unable to compose paragraph: ' + res.message, {
        theme: 'colored',
      });
      setIsComposing(false);
      return null;
    }
  };

  const handleAutoLink = async (selectedText, selectedLink) => {
    if (isComposing) {
      return;
    }
    setIsComposing(true);
    const completion = await handleCompose(
      { componentId: 'Insert Link' },
      selectedText,
      getCurrentContent().html.trim(),
    );
    if (completion && completion.composition) {
      let content = completion.composition;
      if (content.indexOf('<a href="#">') >= 0)
        content = completion.composition.replaceAll(
          `<a href="#">`,
          `<a href="${selectedLink}">`,
        );
      replaceAllContent(content, true);
    }

    setIsComposing(false);
  };

  const onRefreshAutoLink = () => {
    const content = getCurrentContent();
    setSearchContent(content);
  };

  return (
    <>
      <Flex justify="between" align="start">
        <span className="mr-2" style={{ flexShrink: 0 }}>
          Auto-Link:
        </span>
        {isRelatedPagesLoading && (
          <Spinner size="sm" variant="primary"></Spinner>
        )}
        {relatedPages?.pages && (
          <div style={{ flexGrow: 1 }}>
            <Flex justify="between" align="center">
              <div>
                {isIterableArray(relatedPages?.pages) && (
                  <>
                    {relatedPages.pages.map((rp, index) => {
                      return (
                        <Fragment key={`auto-link-${index}`}>
                          {index < 3 ? (
                            <AutoLinkItem
                              contentBlockId={contentBlockId}
                              index={index}
                              title={rp.friendlyTitle || rp.title}
                              url={rp.url}
                              handleAutoLink={() =>
                                handleAutoLink(
                                  rp.friendlyTitle || rp.title,
                                  rp.url,
                                )
                              }
                            />
                          ) : (
                            <>
                              {showMore && (
                                <AutoLinkItem
                                  contentBlockId={contentBlockId}
                                  index={index}
                                  title={rp.friendlyTitle || rp.title}
                                  url={rp.url}
                                  handleAutoLink={() =>
                                    handleAutoLink(
                                      rp.friendlyTitle || rp.title,
                                      rp.url,
                                    )
                                  }
                                />
                              )}
                            </>
                          )}
                        </Fragment>
                      );
                    })}

                    {!showMore && (
                      <span
                        className="cursor-pointer"
                        color="primary"
                        onClick={() => setShowMore(true)}
                        style={{ color: '#2c7be5' }}
                      >
                        more...
                      </span>
                    )}

                    {showMore && (
                      <strong>
                        <span
                          className="cursor-pointer"
                          color="primary"
                          onClick={() => setShowSearch(!showSearch)}
                          style={{ color: '#2c7be5' }}
                        >
                          Search More Pages...
                        </span>
                      </strong>
                    )}
                  </>
                )}
              </div>
            </Flex>
          </div>
        )}

        <Button
          color="link"
          className="btn-reveal p-0 ml-2"
          onClick={() => onRefreshAutoLink()}
          disabled={isEqual(searchContent, content)}
        >
          <FontAwesomeIcon icon={faRefresh} className="fs--2" />
        </Button>
      </Flex>
      <Collapse isOpen={showSearch}>
        <button
          type="button"
          className="close position-relative"
          aria-label="Close"
          onClick={() => {
            setShowMore(false);
            setShowSearch(!showSearch);
          }}
          style={{ zIndex: 10 }}
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <Dropdown isOpen={dropdownOpen} toggle={toggle} className="search-box">
          <DropdownToggle
            tag="div"
            data-toggle="dropdown"
            aria-expanded={dropdownOpen}
            className="mt-3"
            style={{ maxWidth: '20rem' }}
          >
            <Form>
              <Input
                type="search"
                placeholder="Find related pages..."
                aria-label="Search"
                className="rounded-pill search-input"
                onChange={({ target }) => debouncedSearchInput(target.value)}
                onClick={() => setDropdownOpen(false)}
                style={{ width: '100%' }}
              />
              <FontAwesomeIcon
                icon="search"
                className="position-absolute text-400 search-box-icon"
              />
            </Form>
          </DropdownToggle>
          <DropdownMenu style={{ width: '20rem' }}>
            {isSearchRPLoading && <Loader />}
            {!isSearchRPLoading && searchRelatedPages?.success && (
              <div className="scrollbar py-1" style={{ maxHeight: '20rem' }}>
                {isIterableArray(searchRelatedPages.pages) && (
                  <>
                    {searchRelatedPages.pages.map((item, index) => (
                      <ResultItem
                        key={`search-pages-${index}`}
                        index={index}
                        contentBlockId={contentBlockId}
                        title={item.title}
                        url={item.url}
                        handleAutoLink={() =>
                          handleAutoLink(item.title, item.url)
                        }
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </DropdownMenu>
        </Dropdown>
      </Collapse>
    </>
  );
};

const AutoLinkItem = ({
  contentBlockId,
  index,
  title,
  url,
  handleAutoLink,
}) => {
  const [isOpenTooltip, setIsOpenTooltip] = useState(false);

  return (
    <>
      <span
        id={`pop-default-${contentBlockId}-${index}`}
        className="d-inline-block mr-1 cursor-pointer"
        onClick={handleAutoLink}
        style={{
          color: '#2c7be5',
          textDecoration: 'underline #000 dotted',
        }}
      >
        {title},
      </span>
      <Tooltip
        placement="top"
        isOpen={isOpenTooltip}
        target={`pop-default-${contentBlockId}-${index}`}
        toggle={() => setIsOpenTooltip(!isOpenTooltip)}
      >
        {url}
      </Tooltip>
    </>
  );
};

const ResultItem = ({ contentBlockId, index, title, url, handleAutoLink }) => {
  const [isOpenTooltip, setIsOpenTooltip] = useState(false);

  return (
    <>
      <DropdownItem
        id={`pop-result-${contentBlockId}-${index}`}
        className="px-card py-1 fs-0"
        onClick={handleAutoLink}
      >
        <div align="left">
          <div className="flex-1 fs--1">{title}</div>
        </div>
      </DropdownItem>
      <Tooltip
        placement="top"
        isOpen={isOpenTooltip}
        target={`pop-result-${contentBlockId}-${index}`}
        toggle={() => setIsOpenTooltip(!isOpenTooltip)}
      >
        {url}
      </Tooltip>
    </>
  );
};

export default AutoLink;
