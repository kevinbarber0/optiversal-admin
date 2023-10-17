import { useCallback } from 'react';
import { Row, Col, Button, Input } from 'reactstrap';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory, {
  PaginationProvider,
} from 'react-bootstrap-table2-paginator';

/**
 *
 * @param data: Array of data to be displayed
 * @param columns: Column Options to be displayed Refer to https://github.com/react-bootstrap-table/react-bootstrap-table2/blob/master/docs/columns.md
 * @param keyField: identifier field in data
 * @param config
 */
const DataTable = ({
  data,
  columns,
  keyField,
  totalCount,
  config: { pageOptions } = { pageOptions: [25, 50, 100] },
  onSelect,
  onSelectAll,
  handleSortChange,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  ...rest
}) => {
  const handleNextPage = useCallback(
    ({ page, onPageChange }) =>
      () => {
        onPageChange(+page + 1);
      },
    [],
  );
  const handlePrevPage = useCallback(
    ({ page, onPageChange }) =>
      () => {
        onPageChange(+page - 1);
      },
    [],
  );
  const handleTableChange = useCallback(
    (_type, { page, sizePerPage, sortField, sortOrder }) => {
      if (_type == 'sort' && handleSortChange && sortField && sortOrder) {
        handleSortChange(sortField, sortOrder);
      }

      if (_type == 'pagination' && currentPage !== page) {
        setCurrentPage(page);
      }

      if (sizePerPage !== pageSize) {
        setPageSize(sizePerPage);
      }
    },
    [currentPage, pageSize, setCurrentPage, setPageSize, handleSortChange],
  );

  const options = {
    custom: true,
    page: currentPage,
    sizePerPage: pageSize,
    totalSize: totalCount ? totalCount : data.length,
  };

  return (
    <PaginationProvider pagination={paginationFactory(options)}>
      {({ paginationProps, paginationTableProps }) => {
        const lastIndex = paginationProps.page * paginationProps.sizePerPage;
        return (
          <>
            <div className="table-responsive">
              <BootstrapTable
                bootstrap4
                keyField={keyField}
                data={data}
                columns={columns}
                selectRow={
                  onSelect && onSelectAll && selectRow(onSelect, onSelectAll)
                }
                remote
                bordered={false}
                classes="table-dashboard table-sm fs--1 border-bottom border-200 mb-0 table-dashboard-th-nowrap"
                rowClasses="btn-reveal-trigger border-top border-200"
                headerClasses="bg-200 text-900 border-y border-200"
                onTableChange={handleTableChange}
                {...paginationTableProps}
                {...rest}
              />
            </div>
            <Row noGutters className="px-1 py-3">
              <Col xs="1" className="pl-1 fs--1">
                <Input
                  type="select"
                  value={pageSize}
                  onChange={({ target }) => setPageSize(target.value)}
                >
                  {pageOptions.map((pageOption) => (
                    <option key={pageOption} value={pageOption}>
                      {pageOption}
                    </option>
                  ))}
                </Input>
              </Col>
              <Col className="pl-3 fs--1" style={{ paddingTop: 7 }}>
                <CustomTotal {...paginationProps} lastIndex={lastIndex} />
              </Col>
              <Col xs="auto" className="pr-3">
                <Button
                  color={paginationProps.page === 1 ? 'light' : 'primary'}
                  size="sm"
                  onClick={handlePrevPage(paginationProps)}
                  disabled={paginationProps.page === 1}
                  className="px-4"
                >
                  Previous
                </Button>
                <Button
                  color={
                    lastIndex >= paginationProps.totalSize ? 'light' : 'primary'
                  }
                  size="sm"
                  onClick={handleNextPage(paginationProps)}
                  disabled={lastIndex >= paginationProps.totalSize}
                  className="px-4 ml-2"
                >
                  Next
                </Button>
              </Col>
            </Row>
          </>
        );
      }}
    </PaginationProvider>
  );
};

const CustomTotal = ({ sizePerPage, totalSize, page, lastIndex }) => (
  <span>
    {(page - 1) * sizePerPage + 1} to{' '}
    {lastIndex > totalSize ? totalSize : lastIndex} of {totalSize}
  </span>
);

const SelectRowInput = ({
  type,
  indeterminate,
  disabled,
  checked,
  rowIndex,
  rowKey,
}) => {
  return (
    <div className="custom-control custom-checkbox">
      <input
        type={type}
        className="custom-control-input"
        onChange={() => {}}
        ref={(input) => {
          if (input) input.indeterminate = indeterminate;
        }}
        disabled={disabled}
        checked={checked}
        rowindex={rowIndex}
        rowkey={rowKey}
      />
      <label className="custom-control-label" />
    </div>
  );
};

const selectRow = (onSelect, onSelectAll) => ({
  mode: 'checkbox',
  clickToSelect: false,
  selectionHeaderRenderer: ({ mode, ...rest }) => (
    <SelectRowInput type={mode} {...rest} />
  ),
  selectionRenderer: ({ mode, ...rest }) => (
    <SelectRowInput type={mode} {...rest} />
  ),
  headerColumnStyle: { border: 0, verticalAlign: 'middle' },
  selectColumnStyle: { border: 0, verticalAlign: 'middle' },
  onSelect: onSelect,
  onSelectAll: onSelectAll,
});

export default DataTable;
