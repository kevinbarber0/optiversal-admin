import React from 'react';
import Link from 'next/link';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import ReviewItem from '@components/ReviewItem';
import { useGetReviews } from '@util/api';
import Loader from '@components/common/Loader';
import { Button } from 'reactstrap';
import { faHighlighter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dateFormatter } from '@helpers/formatter';

const reviewFormatter = (value, row) => <ReviewItem value={value} row={row} />;

const skuFormatter = (value) => (
  <Link href={`/catalog/${value[0]}`}>{value[0]}</Link>
);

const actionFormatter = (k, row, index) => {
  return (
    <>
      {row && (
        <Button
          tag="a"
          href={`/reviews/${row.reviewId}`}
          color="primary"
          size="sm"
        >
          <FontAwesomeIcon icon={faHighlighter} className="mr-1 fs--2" />
          Annotate
        </Button>
      )}
    </>
  );
};

const ReviewTable = ({
  skus,
  startDate,
  endDate,
  minRating,
  maxRating,
  keyword,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  sortBy,
  handleSortChange,
}) => {
  const columns = [
    {
      dataField: 'title',
      text: 'Review',
      formatter: reviewFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'productIds',
      text: 'SKU',
      formatter: skuFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'author',
      text: 'Author',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'submissionTime',
      text: 'Date',
      formatter: (v) => dateFormatter(v),
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: true,
    },
    {
      dataField: 'rating',
      text: 'Rating',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: true,
    },
    {
      dataField: 'annotate',
      text: ' ',
      formatter: actionFormatter,
      classes: 'border-0 align-right fs-0',
      headerClasses: 'border-0',
      sort: false,
    },
  ];

  const {
    status,
    isLoading: reviewLoading,
    data: reviewsResult,
  } = useGetReviews(
    (currentPage - 1) * pageSize,
    pageSize,
    skus ? skus.map(({ value }) => value) : null,
    startDate?.toISOString().substr(0, 10) || null,
    endDate?.toISOString().substr(0, 10) || null,
    minRating || null,
    maxRating || null,
    keyword,
    sortBy,
  );

  const defaultSortedBy = [
    {
      dataField:
        sortBy === 'newest' || sortBy === 'oldest'
          ? 'submissionTime'
          : sortBy === 'highestrating' || sortBy === 'lowestrating'
          ? 'rating'
          : null,
      order:
        sortBy === 'newest' || sortBy === 'highestrating'
          ? 'desc'
          : sortBy === 'oldest' || sortBy === 'lowestrating'
          ? 'asc'
          : null,
    },
  ];

  return (
    <>
      {status === 'success' && reviewsResult && reviewsResult.success && (
        <PaginatedDataTable
          data={reviewsResult.reviews || []}
          columns={columns}
          totalCount={reviewsResult.totalCount}
          keyField="reviewId"
          handleSortChange={handleSortChange}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          defaultSorted={defaultSortedBy}
        />
      )}
      {reviewLoading && <Loader />}
    </>
  );
};

export default ReviewTable;
