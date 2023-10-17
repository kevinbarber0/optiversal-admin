import React, { useEffect, useState, useCallback } from 'react';
import {
  DropdownItem,
  DropdownMenu,
  Form,
  Input,
  Dropdown,
  DropdownToggle,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Loader from '@components/common/Loader';
import { useEditPageContext } from '@context/EditPageContext';
import { useGetPages } from '@util/api';
import { isIterableArray } from '@helpers/utils';
import { debounce } from 'lodash';
import { PageStatus } from '@util/enum';

const RelatedPageSearchBox = ({
  pinned,
  excluded,
  relatedPages,
  addPinned,
}) => {
  const { page } = useEditPageContext();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [resultItems, setResultItems] = useState([]);

  const {
    status,
    isLoading,
    data: pagesResult,
  } = useGetPages({
    offset: 0,
    limit: 20,
    keyword: searchInputValue,
    filters: {
      status: PageStatus.PUBLISHED,
    },
  });

  useEffect(() => {
    if (pagesResult?.success) {
      let pages = pagesResult.pages;
      if (page?.pageId) pages = pages.filter((p) => p.pageId !== page.pageId);
      if (pinned?.length > 0)
        pages = pages.filter((p) => !pinned?.includes(p.pageId));
      if (excluded?.length > 0)
        pages = pages.filter((p) => !excluded?.includes(p.pageId));
      if (relatedPages?.length > 0)
        pages = pages.filter(
          (p) => !relatedPages?.find((r) => r.pageId === p.pageId),
        );

      setResultItems(pages);
    }
  }, [pagesResult, pinned, excluded, relatedPages]);

  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const debouncedSearchInput = useCallback(
    debounce((value) => {
      setSearchInputValue(value);
    }, 300),
    [],
  );

  const handleClick = (page) => {
    if (!page) return;
    addPinned(page);
    setResultItems(resultItems.filter((r) => r.pageId !== page.pageId));
  };

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggle} className="search-box">
      <DropdownToggle
        tag="div"
        data-toggle="dropdown"
        aria-expanded={dropdownOpen}
      >
        <Form>
          <Input
            type="search"
            placeholder="Add a related page..."
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
      <DropdownMenu style={{ width: '100%' }}>
        {isLoading && <Loader />}
        {!isLoading && pagesResult?.success && (
          <div className="scrollbar py-3" style={{ maxHeight: '24rem' }}>
            {isIterableArray(resultItems) && (
              <>
                <DropdownItem className="px-card pt-0 pb-2" header>
                  Related Pages
                </DropdownItem>
                {resultItems.map((item, index) => (
                  <DropdownItem
                    className="px-card py-1 fs-0"
                    key={index}
                    onClick={() => handleClick(item)}
                  >
                    <div align="left">
                      <div className="flex-1 fs--1">{item.title}</div>
                    </div>
                  </DropdownItem>
                ))}
              </>
            )}
          </div>
        )}
      </DropdownMenu>
    </Dropdown>
  );
};

export default RelatedPageSearchBox;
