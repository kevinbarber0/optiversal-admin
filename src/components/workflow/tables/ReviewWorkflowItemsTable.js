import React, { useState } from 'react';
import { useGetCompletedWorkflowItems, resetWorkflowItem } from '@util/api';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import { toast } from 'react-toastify';
import { dateFormatter } from '@helpers/formatter';
import { WorkflowType, WorkflowItemAction } from '@util/enum';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { isEmpty } from 'lodash';
import { capitalize } from '@helpers/utils';

const WorkflowItemContent = ({ value }) => {
  const [isActive, setIsActive] = useState(false);
  const handleClick = (event) => {
    setIsActive((current) => !current);
  };

  return (
    <span
      className={`cursor-pointer review-content truncated  ${
        isActive ? '' : 'row-1'
      }`}
      onClick={handleClick}
    >
      {JSON.stringify(value)}
    </span>
  );
};

const ReviewWorkflowItemsTable = ({ workflowId, workflowType }) => {
  const [working, setWorking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('dateCompleted_desc');
  const {
    status,
    isLoading: wkItemsLoading,
    data: wkItems,
  } = useGetCompletedWorkflowItems(
    workflowId,
    (currentPage - 1) * pageSize,
    pageSize,
    sortBy,
  );

  const contentFormatter = (value, row) => {
    if (!value) return;
    return <WorkflowItemContent value={value} />;
  };

  const workflowActionFormatter = (value, row) => {
    if (!value) return;
    if (value === WorkflowItemAction.APPROVE) return 'Accept';
    else return capitalize(value);
  };

  const onClickReset = async (wkItemId) => {
    setWorking(true);
    const res = await resetWorkflowItem(workflowId, wkItemId);
    if (res.success) {
      toast.success('Workflow item reset!', {
        theme: 'colored',
      });
    } else {
      toast.error('Unable to reset the selected item: ' + res.message, {
        theme: 'colored',
      });
    }
    setWorking(false);
  };

  const handleSortChange = (sortField, sortOrder) => {
    const oldField = sortBy.split('_')[0];
    const newOrder = sortField !== oldField ? 'desc' : sortOrder;
    setSortBy(sortField + '_' + newOrder);
  };

  const defaultSortedBy = [
    {
      dataField: sortBy.split('_')[0],
      order: sortBy.split('_')[1], // or desc
    },
  ];

  const actionFormatter = (k, row, index) => {
    return (
      <>
        {row && workflowType === WorkflowType.File && (
          <Button
            size="sm"
            color="falcon-primary"
            transform="shrink-3"
            className="mr-1"
            onClick={(e) => {
              onClickReset(row.itemId);
            }}
            disabled={working}
          >
            <FontAwesomeIcon icon={faUndo} />
          </Button>
        )}
      </>
    );
  };

  let inputColumns = [];
  let tableData = [];

  if (wkItems?.items?.length > 0) {
    let inputContentKeys = null;
    if (!isEmpty(wkItems.items[0]?.inputContent)) {
      inputContentKeys = Object.keys(wkItems.items[0].inputContent);
      inputColumns = inputContentKeys.map((key) => ({
        dataField: key,
        text: capitalize(key),
        formatter: contentFormatter,
        classes: 'border-0 align-middle',
        headerClasses: 'border-0',
        sort: false,
      }));

      tableData = wkItems.items.map((item) => {
        inputContentKeys.forEach((key) => {
          item[key] = item?.inputContent?.[key];
        });

        return item;
      });
    }
  }

  if (
    workflowType === WorkflowType.Page ||
    workflowType === WorkflowType.Idea
  ) {
    inputColumns.push({
      dataField: 'workflowAction',
      text: 'Action',
      formatter: workflowActionFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    });
  } else {
    inputColumns.push({
      dataField: 'outputContent',
      text: 'Output',
      formatter: contentFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    });
  }

  const columns = [
    ...inputColumns,
    {
      dataField: 'dateCompleted',
      text: 'Date Completed',
      formatter: (v) => dateFormatter(v),
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: true,
    },
    {
      dataField: 'completedBy',
      text: 'Completed By',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'actions',
      text: ' ',
      formatter: actionFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
  ];

  return (
    <>
      {wkItems && wkItems.success && (
        <PaginatedDataTable
          keyField="itemId"
          data={tableData}
          columns={columns}
          totalCount={wkItems.totalCount}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          handleSortChange={handleSortChange}
          defaultSorted={defaultSortedBy}
        />
      )}
      {wkItemsLoading && <Loader></Loader>}
    </>
  );
};

export default ReviewWorkflowItemsTable;
