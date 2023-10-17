import React, { useRef, useState, useEffect } from 'react';
import { requireAuth } from '@util/auth.js';
import IdeasTable from '@components/IdeasTable';
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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Media,
  FormGroup,
  Label,
} from 'reactstrap';
import ButtonIcon from '@components/common/ButtonIcon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import {
  bulkUpdateSuggestionStatus,
  uploadKeywordFile,
  bulkAddSuggestionLabel,
} from '@util/api';
import { SuggestionStatus } from '@util/enum';
import FalconDropzone from '@components/common/FalconDropzone';
import cloudUpload from '@assets/img/icons/cloud-upload.svg';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { filterNullValues, toBoolean } from '@helpers/utils';
import { isEqual, debounce } from 'lodash';
import { loadLabelsOptions, loadIdeaWorkflowOptions } from '@util/load-options';

function ViewIdeas() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('quality');

  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [action, setAction] = useState();
  const [isWorking, setIsWorking] = useState(false);
  const [bulkLabel, setBulkLabel] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    minQuality: 0,
    maxQuality: 10,
    importedOnly: false,
    filterLabel: null,
    ideaWorkflow: null,
  });
  const router = useRouter();
  const isMountedRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const debouncedChangeFilter = debounce((query) => {
    setFilter(query);
  }, 500);

  useEffect(() => {
    const { query } = router;
    const currentFilters = { ...filterOptions };
    let filterOptionChanged = false;

    if (toBoolean(query.importedOnly) !== currentFilters.importedOnly) {
      currentFilters.importedOnly = toBoolean(query.importedOnly) || false;
      filterOptionChanged = true;
    }
    if (query.minQuality !== currentFilters.minQuality) {
      currentFilters.minQuality = query.minQuality || 0;
      filterOptionChanged = true;
    }
    if (query.maxQuality !== currentFilters.maxQuality) {
      currentFilters.maxQuality = query.maxQuality || 10;
      filterOptionChanged = true;
    }
    if (query.filterLabel !== currentFilters.filterLabel?.value) {
      currentFilters.filterLabel =
        { label: query.filterLabel, value: query.filterLabel } || '';
      filterOptionChanged = true;
    }

    if (query.ideaWorkflow !== currentFilters.ideaWorkflow?.value) {
      currentFilters.ideaWorkflow = {
        label: query.ideaWorkflow,
        value: query.ideaWorkflow,
      };

      filterOptionChanged = true;
    }

    if (filterOptionChanged === true) {
      setFilterOptions(currentFilters);
    }

    if (query.filter !== filter) {
      setFilter(query.filter || '');
    }
    if (query.sortBy !== sortBy) {
      setSortBy(query.sortBy || 'quality');
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
          importedOnly:
            filterOptions.importedOnly !== false
              ? filterOptions.importedOnly
              : undefined,
          minQuality:
            filterOptions.minQuality !== 0
              ? filterOptions.minQuality
              : undefined,
          maxQuality:
            filterOptions.maxQuality !== 10
              ? filterOptions.maxQuality
              : undefined,
          filterLabel: filterOptions.filterLabel?.value,
          filter,
          ideaWorkflow: filterOptions.ideaWorkflow?.value,
          sortBy: sortBy !== 'quality' ? sortBy : undefined,
          currentPage: currentPage !== 1 ? currentPage : undefined,
          pageSize: pageSize !== 25 ? pageSize : undefined,
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
  }, [
    filterOptions.importedOnly,
    filterOptions.minQuality,
    filterOptions.maxQuality,
    filterOptions.filterLabel,
    filterOptions.ideaWorkflow,
    filter,
    sortBy,
    currentPage,
    pageSize,
  ]);

  const handleBulkAction = async () => {
    if (selectedKeywords && selectedKeywords.length > 0) {
      if (action === 'label') {
        if (!bulkLabel || !bulkLabel.value) {
          toast.error('You must select a label to apply', {
            theme: 'colored',
          });
          return;
        }
        setIsWorking(true);
        await bulkAddSuggestionLabel(selectedKeywords, bulkLabel.value);
        setIsWorking(false);
        toast.success(
          'Label successfully added to ' +
            selectedKeywords.length +
            ' keywords',
          {
            theme: 'colored',
          },
        );
      } else if (action === 'publish') {
        setIsWorking(true);
        await bulkUpdateSuggestionStatus(
          selectedKeywords,
          SuggestionStatus.PUBLISHED,
        );
        setIsWorking(false);
        toast.success(
          'Successfully published ' +
            selectedKeywords.length +
            ' keywords to pages',
        );
      } else if (action === 'delete') {
        setIsWorking(true);
        await bulkUpdateSuggestionStatus(
          selectedKeywords,
          SuggestionStatus.DELETED,
        );
        setIsWorking(false);
        toast.success(selectedKeywords.length + ' keywords deleted', {
          theme: 'colored',
        });
      }
    }
  };

  const handleUpload = async (files) => {
    setShowImportModal(false);
    var formData = new FormData();
    formData.append('file', files[0]);
    const res = await uploadKeywordFile(formData);
    if (res.success) {
      toast.success(
        'Your file has been uploaded and will be processed shortly',
        {
          theme: 'colored',
        },
      );
    } else {
      toast.error(res.message, {
        theme: 'colored',
      });
    }
  };

  const handleSortChange = (sortField, sortOrder) => {
    const oldField = sortBy.split('_')[0];
    const newOrder = sortField !== oldField ? 'asc' : sortOrder;
    setSortBy(sortField + '_' + newOrder);
  };

  return (
    <>
      <div>
        <div className="fs--1 p-0">
          <Card className="mb-3">
            <FalconCardHeader title="Content Ideas" light={false}>
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
                    <ButtonIcon
                      icon="file-import"
                      transform="shrink-3 down-2"
                      color="falcon-primary"
                      size="sm"
                      onClick={() => {
                        setShowImportModal(true);
                      }}
                    >
                      Import
                    </ButtonIcon>
                    &nbsp; &nbsp;
                    <Filter
                      filter={filterOptions}
                      setFilter={setFilterOptions}
                      loadLabelsOptions={loadLabelsOptions}
                      loadIdeaWorkflowOptions={loadIdeaWorkflowOptions}
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
                      onChange={({ target }) =>
                        debouncedChangeFilter(target.value)
                      }
                    ></Input>
                    &nbsp;
                    <CustomInput
                      type="select"
                      id="sortBy"
                      value={sortBy}
                      onChange={({ target }) => setSortBy(target.value)}
                    >
                      <option value="quality">Sort: Relevance</option>
                      <option value="dateAdded_desc">Sort: Newest</option>
                      <option value="dateAdded_asc">Sort: Oldest</option>
                      <option value="volume_desc">Sort: Highest Volume</option>
                      <option value="volume_asc">Sort: lowest Volume</option>
                      <option value="keyword_asc">Sort: Keyword A-Z</option>
                      <option value="keyword_desc">Sort: Keyword Z-A</option>
                    </CustomInput>
                  </InputGroup>
                </>
              )}
            </FalconCardHeader>
            <CardBody className="p-0">
              <IdeasTable
                setIsSelected={setIsSelected}
                filter={filter}
                selectedKeywords={selectedKeywords}
                sortBy={sortBy}
                minQuality={filterOptions.minQuality}
                maxQuality={filterOptions.maxQuality}
                importedOnly={filterOptions.importedOnly}
                setSelectedKeywords={setSelectedKeywords}
                handleSortChange={handleSortChange}
                filterLabel={filterOptions.filterLabel?.value}
                ideaWorkflow={filterOptions.ideaWorkflow?.value}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showImportModal}
        toggle={() => setShowImportModal(!showImportModal)}
      >
        <ModalHeader>Import Keyword Ideas</ModalHeader>
        <ModalBody>
          <FalconDropzone
            onChange={handleUpload}
            multiple={false}
            accept="text/*,.csv"
            placeholder={
              <>
                <Media className=" fs-0 mx-auto d-inline-flex align-items-center">
                  <img src={cloudUpload} alt="" width={25} className="mr-2" />
                  <Media>
                    <p className="fs-0 mb-0 text-700">Upload keyword file</p>
                  </Media>
                </Media>
                <p className="mb-0 w-75 mx-auto text-500">
                  Upload a .txt or .csv file containing one keyword per line
                </p>
              </>
            }
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setShowImportModal(false)}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function Filter({
  filter,
  setFilter,
  loadLabelsOptions,
  loadIdeaWorkflowOptions,
}) {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [minQuality, setMinQuality] = useState(0);
  const [maxQuality, setMaxQuality] = useState(10);
  const [importedOnly, setImportedOnly] = useState(false);
  const [filterLabel, setFilterLabel] = useState(null);
  const [ideaWorkflow, setIdeaWorkflow] = useState();

  useEffect(() => {
    if (isPopupOpen) {
      setMaxQuality(filter.maxQuality);
      setMinQuality(filter.minQuality);
      setImportedOnly(filter.importedOnly);
      setFilterLabel(filter.filterLabel);
      setIdeaWorkflow(filter.ideaWorkflow);
    }
  }, [isPopupOpen, filter]);

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
          <FormGroup className="form-check">
            <Input
              type="checkbox"
              name="check"
              id="importedOnly"
              checked={importedOnly}
              onChange={({ target }) => setImportedOnly(target.checked)}
            />
            <Label for="importedOnly" check>
              Imported keywords only
            </Label>
          </FormGroup>
          <FormGroup>
            <FilterSelect
              label="Label"
              placeholder="Select label..."
              value={filterLabel}
              onChange={(value) => {
                setFilterLabel(value);
              }}
              defaultOptions
              loadOptions={loadLabelsOptions}
              isClearable={true}
            />
          </FormGroup>

          <FormGroup>
            <FilterSelect
              label="Workflow"
              placeholder="Select a workflow..."
              value={ideaWorkflow}
              onChange={(value) => {
                setIdeaWorkflow(value);
              }}
              defaultOptions
              loadOptions={loadIdeaWorkflowOptions}
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
                setFilter({
                  minQuality,
                  maxQuality,
                  importedOnly,
                  filterLabel,
                  ideaWorkflow,
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

export default requireAuth(ViewIdeas);
