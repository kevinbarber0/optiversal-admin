import { useState } from 'react';
import Link from 'next/link';
import { useGetComponents } from '@util/api';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import { dateFormatter } from '@helpers/formatter';

const linkFormatter = (value, row) => (
  <Link
    href={`/component/${row.componentId}`}
    className="font-weight-semi-bold"
    legacyBehavior
  >
    <a>{value}</a>
  </Link>
);

const columns = [
  {
    dataField: 'name',
    text: 'Name',
    formatter: linkFormatter,
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
  },
  {
    dataField: 'dateAdded',
    text: 'Created',
    formatter: (v) => dateFormatter(v),
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
  },
  {
    dataField: 'dateModified',
    text: 'Last Edited',
    formatter: (v) => dateFormatter(v),
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
  },
  {
    dataField: 'action',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    text: '',
  },
];

const ComponentsTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const {
    status,
    isLoading: componentsLoading,
    data: componentsResult,
  } = useGetComponents((currentPage - 1) * pageSize, pageSize);

  return (
    <>
      {status === 'success' && componentsResult && componentsResult.success && (
        <>
          <PaginatedDataTable
            keyField="componentId"
            data={componentsResult.components}
            columns={columns}
            config={{ pageOptions: [25, 50, 100] }}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </>
      )}
      {componentsLoading && <Loader></Loader>}
    </>
  );
};

export default ComponentsTable;
