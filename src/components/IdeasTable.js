import React from 'react';
import {
  Button,
  Row,
  UncontrolledPopover,
  PopoverHeader,
  PopoverBody,
} from 'reactstrap';
import ButtonIcon, { ForwardRefButtonIcon } from '@components/common/ButtonIcon';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import LabelPicker from '@components/LabelPicker';
import Link from 'next/link';
import {
  useGetSuggestions,
  updateSuggestionStatus,
  updateSuggestionLabels,
  useGetOrgDefaultTemlpate,
} from '@util/api';
import Loader from '@components/common/Loader';
import { SuggestionStatus } from '@util/enum';
import Product from '@components/e-commerce/product/ProductReview';
import { toast } from 'react-toastify';
import { Constants } from '@util/global';
import { dateFormatter } from '@helpers/formatter';
import { upperTitleize } from '@helpers/utils';

const keywordFormatter = (
  value,
  row,
  rowIndex,
  { workflowId, defaultTemplate },
) => {
  const url = workflowId
    ? `workflow/${workflowId}?keyword=${value}`
    : `/page/add?ct=${
        defaultTemplate || Constants.ProductAssortmentContentTemplateId
      }&keyword=${upperTitleize(value)}`;
  return (
    <>
      <Link href={url} className="font-weight-semi-bold" legacyBehavior>
        <a>{value}</a>
      </Link>
      {row.variants && row.variants.length > 1 && (
        <>
          <br />
          <small>
            Also: {row.variants.filter((v) => v !== value).join(', ')}
          </small>
        </>
      )}
    </>
  );
};

const handleDelete = async (keyword) => {
  await updateSuggestionStatus(keyword, SuggestionStatus.DELETED);
  toast.success(
    <>
      {keyword} deleted successfully
      <br />
      <Button
        onClick={(e) => {
          handleUndoDelete(keyword);
        }}
      >
        UNDO
      </Button>
    </>,
  );
};

const handleUndoDelete = async (keyword) => {
  await updateSuggestionStatus(keyword, SuggestionStatus.SUGGESTED);
  toast.success(`'${keyword}' restored successfully`, {
    theme: 'colored',
  });
};

const handleLabelsChanged = async (keyword, labels) => {
  await updateSuggestionLabels(keyword, labels);
  toast.success(`Labels updated for '${keyword}'`, {
    theme: 'colored',
  });
};

const labelsFormatter = (labels, row, rowIndex) => {
  return (
    <>
      <LabelPicker
        uId={rowIndex}
        labels={labels}
        itemId={row.keyword}
        onLabelsChanged={handleLabelsChanged}
      ></LabelPicker>
    </>
  );
};

const actionFormatter = (k, row, index, { workflowId, defaultTemplate }) => {
  const url = workflowId
    ? `workflow/${workflowId}?keyword=${row.keyword}`
    : `/page/add?ct=${
        defaultTemplate || Constants.ProductAssortmentContentTemplateId
      }&keyword=${upperTitleize(row.keyword)}`;

  return (
    <>
      {row && (
        <>
          <Link href={url}>
            <ForwardRefButtonIcon
              color="falcon-info"
              icon="search"
              iconAlign="right"
              transform="shrink-3"
              id={'btnReview' + index}
            />
          </Link>
          &nbsp; &nbsp;
          <ButtonIcon
            color="falcon-danger"
            icon="trash"
            iconAlign="right"
            transform="shrink-3"
            onClick={(e) => {
              handleDelete(row.keyword);
            }}
          ></ButtonIcon>
          <UncontrolledPopover
            placement="left"
            trigger="hover"
            target={'btnReview' + index}
          >
            <PopoverHeader>{row.keyword}</PopoverHeader>
            <PopoverBody>
              <Row noGutters={true}>
                {row.results &&
                  row.results.products &&
                  row.results.products.slice(0, 5).map((product, index) => (
                    <>
                      <Product
                        {...product}
                        key={product.productId}
                        index={index}
                      />
                      <br />
                    </>
                  ))}
              </Row>
            </PopoverBody>
          </UncontrolledPopover>
        </>
      )}
    </>
  );
};

const IdeasTable = ({
  setIsSelected,
  filter,
  importedOnly,
  minQuality,
  maxQuality,
  sortBy,
  selectedKeywords,
  setSelectedKeywords,
  handleSortChange,
  filterLabel,
  ideaWorkflow,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}) => {
  const {
    status,
    isLoading: suggestionsLoading,
    data: suggestionsResult,
  } = useGetSuggestions(
    (currentPage - 1) * pageSize,
    pageSize,
    filter,
    importedOnly,
    minQuality,
    maxQuality,
    filterLabel || '',
    ideaWorkflow,
    sortBy,
  );
  const { data: orgDTResult } = useGetOrgDefaultTemlpate();

  const columns = [
    {
      dataField: 'keyword',
      text: 'Keyword',
      formatter: keywordFormatter,
      formatExtraData: {
        workflowId: ideaWorkflow,
        defaultTemplate: orgDTResult?.defaultTemplate,
      },
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: true,
    },
    {
      dataField: 'dateAdded',
      text: 'Created',
      formatter: (v) => dateFormatter(v),
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: true,
    },
    {
      dataField: 'volume',
      text: 'Monthly Volume',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: true,
    },
    {
      dataField: 'labels',
      text: 'Labels',
      formatter: labelsFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'keywordaction',
      text: ' ',
      formatter: actionFormatter,
      formatExtraData: {
        workflowId: ideaWorkflow,
        defaultTemplate: orgDTResult?.defaultTemplate,
      },
      classes: 'border-0 align-right fs-0',
      headerClasses: 'border-0',
      sort: false,
    },
  ];

  const onSelect = (row, selected) => {
    if (setSelectedKeywords) {
      if (selected) {
        setSelectedKeywords([...selectedKeywords, row.keyword]);
        setIsSelected(true);
      } else {
        const newSel = selectedKeywords.filter((k) => k !== row.keyword);
        setSelectedKeywords(newSel);
        setIsSelected(newSel.length > 0);
      }
    }
  };

  const onSelectAll = (selected, rows) => {
    if (setSelectedKeywords) {
      if (selected) {
        setSelectedKeywords(rows.map((r) => r.keyword));
        setIsSelected(true);
      } else {
        setSelectedKeywords([]);
        setIsSelected(false);
      }
    }
  };

  const defaultSortedBy = [
    {
      dataField: sortBy.split('_')[0],
      order: sortBy.split('_')[1], // or desc
    },
  ];
  return (
    <>
      {status === 'success' &&
        suggestionsResult &&
        suggestionsResult.success && (
          <PaginatedDataTable
            data={suggestionsResult.suggestions || []}
            columns={columns}
            totalCount={suggestionsResult.totalCount}
            keyField="keyword"
            onSelect={onSelect}
            onSelectAll={onSelectAll}
            handleSortChange={handleSortChange}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            defaultSorted={defaultSortedBy}
          />
        )}
      {suggestionsLoading && <Loader />}
    </>
  );
};

export default IdeasTable;
