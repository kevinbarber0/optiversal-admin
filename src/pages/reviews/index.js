import React, { useRef, useState, useEffect } from 'react';
import { requireAuth } from '@util/auth.js';
import ReviewTable from '@components/ReviewTable';
import FilterSelect from '@components/FilterSelect';
import FalconCardHeader from '@components/common/FalconCardHeader';
import {
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  CustomInput,
  Button,
  Card,
  CardBody,
  Popover,
  PopoverBody,
  FormGroup,
  Label,
  Row,
  Col,
} from 'reactstrap';
import ButtonIcon from '@components/common/ButtonIcon';
import DatePicker from '@components/DatePicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import { filterNullValues, compareArray } from '@helpers/utils';
import { isEqual, debounce } from 'lodash';
import { loadSkusOptions } from '@util/load-options';
import useStateWithCallback from 'hooks/useStateWithCallback';

function ViewReviews() {
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [filterOptions, setFilterOptions] = useStateWithCallback({
    skus: null,
    startDate: null,
    endDate: null,
    minRating: null,
    maxRating: null,
  });
  const router = useRouter();
  const isMountedRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const debouncedChangeKeyword = debounce((query) => {
    setKeyword(query);
  }, 500);

  useEffect(() => {
    const { query } = router;
    const currentFilters = { ...filterOptions };
    let filterOptionChanged = false;

    const querySkus =
      (query.skus && (Array.isArray(query.skus) ? query.skus : [query.skus])) ||
      null;

    if (
      !compareArray(
        querySkus,
        currentFilters.skus?.map(({ value }) => value),
      )
    ) {
      currentFilters.skus = (querySkus || []).map((value) => ({
        value: value,
        label: value,
      }));
      filterOptionChanged = true;
    }

    if (
      query.startDate !== currentFilters.startDate?.toISOString().slice(0, 10)
    ) {
      currentFilters.startDate = query.startDate
        ? new Date(query.startDate)
        : null;
      filterOptionChanged = true;
    }

    if (query.endDate !== currentFilters.endDate?.toISOString().slice(0, 10)) {
      currentFilters.endDate = query.endDate ? new Date(query.endDate) : null;
      filterOptionChanged = true;
    }

    if (query.minRating !== currentFilters.minRating) {
      currentFilters.minRating = query.minRating || '';
      filterOptionChanged = true;
    }

    if (query.maxRating !== currentFilters.maxRating) {
      currentFilters.maxRating = query.maxRating || '';
      filterOptionChanged = true;
    }

    if (filterOptionChanged === true) {
      setFilterOptions(currentFilters);
    }

    if (query.keyword !== keyword) {
      setKeyword(query.keyword || '');
    }
    if (query.sortBy !== sortBy) {
      setSortBy(query.sortBy || 'newest');
    }
    if (query.currentPage !== currentPage) {
      setCurrentPage(query.currentPage || 1);
    }
    if (query.pageSize !== pageSize) {
      setPageSize(query.pageSize || 25);
    }
  }, [router]);

  useEffect(() => {
    if (isMountedRef.current === false) {
      isMountedRef.current = true;
    } else {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          skus:
            filterOptions.skus && filterOptions.skus.length
              ? filterOptions.skus.map(({ value }) => value)
              : null,
          startDate:
            filterOptions.startDate?.toISOString().slice(0, 10) || null,
          endDate: filterOptions.endDate?.toISOString().slice(0, 10) || null,
          minRating: filterOptions.minRating,
          maxRating: filterOptions.maxRating,
          keyword,
          sortBy: sortBy !== 'newest' ? sortBy : undefined,
          currentPage: currentPage !== 1 ? currentPage : undefined,
          pageSize: pageSize !== 25 ? pageSize : undefined,
        },
        [undefined, null, ''],
      );
      if (!isEqual(newQuery, query)) {
        if (Object.keys(newQuery).length > 0) {
          router.push({
            query: newQuery,
          });
        } else {
          router.push(router.pathname);
        }
      }
    }
  }, [
    filterOptions.skus,
    filterOptions.startDate,
    filterOptions.endDate,
    filterOptions.minRating,
    filterOptions.maxRating,
    keyword,
    sortBy,
    currentPage,
    pageSize,
  ]);

  const handleSortChange = (sortField, sortOrder) => {
    if (sortField === 'submissionTime') {
      if (sortOrder === 'asc') setSortBy('oldest');
      else setSortBy('newest');
    } else if (sortField === 'rating') {
      if (sortOrder === 'asc') setSortBy('lowestrating');
      else setSortBy('highestrating');
    }
  };

  return (
    <>
      <div>
        <div className="fs--1 p-0">
          <Card className="mb-3">
            <FalconCardHeader title="Reviews " light={false}>
              <InputGroup>
                <Filter
                  filter={filterOptions}
                  setFilter={setFilterOptions}
                  loadSkusOptions={loadSkusOptions}
                />
                &nbsp; &nbsp;
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>
                    <FontAwesomeIcon icon={faSearch} />
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  placeholder="Search..."
                  type="text"
                  defaultValue={keyword}
                  onChange={({ target }) =>
                    debouncedChangeKeyword(target.value)
                  }
                ></Input>
                &nbsp;
                <CustomInput
                  type="select"
                  id="sortBy"
                  value={sortBy}
                  onChange={({ target }) => setSortBy(target.value)}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="highestrating">Sort: Highest Rating</option>
                  <option value="lowestrating">Sort: Lowest Rating</option>
                  <option value="mosthelpful">Sort: Most Helpful</option>
                  <option value="leasthelpful">Sort: Least Helpful</option>
                </CustomInput>
              </InputGroup>
            </FalconCardHeader>
            <CardBody className="p-0">
              <ReviewTable
                skus={filterOptions.skus}
                startDate={filterOptions.startDate}
                endDate={filterOptions.endDate}
                minRating={filterOptions.minRating}
                maxRating={filterOptions.maxRating}
                keyword={keyword}
                sortBy={sortBy}
                handleSortChange={handleSortChange}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Filter({ filter, setFilter, loadSkusOptions }) {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [minRating, setMinRating] = useState(null);
  const [maxRating, setMaxRating] = useState(null);
  const [skus, setSkus] = useState([]);

  useEffect(() => {
    if (isPopupOpen) {
      setSkus(filter.skus);
      setStartDate(filter.startDate);
      setEndDate(filter.endDate);
      setMinRating(filter.minRating);
      setMaxRating(filter.maxRating);
    }
  }, [isPopupOpen, filter]);

  const handleMinRating = (val) => {
    if (val < 0) setMinRating(0);
    else if (val > 5) setMinRating(5);
    else setMinRating(val);
  };

  const handleMaxRating = (val) => {
    if (val < 0) setMaxRating(0);
    else if (val > 5) setMaxRating(5);
    else setMaxRating(val);
  };

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
              label="Skus"
              placeholder="Select skus..."
              value={skus}
              onChange={(value) => {
                setSkus(value);
              }}
              defaultOptions
              loadOptions={loadSkusOptions}
              isClearable={true}
              isMulti
            />
          </FormGroup>

          <FormGroup>
            <Label for="lastEdited">Edit Date Range</Label>
            <Row>
              <Col>
                <DatePicker
                  placeholderText="Start date"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  scrollableYearDropdown
                  selected={startDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={new Date()}
                  onChange={(date) => {
                    setStartDate(date);
                  }}
                  isClearable={true}
                />
              </Col>
              -
              <Col>
                <DatePicker
                  placeholderText="End date"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  scrollableYearDropdown
                  selected={endDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  maxDate={new Date()}
                  onChange={(date) => setEndDate(date)}
                  isClearable={true}
                />
              </Col>
            </Row>
          </FormGroup>
          <FormGroup>
            <Label for="lastEdited">Review Rating</Label>
            <Row>
              <Col>
                <Input
                  type="number"
                  id="minimpression"
                  placeholder="Min"
                  min="0"
                  max="5"
                  value={minRating}
                  onKeyPress={(event) => {
                    if (!/[0-5]/.test(event.key)) {
                      event.preventDefault();
                    }
                  }}
                  onChange={({ target }) => handleMinRating(target.value)}
                ></Input>
              </Col>
              -
              <Col>
                <Input
                  type="number"
                  id="maximpression"
                  placeholder="Max"
                  min="0"
                  max="5"
                  value={maxRating}
                  onKeyPress={(event) => {
                    if (!/[0-5]/.test(event.key)) {
                      event.preventDefault();
                    }
                  }}
                  onChange={({ target }) => handleMaxRating(target.value)}
                ></Input>
              </Col>
            </Row>
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
                  skus,
                  startDate,
                  endDate,
                  minRating,
                  maxRating,
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
}

export default requireAuth(ViewReviews);
