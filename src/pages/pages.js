import React, { useEffect, useRef, useState, useCallback } from 'react';
import classNames from 'classnames';
import { requireRoles, useAuth } from '@util/auth.js';
import PagesTable from '@components/PagesTable';
import PerformanceTab from '@components/PerformanceTab';
import FilterSelect from '@components/FilterSelect';
import CustomCollapse from '@components/CustomCollapse';
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
  Nav,
  NavItem,
  NavLink,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
} from 'reactstrap';
import FormGroupInput from '@components/common/FormGroupInput';
import ButtonIcon from '@components/common/ButtonIcon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faSearch } from '@fortawesome/free-solid-svg-icons';
import {
  bulkUpdatePageStatus,
  useGetContentTemplates,
  bulkAddPageLabel,
  useContentLabelSubscriptions,
  updateContentLabelSubscriptions,
  exportPages,
  bulkAddPageLabels,
} from '@util/api';
import { Frequency, PageStatus } from '@util/enum';
import { toast } from 'react-toastify';
import { getRouteRoles } from 'routes';
import { useRouter } from 'next/router';
import { compareArray, filterNullValues } from '@helpers/utils';
import { isEqual, debounce } from 'lodash';
import Loader from '@components/common/LoaderInline';
import { loadLabelsOptions, loadPageWorkflowOptions } from '@util/load-options';
import AccountPicker from '@components/AccountPicker';
import { getOrgId } from '@helpers/auth';
import DatePicker from '@components/DatePicker';
import useStateWithCallback from 'hooks/useStateWithCallback';
import DownloadModal from '@components/DownloadModal';
import * as XLSX from 'xlsx';

function PagesView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isSelected, setIsSelected] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('dateModified_desc');
  const [resultKey, setResultKey] = useState();
  const [selectedPageIds, setSelectedPageIds] = useState([]);
  const [action, setAction] = useState();
  const [isWorking, setIsWorking] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null);
  const [filterOptions, setFilterOptions] = useStateWithCallback({
    contentType: '',
    status: null,
    redirect: null,
    minQuality: null,
    maxQuality: null,
    labels: null,
    matchType: null,
    creators: null,
    startCreatDate: null,
    endCreatDate: null,
    editors: null,
    startEditDate: null,
    endEditDate: null,
    pagePath: null,
    minClicks: null,
    maxClicks: null,
    minImpressions: null,
    maxImpressions: null,
    minCTR: null,
    maxCTR: null,
    minPosition: null,
    maxPosition: null,
    minSerp: null,
    maxSerp: null,
    pageWorkflow: null,
    minSkus: null,
    maxSkus: null,
  });
  const [bulkLabel, setBulkLabel] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsModalVisible, setNotificationsModalVisible] =
    useState(false);
  const [filterChanged, setFilterChanged] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const router = useRouter();
  const isMountedRef = useRef(false);
  const isFiltersSetRef = useRef(false);
  const labelsFileRef = useRef(null);
  const [labelFile, setLabelFile] = useState();

  const handleBulkAction = async () => {
    if (selectedPageIds && selectedPageIds.length > 0) {
      if (action === 'label') {
        if (!bulkLabel || !bulkLabel.value) {
          toast.error('You must select a label to apply', { theme: 'colored' });
          return;
        }
        setIsWorking(true);
        await bulkAddPageLabel(selectedPageIds, bulkLabel.value);
        setIsWorking(false);
        toast.success(
          'Label successfully added to ' + selectedPageIds.length + ' pages',
          { theme: 'colored' },
        );
      } else if (action === 'publish') {
        setIsWorking(true);
        await bulkUpdatePageStatus(selectedPageIds, PageStatus.PUBLISHED);
        setIsWorking(false);
        toast.success(selectedPageIds.length + ' pages published', {
          theme: 'colored',
        });
      } else if (action === 'unpublish') {
        setIsWorking(true);
        await bulkUpdatePageStatus(selectedPageIds, PageStatus.DRAFT);
        setIsWorking(false);
        toast.success(selectedPageIds.length + ' pages unpublished', {
          theme: 'colored',
        });
      } else if (action === 'delete') {
        setIsWorking(true);
        await bulkUpdatePageStatus(selectedPageIds, PageStatus.DELETED);
        setIsWorking(false);
        toast.success(selectedPageIds.length + ' pages deleted', {
          theme: 'colored',
        });
      }
    }
  };

  const handleSortChange = (sField, sOrder) => {
    const sortField = sField == 'weeklyMetrics' ? 'clicks' : sField;
    const oldField = sortBy.split('_')[0];
    const newOrder = sortField !== oldField ? 'asc' : sOrder;
    setSortBy(sortField + '_' + newOrder);
  };

  const exportingPages = async () => {
    const res = await exportPages({
      keyword,
      resultKey,
      sortBy,
      filters: filterOptions,
    });
    if (res.success && res.downloadUrl) {
      //trigger download
      setFilterChanged(false);
      setDownloadURL(res.downloadUrl);
    } else {
      setDownloadURL(null);
      setIsDownloadModalOpen((v) => !v);
      toast.error('Unable to download content: ' + res.message, {
        theme: 'colored',
      });
    }
  };

  useEffect(() => {
    setFilterChanged(true);
    setDownloadURL(null);
  }, [keyword, filterOptions]);
  useEffect(() => {
    if (isDownloadModalOpen && filterChanged) {
      exportingPages();
    }
  }, [isDownloadModalOpen, filterChanged]);

  const debouncedChangeKeyword = debounce((query) => {
    setKeyword(query);
  }, 500);

  useEffect(() => {
    const { query } = router;
    isFiltersSetRef.current = false;
    (async () => {
      const currentFilters = { ...filterOptions };
      let filterOptionChanged = false;
      if (query.status !== currentFilters.status) {
        currentFilters.status = query.status || null;
        filterOptionChanged = true;
      }
      if (query.contentType !== currentFilters.contentType) {
        currentFilters.contentType = query.contentType || '';
        filterOptionChanged = true;
      }
      if (query.redirect !== currentFilters.redirect) {
        currentFilters.redirect = query.redirect ? 1 : null;
        filterOptionChanged = true;
      }
      if (query.minQuality !== currentFilters.minQuality) {
        currentFilters.minQuality = query.minQuality || '';
        filterOptionChanged = true;
      }
      if (query.maxQuality !== currentFilters.maxQuality) {
        currentFilters.maxQuality = query.maxQuality || '';
        filterOptionChanged = true;
      }
      if (query.matchType !== currentFilters.matchType) {
        currentFilters.matchType = query.matchType ? 1 : null;
        filterOptionChanged = true;
      }
      const queryLabels =
        (query.labels &&
          (Array.isArray(query.labels) ? query.labels : [query.labels])) ||
        null;

      if (
        !compareArray(
          queryLabels,
          currentFilters.filterLabel?.map(({ value }) => value),
        )
      ) {
        currentFilters.filterLabel = queryLabels?.map((value) => ({
          value: value,
          label: value,
        }));
        filterOptionChanged = true;
      }

      const queryCreators =
        (query.creators &&
          (Array.isArray(query.creators)
            ? query.creators
            : [query.creators])) ||
        null;
      if (
        !compareArray(
          queryCreators,
          currentFilters.creators?.map(({ value }) => value),
        )
      ) {
        currentFilters.creators = queryCreators?.map((value) => ({
          label: value,
          value: value,
        }));
        filterOptionChanged = true;
      }

      if (query.startCreatDate !== currentFilters.startCreatDate) {
        currentFilters.startCreatDate = query?.startCreatDate;
        filterOptionChanged = true;
      }

      if (query.endCreatDate !== currentFilters.endCreatDate) {
        currentFilters.endCreatDate = query?.endCreatDate;
        filterOptionChanged = true;
      }

      const queryEditors =
        (query.editors &&
          (Array.isArray(query.editors) ? query.editors : [query.editors])) ||
        null;
      if (
        !compareArray(
          queryEditors,
          currentFilters.editors?.map(({ value }) => value),
        )
      ) {
        currentFilters.editors = queryEditors?.map((value) => ({
          label: value,
          value: value,
        }));
        filterOptionChanged = true;
      }

      if (query.startEditDate !== currentFilters.startEditDate) {
        currentFilters.startEditDate = query?.startEditDate;
        filterOptionChanged = true;
      }

      if (query.endEditDate !== currentFilters.endEditDate) {
        currentFilters.endEditDate = query?.endEditDate;
        filterOptionChanged = true;
      }

      if (query.pagePath !== currentFilters.pagePath) {
        currentFilters.pagePath = query.pagePath || '';
        filterOptionChanged = true;
      }

      if (query.minClicks !== currentFilters.minClicks) {
        currentFilters.minClicks = query.minClicks || '';
        filterOptionChanged = true;
      }
      if (query.maxClicks !== currentFilters.maxClicks) {
        currentFilters.maxClicks = query.maxClicks || '';
        filterOptionChanged = true;
      }

      if (query.minImpressions !== currentFilters.minImpressions) {
        currentFilters.minImpressions = query.minImpressions || '';
        filterOptionChanged = true;
      }
      if (query.maxImpressions !== currentFilters.maxImpressions) {
        currentFilters.maxImpressions = query.maxImpressions || '';
        filterOptionChanged = true;
      }

      if (query.minCTR !== currentFilters.minCTR) {
        currentFilters.minCTR = query.minCTR || '';
        filterOptionChanged = true;
      }
      if (query.maxCTR !== currentFilters.maxCTR) {
        currentFilters.maxCTR = query.maxCTR || '';
        filterOptionChanged = true;
      }

      if (query.minPosition !== currentFilters.minPosition) {
        currentFilters.minPosition = query.minPosition || '';
        filterOptionChanged = true;
      }
      if (query.maxPosition !== currentFilters.maxPosition) {
        currentFilters.maxPosition = query.maxPosition || '';
        filterOptionChanged = true;
      }

      if (query.minSerp !== currentFilters.minSerp) {
        currentFilters.minSerp = query.minSerp || '';
        filterOptionChanged = true;
      }
      if (query.maxSerp !== currentFilters.maxSerp) {
        currentFilters.maxSerp = query.maxSerp || '';
        filterOptionChanged = true;
      }

      if (query.pageWorkflow !== currentFilters.pageWorkflow?.value) {
        currentFilters.pageWorkflow = {
          label: query.pageWorkflow,
          value: query.pageWorkflow,
        };

        filterOptionChanged = true;
      }

      if (query.minSkus !== currentFilters.minSkus) {
        currentFilters.minSkus = query.minSkus;
        filterOptionChanged = true;
      }

      if (query.maxSkus !== currentFilters.maxSkus) {
        currentFilters.maxSkus = query.maxSkus;
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

    if (query.keyword !== keyword) {
      setKeyword(query.keyword || '');
    }
    if (query.sortBy !== sortBy) {
      setSortBy(query.sortBy || 'dateModified_desc');
    }
    if (query.currentPage !== currentPage) {
      setCurrentPage(query.currentPage || 1);
    }
    if (query.pageSize !== pageSize) {
      setPageSize(query.pageSize || 25);
    }
    if (query.resultKey !== resultKey) {
      setResultKey(query.resultKey);
    }
  }, [router]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current && isFiltersSetRef.current) {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          view: 'pages',
          keyword,
          status: filterOptions.status,
          contentType: filterOptions.contentType,
          redirect: filterOptions.redirect ? '1' : null,
          matchType: filterOptions.matchType ? '1' : null,
          minQuality:
            filterOptions.minQuality < 0
              ? 0
              : filterOptions.minQuality > 10
              ? 10
              : filterOptions.minQuality,
          maxQuality:
            filterOptions.maxQuality < 0
              ? 0
              : filterOptions.maxQuality > 10
              ? 10
              : filterOptions.maxQuality,
          labels:
            filterOptions.labels && filterOptions.labels.length > 1
              ? filterOptions.labels.map(({ value }) => value)
              : filterOptions.labels && filterOptions.labels.length === 1
              ? filterOptions.labels[0].value
              : null,
          creators:
            filterOptions.creators && filterOptions.creators.length > 1
              ? filterOptions.creators.map(({ value }) => value)
              : filterOptions.creators && filterOptions.creators.length === 1
              ? filterOptions.creators[0].value
              : null,
          startCreatDate: filterOptions.startCreatDate || null,
          endCreatDate: filterOptions.endCreatDate || null,
          editors:
            filterOptions.editors && filterOptions.editors.length > 1
              ? filterOptions.editors.map(({ value }) => value)
              : filterOptions.editors && filterOptions.editors.length === 1
              ? filterOptions.editors[0].value
              : null,
          startEditDate: filterOptions.startEditDate || null,
          endEditDate: filterOptions.endEditDate || null,
          pagePath: filterOptions.pagePath,
          sortBy: sortBy !== 'dateModified_desc' ? sortBy : undefined,
          currentPage: currentPage !== 1 ? currentPage : undefined,
          pageSize: pageSize !== 25 ? pageSize : undefined,
          resultKey: resultKey,
          minClicks: filterOptions.minClicks,
          maxClicks: filterOptions.maxClicks,
          minImpressions: filterOptions.minImpressions,
          maxImpressions: filterOptions.maxImpressions,
          minCTR: filterOptions.minCTR,
          maxCTR: filterOptions.maxCTR,
          minPosition: filterOptions.minPosition,
          maxPosition: filterOptions.maxPosition,
          minSerp: filterOptions.minSerp,
          maxSerp: filterOptions.maxSerp,
          pageWorkflow: filterOptions.pageWorkflow?.value,
          minSkus: filterOptions.minSkus,
          maxSkus: filterOptions.maxSkus,
        },
        [undefined, null, '', {}],
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
  }, [filterOptions, keyword, sortBy, currentPage, pageSize, resultKey]);

  const onLabelsUploadClick = () => {
    setLabelFile(null);
    setIsDropdownOpen(false);
    labelsFileRef.current.click();
  };

  const handleLabelUploadFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLabelFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      /* Parse data */
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_csv(ws, { header: 1 });

      let content = data.split(/\r\n|\n/);

      const headers = content[0].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);

      if (headers.length === 2) {
        if (!headers[0].includes('-')) content.shift();
        bulkUploadLabels(content);
      } else {
        setLabelFile(null);
        toast.error(
          'The file must be a .csv with exactly two columns: the slug and a comma-separated list of labels',
          { theme: 'colored' },
        );
        return;
      }
    };
    reader.readAsBinaryString(file);
  };

  const bulkUploadLabels = async (content) => {
    let headers = ['slug', 'labels'];

    const list = [];
    for (let i = 0; i < content.length; i++) {
      const row = content[i].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)|\t/);
      if (row && row.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            if (d[0] === '"') d = d.substring(1, d.length - 1);
            if (d[d.length - 1] === '"') d = d.substring(d.length - 2, 1);
          }

          if (headers[j] && d) {
            if (j === 1) d = d.split(',').map((element) => element.trim());
            obj[headers[j]] = d;
          }
        }

        // remove the blank rows
        if (Object.values(obj).filter((x) => x).length > 0) {
          list.push(obj);
        }
      } else {
        setLabelFile(null);
        toast.error(
          'The file must be a .csv with exactly two columns: the slug and a comma-separated list of labels',
          { theme: 'colored' },
        );
        return;
      }
    }

    const res = await bulkAddPageLabels(list);
    if (res.success) {
      toast.success('Labels Uploaded!', { theme: 'colored' });
    } else {
      toast.error('Failed labels uploading.', {
        theme: 'colored',
      });
    }
  };
  return (
    <Card>
      <FalconCardHeader title="Pages" light={false}>
        {isSelected ? (
          <InputGroup size="sm" className="input-group input-group-sm">
            <CustomInput
              type="select"
              id="bulk-select"
              onChange={({ target }) => setAction(target.value)}
            >
              <option value="">Bulk actions</option>
              <option value="label">Add Label</option>
              <option value="publish">Publish</option>
              <option value="unpublish">Unpublish</option>
              <option value="delete">Delete</option>
            </CustomInput>
            {action === 'label' && (
              <div style={{ width: 250 }}>
                <FilterSelect
                  label=""
                  placeholder="Select label..."
                  value={bulkLabel}
                  onChange={(value) => {
                    setBulkLabel(value);
                  }}
                  defaultOptions
                  loadOptions={loadLabelsOptions}
                  isClearable={true}
                  isCreatable={true}
                />
              </div>
            )}
            <Button
              color="falcon-default"
              size="sm"
              className="ml-2"
              onClick={handleBulkAction}
              disabled={isWorking}
            >
              {isWorking ? 'Processing...' : 'Apply'}
            </Button>
          </InputGroup>
        ) : (
          <>
            <InputGroup>
              <Filter
                filters={filterOptions}
                setFilters={setFilterOptions}
                loadLabelsOptions={loadLabelsOptions}
                loadPageWorkflowOptions={loadPageWorkflowOptions}
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
                onChange={({ target }) => debouncedChangeKeyword(target.value)}
              ></Input>
              &nbsp; &nbsp;
              <CustomInput
                type="select"
                id="sortBy"
                value={sortBy}
                onChange={({ target }) => setSortBy(target.value)}
              >
                <option value="dateModified_desc">Sort: Newest Edit</option>
                <option value="dateModified_asc">Sort: Oldest Edit</option>
                <option value="dateAdded_desc">Sort: Newest</option>
                <option value="dateAdded_asc">Sort: Oldest</option>
                <option value="serp_desc">Sort: Highest SERP</option>
                <option value="serp_asc">Sort: Lowest SERP</option>
                <option value="clicks_desc">Sort: Most Clicks</option>
                <option value="clicks_asc">Sort: Lowest Clicks</option>
                <option value="mostimpressions">Sort: Most Impressions</option>
                <option value="highestctr">Sort: Highest CTR</option>
                <option value="bestposition">Sort: Best Position</option>
                <option value="title_asc">Sort: Title A-Z</option>
                <option value="title_desc">Sort: Title Z-A</option>
                <option value="contentTemplateName_asc">
                  Sort: Content Type A-Z
                </option>
                <option value="contentTemplateName_desc">
                  Sort: Content Type Z-A
                </option>
              </CustomInput>
              &nbsp; &nbsp;
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
                  <DropdownItem onClick={onLabelsUploadClick}>
                    Label Upload
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => setNotificationsModalVisible(true)}
                  >
                    Notifications
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </InputGroup>
            <input
              type="file"
              id="file"
              ref={labelsFileRef}
              style={{ display: 'none' }}
              accept=".csv"
              onChange={handleLabelUploadFile}
            />
          </>
        )}
      </FalconCardHeader>
      <CardBody className="p-0">
        <PagesTable
          setIsSelected={setIsSelected}
          keyword={keyword}
          sortBy={sortBy}
          filters={filterOptions}
          resultKey={resultKey}
          selectedPageIds={selectedPageIds}
          setSelectedPageIds={setSelectedPageIds}
          handleSortChange={handleSortChange}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </CardBody>

      <PageLabelNotificationsModal
        isOpen={isNotificationsModalVisible}
        toggle={() => setNotificationsModalVisible((v) => !v)}
      />

      <DownloadModal
        title="Exporting pages"
        isOpen={isDownloadModalOpen}
        toggle={() => setIsDownloadModalOpen((v) => !v)}
        downloadURL={downloadURL}
      />
    </Card>
  );
}

function PageLabelNotificationsModal({ isOpen, toggle }) {
  const [labels, setLabels] = useState(null);

  const {
    data: contentLabelSubscription,
    isLoading: isContentLabelSubscriptionLoading,
  } = useContentLabelSubscriptions();

  useEffect(() => {
    if (contentLabelSubscription?.data) {
      setLabels(
        Object.keys(Frequency).reduce((acc, frequency) => {
          const newValue =
            contentLabelSubscription?.data[Frequency[frequency]]?.map((l) => ({
              label: l,
              value: l,
            })) || [];
          return { ...acc, [Frequency[frequency]]: newValue };
        }, {}),
      );
    } else {
      setLabels(
        Object.keys(Frequency).reduce(
          (acc, frequency) => ({ ...acc, [Frequency[frequency]]: [] }),
          {},
        ),
      );
    }
  }, [contentLabelSubscription]);

  const handleSave = useCallback(async () => {
    await updateContentLabelSubscriptions(
      Object.keys(labels).reduce(
        (acc, frequency) => ({
          ...acc,
          [frequency]: labels[frequency].map((v) => v.value),
        }),
        {},
      ),
    );
    toast.success('Content label subscriptions updated successfully.', {
      theme: 'colored',
    });
    toggle();
  }, [labels, toggle]);

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Label Notifications</ModalHeader>
      <ModalBody>
        {!labels || isContentLabelSubscriptionLoading ? (
          <Loader />
        ) : (
          Object.keys(Frequency).map((frequency) => (
            <FilterSelect
              key={frequency}
              classNamePrefix=""
              label={frequency}
              placeholder="Select labels..."
              value={labels[Frequency[frequency]]}
              onChange={(value) => {
                setLabels({
                  ...labels,
                  [Frequency[frequency]]: value,
                });
              }}
              defaultOptions
              loadOptions={loadLabelsOptions}
              isMulti
              isCreatable={true}
            />
          ))
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleSave}>
          Save
        </Button>
        &nbsp;
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function Filter({ filters, setFilters, loadLabelsOptions }) {
  const auth = useAuth();
  const orgId = getOrgId(auth);

  const [isPopupOpen, setPopupOpen] = useState(false);
  const [contentType, setContentType] = useState('');
  const [labels, setLabels] = useState([]);
  const [matchType, setMatchType] = useState(false);
  const [redirect, setRedirect] = useState(null);
  const [minQuality, setMinQuality] = useState(null);
  const [maxQuality, setMaxQuality] = useState(null);
  const [status, setStatus] = useState(null);
  const [creators, setCreators] = useState([]);
  const [startCreatDate, setStartCreatDate] = useState(null);
  const [endCreatDate, setEndCreatDate] = useState(null);
  const [editors, setEditors] = useState([]);
  const [startEditDate, setStartEditDate] = useState(null);
  const [endEditDate, setEndEditDate] = useState(null);
  const [pagePath, setPagePath] = useState(null);
  const [minClicks, setMinClicks] = useState(null);
  const [maxClicks, setMaxClicks] = useState(null);
  const [minImpressions, setMinImpressions] = useState(null);
  const [maxImpressions, setMaxImpressions] = useState(null);
  const [minCTR, setMinCTR] = useState(null);
  const [maxCTR, setMaxCTR] = useState(null);
  const [minPosition, setMinPosition] = useState(null);
  const [maxPosition, setMaxPosition] = useState(null);
  const [minSerp, setMinSerp] = useState(null);
  const [maxSerp, setMaxSerp] = useState(null);
  const [pageWorkflow, setPageWorkflow] = useState();
  const [minSkus, setMinSkus] = useState(null);
  const [maxSkus, setMaxSkus] = useState(null);

  const { data: contentTemplatesResult } = useGetContentTemplates(0, 100);

  useEffect(() => {
    if (isPopupOpen) {
      setContentType(filters.contentType);
      setStatus(filters.status);
      setRedirect(filters.redirect);
      setMaxQuality(filters.maxQuality);
      setMinQuality(filters.minQuality);
      setLabels(filters.labels);
      setMatchType(filters.matchType);
      setCreators(filters.creators);
      setStartCreatDate(filters.startCreatDate);
      setEndCreatDate(filters.endCreatDate);
      setEditors(filters.editors);
      setStartEditDate(filters.startEditDate);
      setEndEditDate(filters.endEditDate);
      setPagePath(filters.pagePath);
      setMinClicks(filters.minClicks);
      setMaxClicks(filters.maxClicks);
      setMinImpressions(filters.minImpressions);
      setMaxImpressions(filters.maxImpressions);
      setMinCTR(filters.minCTR);
      setMaxCTR(filters.maxCTR);
      setMinPosition(filters.minPosition);
      setMaxPosition(filters.maxPosition);
      setMinSerp(filters.minSerp);
      setMaxSerp(filters.maxSerp);
      setPageWorkflow(filters.pageWorkflow);
      setMinSkus(filters.minSkus);
      setMaxSkus(filters.maxSkus);
    }
  }, [isPopupOpen, filters]);

  const handleMinCTRChange = (val) => {
    if (val < 0) setMinCTR(0.0);
    else if (val > 1.0) setMinCTR(1.0);
    else setMinCTR(val);
  };

  const handleMaxCTRChange = (val) => {
    if (val < 0) setMaxCTR(0.0);
    else if (val > 1.0) setMaxCTR(1.0);
    else setMaxCTR(val);
  };

  const handleKeyPress = (e) => {
    if (e.charCode < 48 || e.charCode > 57) e.preventDefault();
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
            <Label for="statuses">Status</Label>
            <CustomInput
              type="select"
              id="status"
              value={status}
              onChange={({ target }) => setStatus(target.value)}
            >
              <option value="">Any Status</option>
              <option value="1">Published</option>
              <option value="0">Draft</option>
              <option value="3">Deleted</option>
            </CustomInput>
          </FormGroup>
          <FormGroup>
            <Label for="contentTypes">Content Type</Label>
            <CustomInput
              type="select"
              id="contentTypes"
              value={contentType}
              onChange={({ target }) => setContentType(target.value)}
            >
              <option value="">Any Content Type</option>
              {contentTemplatesResult &&
                contentTemplatesResult.contentTemplates &&
                contentTemplatesResult.contentTemplates.map((ct) => (
                  <option
                    value={ct.contentTemplateId}
                    key={ct.contentTemplateId}
                  >
                    {ct.name}
                  </option>
                ))}
            </CustomInput>
          </FormGroup>
          <FormGroup>
            <Label for="skus">SKUs</Label>
            <Row>
              <Col>
                <Input
                  type="number"
                  id="minSkus"
                  min="0"
                  step="1"
                  placeholder="Min"
                  value={minSkus}
                  onKeyPress={handleKeyPress}
                  onChange={({ target }) => setMinSkus(target.value)}
                ></Input>
              </Col>
              -
              <Col>
                <Input
                  type="number"
                  id="maxSkus"
                  min="0"
                  step="1"
                  placeholder="Max"
                  value={maxSkus}
                  onKeyPress={handleKeyPress}
                  onChange={({ target }) => setMaxSkus(target.value)}
                ></Input>
              </Col>
            </Row>
          </FormGroup>

          <FormGroup>
            <FilterSelect
              label="Label"
              placeholder="Select label..."
              value={labels}
              onChange={(value) => {
                setLabels(value);
              }}
              defaultOptions
              loadOptions={loadLabelsOptions}
              isClearable={true}
              isMulti
            />
          </FormGroup>
          <FormGroup>
            <div className="input-group">
              <FormGroup check inline>
                <Label check>
                  <Input
                    type="radio"
                    name="matchtype"
                    value={false}
                    checked={!matchType}
                    onChange={() => setMatchType(false)}
                  />
                  Match any
                </Label>
              </FormGroup>
              <FormGroup check inline>
                <Label check>
                  <Input
                    type="radio"
                    name="matchtype"
                    value={true}
                    checked={matchType}
                    onChange={() => setMatchType(true)}
                  />
                  Match all
                </Label>
              </FormGroup>
            </div>
          </FormGroup>

          <CustomCollapse
            title="Created"
            renderer={() => (
              <>
                <FormGroup>
                  <AccountPicker
                    label="Created By"
                    orgId={orgId}
                    accounts={creators}
                    onChange={(value) => {
                      setCreators(value);
                    }}
                    isMulti
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="createdAt">Created At</Label>
                  <Row>
                    <Col>
                      <DatePicker
                        placeholderText="Start date"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        scrollableYearDropdown
                        selected={
                          startCreatDate ? new Date(startCreatDate) : null
                        }
                        selectsStart
                        startDate={
                          startCreatDate ? new Date(startCreatDate) : null
                        }
                        endDate={endCreatDate ? new Date(endCreatDate) : null}
                        maxDate={null}
                        onChange={(date) => {
                          setStartCreatDate(date?.toISOString()?.slice(0, 10));
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
                        selected={endCreatDate ? new Date(endCreatDate) : null}
                        selectsEnd
                        startDate={
                          startCreatDate ? new Date(startCreatDate) : null
                        }
                        endDate={endCreatDate ? new Date(endCreatDate) : null}
                        minDate={
                          startCreatDate ? new Date(startCreatDate) : null
                        }
                        maxDate={null}
                        onChange={(date) =>
                          setEndCreatDate(date?.toISOString()?.slice(0, 10))
                        }
                        isClearable={true}
                      />
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}
          />

          <CustomCollapse
            title="Edited"
            renderer={() => (
              <>
                <FormGroup>
                  <AccountPicker
                    label="Edited By"
                    orgId={orgId}
                    accounts={editors}
                    onChange={(value) => {
                      setEditors(value);
                    }}
                    isMulti
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="lastEdited">Edited At</Label>
                  <Row>
                    <Col>
                      <DatePicker
                        placeholderText="Start date"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        scrollableYearDropdown
                        selected={
                          startEditDate ? new Date(startEditDate) : null
                        }
                        selectsStart
                        startDate={
                          startEditDate ? new Date(startEditDate) : null
                        }
                        endDate={endEditDate ? new Date(endEditDate) : null}
                        maxDate={null}
                        onChange={(date) => {
                          setStartEditDate(date?.toISOString()?.slice(0, 10));
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
                        selected={endEditDate ? new Date(endEditDate) : null}
                        selectsEnd
                        startDate={
                          startEditDate ? new Date(startEditDate) : null
                        }
                        endDate={endEditDate ? new Date(endEditDate) : null}
                        minDate={startEditDate ? new Date(startEditDate) : null}
                        maxDate={null}
                        onChange={(date) =>
                          setEndEditDate(date?.toISOString()?.slice(0, 10))
                        }
                        isClearable={true}
                      />
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}
          />

          <FormGroupInput
            id="pagePath"
            label="Page Path"
            placeholder="/shoes/hightops/"
            value={pagePath}
            onChange={(ev) => setPagePath(ev.target.value)}
          />

          <FormGroup className="form-check">
            <Input
              type="checkbox"
              name="redirect-filter"
              id="redirect-filter"
              defaultChecked={redirect}
              onChange={({ target }) => setRedirect(target.checked)}
            />
            <Label for="redirect-filter" check>
              Has Redirect URL
            </Label>
          </FormGroup>

          <CustomCollapse
            title="Metrics"
            renderer={() => (
              <>
                <FormGroup>
                  <Label for="statuses">SERP</Label>
                  <Row>
                    <Col>
                      <Input
                        type="number"
                        id="minSerp"
                        placeholder="Min"
                        value={minSerp}
                        onChange={({ target }) => setMinSerp(target.value)}
                      ></Input>
                    </Col>
                    -
                    <Col>
                      <Input
                        type="number"
                        id="maxSerp"
                        placeholder="Max"
                        value={maxSerp}
                        onChange={({ target }) => setMaxSerp(target.value)}
                      ></Input>
                    </Col>
                  </Row>
                </FormGroup>

                <FormGroup>
                  <Label for="statuses">Weekly Clicks</Label>
                  <Row>
                    <Col>
                      <Input
                        type="number"
                        id="minclicks"
                        placeholder="Min"
                        value={minClicks}
                        onChange={({ target }) => setMinClicks(target.value)}
                      ></Input>
                    </Col>
                    -
                    <Col>
                      <Input
                        type="number"
                        id="maxclicks"
                        placeholder="Max"
                        value={maxClicks}
                        onChange={({ target }) => setMaxClicks(target.value)}
                      ></Input>
                    </Col>
                  </Row>
                </FormGroup>

                <FormGroup>
                  <Label for="statuses">Weekly Impressions</Label>
                  <Row>
                    <Col>
                      <Input
                        type="number"
                        id="minimpression"
                        placeholder="Min"
                        value={minImpressions}
                        onChange={({ target }) =>
                          setMinImpressions(target.value)
                        }
                      ></Input>
                    </Col>
                    -
                    <Col>
                      <Input
                        type="number"
                        id="maximpression"
                        placeholder="Max"
                        value={maxImpressions}
                        onChange={({ target }) =>
                          setMaxImpressions(target.value)
                        }
                      ></Input>
                    </Col>
                  </Row>
                </FormGroup>

                <FormGroup>
                  <Label for="statuses">Weekly CTR</Label>
                  <Row>
                    <Col>
                      <Input
                        type="number"
                        id="minctr"
                        step="0.01"
                        min="0.00"
                        max="1.00"
                        placeholder="Min"
                        value={minCTR}
                        onChange={({ target }) =>
                          handleMinCTRChange(target.value)
                        }
                      ></Input>
                    </Col>
                    -
                    <Col>
                      <Input
                        type="number"
                        id="maxctr"
                        step="0.01"
                        min="0.00"
                        max="1.00"
                        placeholder="Max"
                        value={maxCTR}
                        onChange={({ target }) =>
                          handleMaxCTRChange(target.value)
                        }
                      ></Input>
                    </Col>
                  </Row>
                </FormGroup>

                <FormGroup>
                  <Label for="statuses">Weekly Position</Label>
                  <Row>
                    <Col>
                      <Input
                        type="number"
                        id="minposition"
                        placeholder="Min"
                        value={minPosition}
                        onChange={({ target }) => setMinPosition(target.value)}
                      ></Input>
                    </Col>
                    -
                    <Col>
                      <Input
                        type="number"
                        id="maxposition"
                        placeholder="Max"
                        value={maxPosition}
                        onChange={({ target }) => setMaxPosition(target.value)}
                      ></Input>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}
          />

          <FormGroup>
            <FilterSelect
              label="Workflow"
              placeholder="Select a workflow..."
              value={pageWorkflow}
              onChange={(value) => {
                setPageWorkflow(value);
              }}
              defaultOptions
              loadOptions={loadPageWorkflowOptions}
              isClearable={true}
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
                setFilters({
                  contentType,
                  status,
                  redirect,
                  maxQuality,
                  minQuality,
                  labels: labels?.length > 0 ? labels : null,
                  matchType,
                  creators: creators?.length > 0 ? creators : null,
                  startCreatDate,
                  endCreatDate,
                  editors: editors?.length > 0 ? editors : null,
                  startEditDate,
                  endEditDate,
                  pagePath,
                  minClicks,
                  maxClicks,
                  minImpressions,
                  maxImpressions,
                  minCTR,
                  maxCTR,
                  minPosition,
                  maxPosition,
                  minSerp,
                  maxSerp,
                  pageWorkflow,
                  minSkus,
                  maxSkus,
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

function PerformanceFilter({ filters, setFilters }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
  }, [filters]);

  useEffect(() => {
    setFilters({
      startDate,
      endDate,
    });
  }, [startDate, endDate]);

  return (
    <>
      <FormGroup>
        <Row>
          <Col>
            <DatePicker
              placeholderText="Start date"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              scrollableYearDropdown
              selected={startDate ? new Date(startDate) : null}
              selectsStart
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              maxDate={null}
              onChange={(date) => {
                setStartDate(date?.toISOString()?.slice(0, 10));
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
              selected={endDate ? new Date(endDate) : null}
              selectsEnd
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              minDate={startDate ? new Date(startDate) : null}
              maxDate={null}
              onChange={(date) => {
                setStartDate(date?.toISOString()?.slice(0, 10));
              }}
              isClearable={true}
            />
          </Col>
        </Row>
      </FormGroup>
    </>
  );
}

function PerformanceView() {
  const [filterOptions, setFilterOptions] = useStateWithCallback({
    startDate: null,
    endDate: null,
  });
  const router = useRouter();
  const isMountedRef = useRef(false);
  const isFiltersSetRef = useRef(false);

  useEffect(() => {
    const { query } = router;
    isFiltersSetRef.current = false;
    (async () => {
      const currentFilters = { ...filterOptions };
      let filterOptionChanged = false;

      if (query.startDate !== currentFilters.startDate) {
        currentFilters.startDate = query?.startDate;
        filterOptionChanged = true;
      }
      if (query.endDate !== currentFilters.endDate) {
        currentFilters.endDate = query?.endDate;
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
  }, [router]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current && isFiltersSetRef.current) {
      const { query } = router;
      const newQuery = filterNullValues(
        {
          view: 'performance',
          startDate: filterOptions.startDate,
          endDate: filterOptions.endDate,
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
  }, [filterOptions]);

  return (
    <Card>
      <FalconCardHeader title="Performance" light={false}>
        <InputGroup>
          <PerformanceFilter
            filters={filterOptions}
            setFilters={setFilterOptions}
          />
        </InputGroup>
      </FalconCardHeader>
      <CardBody className="p-0">
        <PerformanceTab filter={filterOptions} />
      </CardBody>
    </Card>
  );
}

function ViewPages() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(router.query.view || 'pages');

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
      setActiveTab(query.view || 'pages');
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
            className={classNames({ active: activeTab === 'pages' })}
            onClick={() => {
              toggle('pages');
            }}
          >
            Pages
          </NavLink>
        </NavItem>
        <NavItem className="cursor-pointer">
          <NavLink
            className={classNames({ active: activeTab === 'performance' })}
            onClick={() => {
              toggle('performance');
            }}
          >
            Performance
          </NavLink>
        </NavItem>
      </Nav>
      {activeTab === 'pages' ? (
        <PagesView />
      ) : activeTab === 'performance' ? (
        <PerformanceView />
      ) : null}
    </Card>
  );
}

export default requireRoles(ViewPages, getRouteRoles('/pages'));
