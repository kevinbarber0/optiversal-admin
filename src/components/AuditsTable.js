import React from 'react';
import { useGetAccountActions } from '@util/api';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import { dateTimeFormatter } from '@helpers/formatter';

const AuditsTable = ({
  filter,
  accounts,
  actionTypes,
  dateRange,
  sortBy,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}) => {
  const {
    status,
    isLoading: pagesLoading,
    data: pagesResult,
  } = useGetAccountActions({
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
    filter: filter,
    sortBy: sortBy,
    accounts: accounts ? accounts.map(({ value }) => value) : null,
    actionTypes: actionTypes ? actionTypes.map(({ value }) => value) : null,
    dateRange: dateRange,
  });

  const columns = [
    {
      dataField: 'accountEmail',
      text: 'Account Email',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'actionDetails',
      text: 'Action Type',
      classes: 'border-0 align-middle',
      formatter: (v) => v.actionType,
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'actionDetails',
      text: 'Description',
      classes: 'border-0 align-middle',
      formatter: (v) => v.description,
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'actionDetails',
      text: 'Item Id',
      classes: 'border-0 align-middle',
      formatter: (v) => v.itemId,
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'actionDetails',
      text: 'Item Name',
      classes: 'border-0 align-middle',
      formatter: (v) => v.itemName,
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'dateAdded',
      text: 'Date',
      classes: 'border-0 align-middle',
      formatter: (v) => dateTimeFormatter(v),
      headerClasses: 'border-0',
      sort: false,
    },
  ];

  return (
    <>
      {status === 'success' && pagesResult && pagesResult.success && (
        <>
          <PaginatedDataTable
            keyField="pageId"
            data={pagesResult.pages}
            totalCount={pagesResult.totalCount}
            columns={columns}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </>
      )}
      {pagesLoading && <Loader></Loader>}
    </>
  );
};

export default AuditsTable;
