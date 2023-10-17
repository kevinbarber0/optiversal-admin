import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { requireAuth } from '@util/auth.js';
import Router, { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-toastify';
import CardSummary from '@components/dashboard/CardSummary';
import {
  InputGroupAddon,
  InputGroupText,
  Input,
  InputGroup,
  Card,
  CardBody,
  Row,
  Col,
  FormGroup,
  Label,
  Button,
  CustomInput,
  Popover,
  PopoverBody,
  Nav,
  NavItem,
  NavLink,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisH,
  faGift,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';

import FalconCardHeader from '@components/common/FalconCardHeader';
import FilterSelect from '@components/FilterSelect';
import ButtonIcon from '@components/common/ButtonIcon';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import contentTypeOptions from '@data/contentTypeOptions';
import ListingsTable from '@components/ListingsTable';
import {
  getCategories,
  getCategoryByIds,
  getCustomAttributes,
  useGetProductsWithFilters,
  exportListings,
  useGetOrganizationListingSources,
  updateProductLabels,
} from '@util/api';
import { isEqual, debounce } from 'lodash';
import { compareArray, filterNullValues } from '@helpers/utils';
import LabelPicker from '@components/LabelPicker';
import useStateWithCallback from 'hooks/useStateWithCallback';
import DownloadModal from '@components/DownloadModal';

function ViewProducts() {
  const router = useRouter();
  const [squery, setSQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [filterOptions, setFilterOptions] = useStateWithCallback({
    categories: [],
    includedFilters: [],
    missingContent: null,
    minLowestQuality: null,
    maxLowestQuality: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const isMountedRef = useRef(false);
  const isFiltersSetRef = useRef(false);

  const debouncedChangeFilter = debounce((query) => {
    setFilter(query);
  }, 1000);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const { query } = router;
    isFiltersSetRef.current = false;

    (async () => {
      const currentFilters = { ...filterOptions };
      let filterOptionChanged = false;

      const queryCategories =
        (query.categories &&
          (Array.isArray(query.categories)
            ? query.categories
            : [query.categories])) ||
        [];
      if (
        !compareArray(
          queryCategories,
          currentFilters.categories.map((category) => category.value),
        )
      ) {
        const categories = (await getCategoryByIds(queryCategories)).categories;
        currentFilters.categories = categories.map((v) => ({
          value: v.categoryId,
          label: v.name,
        }));
        filterOptionChanged = true;
      }

      const queryIncludedFilters =
        (query.includedFilters &&
          (Array.isArray(query.includedFilters)
            ? query.includedFilters
            : [query.includedFilters])) ||
        [];
      if (
        !compareArray(
          queryIncludedFilters,
          currentFilters.includedFilters.map((category) => category.value),
        )
      ) {
        currentFilters.includedFilters = (queryIncludedFilters || []).map(
          (category) => ({
            label: category,
            value: category,
          }),
        );
        filterOptionChanged = true;
      }

      if (query.missingContent !== currentFilters.missingContent) {
        currentFilters.missingContent = query.missingContent || null;
        filterOptionChanged = true;
      }

      if (query.minLowestQuality !== currentFilters.minLowestQuality) {
        currentFilters.minLowestQuality = query.minLowestQuality || null;
        filterOptionChanged = true;
      }

      if (query.maxLowestQuality !== currentFilters.maxLowestQuality) {
        currentFilters.maxLowestQuality = query.maxLowestQuality || null;
        filterOptionChanged = true;
      }

      if (filterOptionChanged === true) {
        setFilterOptions(currentFilters, () => {
          isFiltersSetRef.current = true;
        });
      } else {
        isFiltersSetRef.current = true;
      }
    })();

    if (query.filter !== currentPage.filter) {
      setFilter(query.filter || '');
    }
    if (query.currentPage !== currentPage) {
      setCurrentPage(query.currentPage || 1);
    }
    if (query.pageSize !== pageSize) {
      setPageSize(query.pageSize || 25);
    }
  }, [router]);

  useEffect(() => {
    if (isMountedRef.current && isFiltersSetRef.current) {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          view: 'products',
          categories:
            filterOptions.categories.length > 0
              ? filterOptions.categories.length === 1
                ? filterOptions.categories[0].value
                : filterOptions.categories.map((category) => category.value)
              : undefined,
          includedFilters:
            filterOptions.includedFilters.length > 0
              ? filterOptions.includedFilters.length === 1
                ? filterOptions.includedFilters[0].value
                : filterOptions.includedFilters.map(
                    (includedFilter) => includedFilter.value,
                  )
              : undefined,
          minLowestQuality: filterOptions.minLowestQuality,
          maxLowestQuality: filterOptions.maxLowestQuality,
          missingContent: filterOptions.missingContent || undefined,
          filter,
          currentPage: currentPage !== 1 ? currentPage : undefined,
          pageSize: pageSize !== 25 ? pageSize : undefined,
        },
        [undefined, null, ''],
      );

      if (!isEqual(newQuery, query)) {
        router.push({
          query: newQuery,
        });
      }
    }
  }, [filterOptions, currentPage, pageSize, filter]);

  return (
    <>
      <FalconCardHeader title="Products" light={false}>
        <InputGroup>
          <ProductsFilterPopover
            filter={filterOptions}
            setFilter={setFilterOptions}
          />

          <InputGroupAddon addonType="prepend">
            <InputGroupText>
              <FontAwesomeIcon icon={faSearch} />
            </InputGroupText>
          </InputGroupAddon>
          <Input
            placeholder="Search..."
            type="text"
            onChange={({ target }) => debouncedChangeFilter(target.value)}
          />
        </InputGroup>
      </FalconCardHeader>
      <CardBody className="p-0">
        <CatalogTable
          filter={filter}
          categories={filterOptions.categories}
          includedFilters={filterOptions.includedFilters}
          missingContent={filterOptions.missingContent}
          minLowestQuality={filterOptions.minLowestQuality}
          maxLowestQuality={filterOptions.maxLowestQuality}
          currentPage={currentPage}
          pageSize={pageSize}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
        />
      </CardBody>
    </>
  );
}

const ProductsFilterPopover = ({ filter, setFilter }) => {
  const [categories, setCategories] = useState(filter.categories);
  const [activeIncludeAttribute, setActiveIncludeAttribute] = useState(null);
  const [activeIncludeAttributeValues, setActiveIncludeAttributeValues] =
    useState([]);
  const [includedFilters, setIncludedFilters] = useState(
    filter.includedFilters,
  );
  const [missingContent, setMissingContent] = useState(filter.missingContent);
  const [minLowestQuality, setMinLowestQuality] = useState(
    filter.minLowestQuality,
  );
  const [maxLowestQuality, setMaxLowestQuality] = useState(
    filter.maxLowestQuality,
  );
  const handleAttributeChange = (attribute) => {
    setActiveIncludeAttribute(attribute);
    setActiveIncludeAttributeValues([]);
  };
  const [isPopupOpen, setPopupOpen] = useState(false);

  const handleSelectIncludedAttributeValue = (val) => {
    setActiveIncludeAttributeValues(val);
  };

  const handleChangeIncludedFilters = (val) => {
    setIncludedFilters(val || []);
  };

  const handleAddStringAttribute = () => {
    if (
      !activeIncludeAttributeValues ||
      activeIncludeAttributeValues.length < 1
    ) {
      toast.error('You must select at least one attribute value');
      return;
    }
    includedFilters.push({
      name: activeIncludeAttribute.name,
      dataType: activeIncludeAttribute.dataType,
      value:
        activeIncludeAttribute.value +
        ':' +
        activeIncludeAttributeValues.map((v) => v.value).join('|'),
      label:
        activeIncludeAttribute.value +
        ':' +
        activeIncludeAttributeValues.map((v) => v.value).join(','),
    });
    setIncludedFilters(includedFilters);
    setActiveIncludeAttribute(null);
    setActiveIncludeAttributeValues([]);
  };

  const loadCategoriesOptions = (inputValue) =>
    new Promise((resolve) => {
      resolve(
        getCategories(inputValue).then((res) =>
          res.categories.map((c) => {
            return {
              value: c.categoryId,
              label: c.name + ' (' + c.categoryId + ')',
            };
          }),
        ),
      );
    });

  const loadAttributesOptions = () =>
    new Promise((resolve) => {
      resolve(
        getCustomAttributes().then((res) =>
          res.attributes
            .filter((a) => a.dataType === 2)
            .map((p) => {
              return {
                value: p.name,
                label: p.name,
                dataType: p.dataType,
                valueOptions: p.values,
              };
            }),
        ),
      );
    });

  useEffect(() => {
    if (isPopupOpen) {
      setCategories(filter.categories);
      setActiveIncludeAttribute(null);
      setActiveIncludeAttributeValues([]);
      setIncludedFilters(filter.includedFilters);
      setMissingContent(filter.missingContent);
      setMinLowestQuality(filter.minLowestQuality);
      setMaxLowestQuality(filter.maxLowestQuality);
    }
  }, [isPopupOpen]);

  return (
    <>
      <ButtonIcon
        id="filterOptions"
        icon="filter"
        transform="shrink-3 down-2"
        color="falcon-default"
        size="sm"
        className="mx-2"
        onClick={() => setPopupOpen((v) => !v)}
      >
        Filter
      </ButtonIcon>
      <Popover
        trigger="legacy"
        placement="bottom"
        target="filterOptions"
        isOpen={isPopupOpen}
      >
        <PopoverBody>
          <FormGroup>
            <FilterSelect
              label="Product Categories"
              placeholder="Select categories..."
              value={categories}
              onChange={(value) => {
                setCategories(value);
              }}
              loadOptions={loadCategoriesOptions}
              isMulti
            />
          </FormGroup>

          <FormGroup>
            <FilterSelect
              id="includedattributes"
              label="Product Attributes"
              placeholder="Select attribute..."
              onChange={handleAttributeChange}
              loadOptions={loadAttributesOptions}
              value={[activeIncludeAttribute]}
              defaultOptions={true}
            />
            {activeIncludeAttribute &&
              activeIncludeAttribute.dataType === 2 && (
                <>
                  <Row form>
                    <Col md={8}>
                      <FilterSelect
                        id="includedattributevalues"
                        placeholder="Select values..."
                        label=""
                        onChange={handleSelectIncludedAttributeValue}
                        value={activeIncludeAttributeValues}
                        defaultOptions={true}
                        isMulti={true}
                        options={activeIncludeAttribute.valueOptions.map(
                          (val) => {
                            return { value: val, label: val };
                          },
                        )}
                      />
                    </Col>
                    <Col>
                      <Button onClick={handleAddStringAttribute}>Add</Button>
                    </Col>
                  </Row>
                </>
              )}
            {includedFilters && includedFilters.length > 0 && (
              <>
                <FilterSelect
                  id="selectedincludedattributes"
                  label=""
                  onChange={handleChangeIncludedFilters}
                  value={includedFilters}
                  isMulti={true}
                  isCreatable={true}
                />
              </>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Only products missing content</Label>
            <CustomInput
              type="select"
              id="missingcontent"
              onChange={({ target }) => setMissingContent(target.value)}
            >
              <option value="">Select a content type...</option>
              <option
                value="description"
                selected={missingContent === 'description'}
              >
                Description (from catalog)
              </option>
              {contentTypeOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  selected={missingContent === opt.value}
                >
                  {opt.label}
                </option>
              ))}
            </CustomInput>
          </FormGroup>
          <FormGroup>
            <Label for="minQuality">Minimum Lowest Quality</Label>
            <Input
              type="number"
              name="minLowestQuality"
              id="minLowestQuality"
              min="0"
              max="100"
              value={minLowestQuality}
              onChange={({ target }) => setMinLowestQuality(target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="minQuality">Maximum Lowest Quality</Label>
            <Input
              type="number"
              name="maxLowestQuality"
              id="maxLowestQuality"
              min="0"
              max="100"
              value={maxLowestQuality}
              onChange={({ target }) => setMaxLowestQuality(target.value)}
            />
          </FormGroup>

          <FormGroup className="d-flex justify-content-end">
            <Button
              color="secondary"
              size="sm"
              className="mr-2"
              onClick={() => setPopupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={() => {
                setFilter({
                  categories,
                  includedFilters,
                  missingContent,
                  minLowestQuality,
                  maxLowestQuality,
                });
                setPopupOpen(false);
              }}
            >
              Apply
            </Button>
          </FormGroup>
        </PopoverBody>
      </Popover>
    </>
  );
};

const imageFormatter = (value, row) =>
  value ? (
    <img
      className="img-fluid rounded"
      src={value}
      alt={row.name}
      style={{ maxHeight: 80, maxWidth: 120 }}
    />
  ) : (
    <FontAwesomeIcon icon={faGift} size="5x"></FontAwesomeIcon>
  );

const linkFormatter = (value, row) => (
  <Link href={`/catalog/${row.sku}`}>{value}</Link>
);

const handleLabelsChanged = async (sku, labels) => {
  await updateProductLabels(sku, labels);
  toast.success(`Labels updated for '${sku}'`, {
    theme: 'colored',
  });
};

const labelsFormatter = (labels, row, rowIndex) => {
  return (
    <>
      <LabelPicker
        uId={rowIndex}
        labels={labels}
        itemId={row.sku}
        onLabelsChanged={handleLabelsChanged}
        productLabel={true}
      ></LabelPicker>
    </>
  );
};

const columns = [
  {
    dataField: 'image_url',
    text: 'Image',
    formatter: imageFormatter,
    classes: 'border-0 align-middle text-center',
    headerClasses: 'border-0',
    sort: false,
    width: 200,
  },
  {
    dataField: 'sku',
    text: 'SKU',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
    width: 150,
    formatter: linkFormatter,
  },
  {
    dataField: 'name',
    text: 'Name',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
    formatter: linkFormatter,
  },
  {
    dataField: 'category',
    text: 'Category',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
  },
  {
    dataField: 'labels',
    text: 'Labels',
    formatter: labelsFormatter,
    classes: 'border-0 align-middle fs-0',
    headerClasses: 'border-0',
    sort: false,
  },
];

const CatalogTable = ({
  filter,
  categories,
  includedFilters,
  missingContent,
  minLowestQuality,
  maxLowestQuality,
  currentPage,
  pageSize,
  setCurrentPage,
  setPageSize,
}) => {
  const {
    status,
    isLoading: isCatalogLoading,
    data: catalogResult,
  } = useGetProductsWithFilters({
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
    keyword: filter,
    categories: categories.map((category) => category.value),
    includedFilters: includedFilters.map((filter) => filter.value),
    missingContent: missingContent,
    minLowestQuality: minLowestQuality,
    maxLowestQuality: maxLowestQuality,
  });

  return (
    <>
      {status === 'success' && catalogResult && catalogResult.success && (
        <PaginatedDataTable
          data={catalogResult.products || []}
          columns={columns}
          totalCount={catalogResult.totalCount}
          keyField="sku"
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      )}
      {isCatalogLoading && <Loader />}
    </>
  );
};

const ListingsFilterPopover = ({ filter, setFilter }) => {
  const [marketplace, setMarketplace] = useState(
    (filter.marketplace || []).map((v) => ({ value: v, label: v })),
  );
  const [minQuality, setMinQuality] = useState(filter.minQuality);
  const [maxQuality, setMaxQuality] = useState(filter.maxQuality);
  const [isPopupOpen, setPopupOpen] = useState(false);

  const { data: listingSources } = useGetOrganizationListingSources();
  const listingSourceOptions = (listingSources?.listingSources || []).map(
    (s) => ({ value: s, label: s }),
  );

  useEffect(() => {
    if (isPopupOpen) {
      setMarketplace(
        (filter.marketplace || []).map((v) => ({ value: v, label: v })),
      );
      setMinQuality(filter.minQuality);
      setMaxQuality(filter.maxQuality);
    }
  }, [isPopupOpen]);

  return (
    <>
      <ButtonIcon
        id="filterOptions"
        icon="filter"
        transform="shrink-3 down-2"
        color="falcon-default"
        size="sm"
        className="mx-2"
        onClick={() => setPopupOpen((v) => !v)}
      >
        Filter
      </ButtonIcon>
      <Popover
        trigger="legacy"
        placement="bottom"
        target="filterOptions"
        isOpen={isPopupOpen}
      >
        <PopoverBody>
          <FormGroup>
            <FilterSelect
              label="Marketplace"
              placeholder="Select Marketplace..."
              value={marketplace}
              onChange={(value) => {
                setMarketplace(value);
              }}
              options={listingSourceOptions}
              isMulti
            />
          </FormGroup>
          <FormGroup>
            <Label for="minQuality">Minimum Quality</Label>
            <Input
              type="number"
              name="minQuality"
              id="minQuality"
              min="0"
              max="100"
              value={minQuality}
              onChange={({ target }) => setMinQuality(target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="maxQuality">Maximum Quality</Label>
            <Input
              type="number"
              name="maxQuality"
              id="maxQuality"
              min="0"
              max="100"
              value={maxQuality}
              onChange={({ target }) => setMaxQuality(target.value)}
            />
          </FormGroup>
          <FormGroup className="d-flex justify-content-end">
            <Button
              color="secondary"
              size="sm"
              className="mr-2"
              onClick={() => setPopupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={() => {
                setFilter({
                  marketplace: marketplace.map(({ value }) => value),
                  minQuality,
                  maxQuality,
                });
                setPopupOpen(false);
              }}
            >
              Apply
            </Button>
          </FormGroup>
        </PopoverBody>
      </Popover>
    </>
  );
};

function ViewListings() {
  const router = useRouter();
  const [squery, setSQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const isMountedRef = useRef(false);
  const [sortBy, setSortBy] = useState('lowest');
  const [filterOptions, setFilterOptions] = useStateWithCallback({
    marketplace: null,
    minQuality: null,
    maxQuality: null,
  });
  const [downloadURL, setDownloadURL] = useState(null);
  const [filterChanged, setFilterChanged] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isFiltersSetRef = useRef(false);
  const [averageScore, setAverageScore] = useState(undefined);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const exportingListing = async () => {
    const res = await exportListings(
      filter,
      filterOptions.marketplace,
      filterOptions.minQuality,
      filterOptions.maxQuality,
    );
    if (res.success && res.downloadUrl) {
      //trigger download
      setDownloadURL(res.downloadUrl);
    } else {
      setDownloadURL(null);
      setIsDownloadModalOpen((v) => !v);
      toast.error('Unable to download content: ' + res.message);
    }
  };

  useEffect(() => {
    setFilterChanged(true);
    setDownloadURL(null);
  }, [
    filter,
    filterOptions.marketplace,
    filterOptions.minQuality,
    filterOptions.maxQuality,
  ]);

  useEffect(() => {
    if (isDownloadModalOpen && filterChanged) {
      setFilterChanged(false);
      exportingListing();
    }
  }, [isDownloadModalOpen, filterChanged]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const debouncedChangeFilter = debounce((query) => {
    setFilter(query);
  }, 1000);

  useEffect(() => {
    isFiltersSetRef.current = false;
    const { query } = router;
    const currentFilters = { ...filterOptions };
    let filterOptionChanged = false;

    const queryMarketplace =
      (query.marketplace &&
        (Array.isArray(query.marketplace)
          ? query.marketplace
          : [query.marketplace])) ||
      [];
    if (!compareArray(queryMarketplace, currentFilters.marketplace)) {
      currentFilters.marketplace = queryMarketplace;
      filterOptionChanged = true;
    }
    if (query.minQuality !== currentFilters.minQuality) {
      currentFilters.minQuality = query.minQuality;
      filterOptionChanged = true;
    }
    if (query.maxQuality !== currentFilters.maxQuality) {
      currentFilters.maxQuality = query.maxQuality;
      filterOptionChanged = true;
    }

    if (filterOptionChanged) {
      setFilterOptions(currentFilters, () => {
        isFiltersSetRef.current = true;
      });
    } else {
      isFiltersSetRef.current = true;
    }

    if (query.filter !== currentPage.filter) {
      setFilter(query.filter || '');
    }
    if (query.currentPage !== currentPage) {
      setCurrentPage(query.currentPage || 1);
    }
    if (query.pageSize !== pageSize) {
      setPageSize(query.pageSize || 25);
    }
    if (query.sortBy !== sortBy) {
      setSortBy(query.sortBy || 'lowest');
    }
  }, [router]);

  useEffect(() => {
    if (isMountedRef.current && isFiltersSetRef.current) {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          view: 'listings',
          filter,
          marketplace:
            filterOptions.marketplace?.length > 0
              ? filterOptions.marketplace
              : null,
          minQuality: filterOptions.minQuality,
          maxQuality: filterOptions.maxQuality,
          currentPage: currentPage !== 1 ? currentPage : undefined,
          pageSize: pageSize !== 25 ? pageSize : undefined,
          sortBy: sortBy || 'lowest',
        },
        [undefined, null, ''],
      );

      if (!isEqual(newQuery, query)) {
        router.push({
          query: newQuery,
        });
      }
    }
  }, [
    currentPage,
    pageSize,
    filter,
    sortBy,
    filterOptions.marketplace,
    filterOptions.minQuality,
    filterOptions.maxQuality,
  ]);

  return (
    <>
      <FalconCardHeader title="Listings" light={false}>
        <div className="d-flex align-items-center">
          {averageScore !== 'undefined' && !isNaN(averageScore) && (
            <CardSummary
              title="Average Listing Score"
              color={averageScore < 80 ? 'warning' : 'success'}
              className="mb-0 mx-1"
              style={{
                width: 240,
                height: 50,
                textAlign: 'left',
              }}
              size="sm"
            >
              {+averageScore}
            </CardSummary>
          )}
          <InputGroup>
            <ListingsFilterPopover
              filter={filterOptions}
              setFilter={setFilterOptions}
            />
            &nbsp;&nbsp;
            <InputGroupAddon addonType="prepend">
              <InputGroupText>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroupText>
            </InputGroupAddon>
            <Input
              placeholder="Search..."
              type="text"
              onChange={({ target }) => debouncedChangeFilter(target.value)}
            ></Input>
            &nbsp; &nbsp;
            <CustomInput
              type="select"
              id="sortBy"
              value={sortBy}
              onChange={({ target }) => setSortBy(target.value)}
            >
              <option value="lowest">Sort: Lowest quality score</option>
              <option value="highest">Sort: Highest quality score</option>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="title">Sort: Title A-Z</option>
              <option value="titlereverse">Sort: Title Z-A</option>
            </CustomInput>
            &nbsp;&nbsp;
            <Dropdown
              direction="down"
              isOpen={isDropdownOpen}
              toggle={() => setIsDropdownOpen((v) => !v)}
            >
              <DropdownToggle className="btn btn-falcon-default">
                <FontAwesomeIcon icon={faEllipsisH} />
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem onClick={() => setIsDownloadModalOpen(true)}>
                  Export
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </InputGroup>
        </div>
      </FalconCardHeader>
      <CardBody className="p-0">
        <ListingsTable
          filter={filter}
          marketplace={filterOptions.marketplace}
          minQuality={filterOptions.minQuality}
          maxQuality={filterOptions.maxQuality}
          sortBy={sortBy}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setAverageScore={setAverageScore}
        />
      </CardBody>
      <DownloadModal
        title="Exporting Listing"
        isOpen={isDownloadModalOpen}
        toggle={() => setIsDownloadModalOpen((v) => !v)}
        downloadURL={downloadURL}
      />
    </>
  );
}

function CatalogPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(router.query.view || 'products');

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const { query } = router;

    if (query.view !== activeTab) {
      setActiveTab(query.view || 'products');
    }
  }, [router]);

  useEffect(() => {
    if (isMountedRef.current) {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          ...query,
          view: activeTab,
        },
        [undefined, null, ''],
      );

      if (!isEqual(newQuery, query)) {
        router.push({
          query: newQuery,
        });
      }
    }
  }, [activeTab]);

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  return (
    <Card>
      <Nav tabs>
        <NavItem className="cursor-pointer">
          <NavLink
            className={classNames({ active: activeTab === 'products' })}
            onClick={() => {
              toggle('products');
            }}
          >
            Products
          </NavLink>
        </NavItem>
        <NavItem className="cursor-pointer">
          <NavLink
            className={classNames({ active: activeTab === 'listings' })}
            onClick={() => {
              toggle('listings');
            }}
          >
            Listings
          </NavLink>
        </NavItem>
      </Nav>
      {activeTab === 'products' ? (
        <ViewProducts />
      ) : activeTab === 'listings' ? (
        <ViewListings />
      ) : null}
    </Card>
  );
}

export default requireAuth(CatalogPage);
