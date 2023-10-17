import React, { useEffect, useState } from 'react';
import {
  DropdownItem,
  DropdownMenu,
  Form,
  Input,
  Dropdown,
  DropdownToggle,
  Media,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isIterableArray } from '@helpers/utils';
import { useGetProducts } from '@util/api';
import { debounce } from 'lodash';

const MediaSearchContent = ({ item, onSelectItem }) => {
  return (
    <DropdownItem
      className="px-card py-2"
      onClick={(e) => onSelectItem(item.id)}
    >
      <Media className="align-item-center">
        <div className="file-thumbnail">
          <img
            src={item.image}
            alt=""
            className="border h-100 w-100 fit-cover rounded-lg"
          />
        </div>

        <Media body className="ml-2">
          <p className="fs--2 mb-0">{item.name + ' (' + item.id + ')'}</p>
        </Media>
      </Media>
    </DropdownItem>
  );
};

const ProductSearchBox = ({ autoCompleteItem, onSelectItem }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [resultItem, setResultItem] = useState(autoCompleteItem);

  const { status, data: searchResult } = useGetProducts(searchInputValue);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  useEffect(() => {
    if (searchInputValue && searchResult) {
      setResultItem(searchResult.products);
      isIterableArray(searchResult.products)
        ? setDropdownOpen(true)
        : setDropdownOpen(false);
    } else {
      setResultItem(autoCompleteItem);
    }

    // eslint-disable-next-line
  }, [searchInputValue]);

  const debouncedChangeFilter = debounce(query => {
    setSearchInputValue(query);
  }, 1000);

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
            placeholder="Search by name or SKU..."
            aria-label="Search"
            className="rounded-pill search-input"
            onChange={({ target }) => debouncedChangeFilter(target.value)}
            onClick={() => setDropdownOpen(false)}
          />
          <FontAwesomeIcon
            icon="search"
            className="position-absolute text-400 search-box-icon"
          />
        </Form>
        {searchInputValue && (
          <button className="close" onClick={() => setSearchInputValue('')}>
            <FontAwesomeIcon icon="times" />
          </button>
        )}
      </DropdownToggle>
      {searchResult && (
        <DropdownMenu>
          <div className="scrollbar py-3" style={{ maxHeight: '24rem' }}>
            {searchResult.products && searchResult.products.length > 0 && (
              <>
                {searchResult.products.map((item, index) => (
                  <MediaSearchContent
                    item={item}
                    key={index}
                    onSelectItem={onSelectItem}
                  />
                ))}
              </>
            )}
          </div>
        </DropdownMenu>
      )}
    </Dropdown>
  );
};

export default ProductSearchBox;
