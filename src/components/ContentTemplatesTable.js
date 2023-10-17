import { useState } from 'react';
import Link from 'next/link';
import { useGetContentTemplates } from '@util/api';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import { dateFormatter } from '@helpers/formatter';

const linkFormatter = (value, row) => (
  <Link
    href={`/contenttemplate/${row.contentTemplateId}`}
    className="font-weight-semi-bold"
    legacyBehavior
  >
    <a>{value}</a>
  </Link>
);

const columns = [
  {
    dataField: 'contentTemplateId',
    text: 'ID',
    formatter: linkFormatter,
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
  },
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

const ContentTemplatesTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const {
    status,
    isLoading: contentTemplatesLoading,
    data: contentTemplatesResult,
  } = useGetContentTemplates((currentPage - 1) * pageSize, pageSize);

  return (
    <>
      {status === 'success' &&
        contentTemplatesResult &&
        contentTemplatesResult.success && (
          <>
            <PaginatedDataTable
              keyField="contentTemplateId"
              data={contentTemplatesResult.contentTemplates}
              columns={columns}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          </>
        )}
      {contentTemplatesLoading && <Loader></Loader>}
    </>
  );
};

export default ContentTemplatesTable;
