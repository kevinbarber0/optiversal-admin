import React from 'react';
import Link from 'next/link';
import { useGetListings } from '@util/api';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift } from '@fortawesome/free-solid-svg-icons';
import {
  UncontrolledPopover,
  PopoverHeader,
  PopoverBody,
  Row,
  Col,
} from 'reactstrap';
import { getScoreBackground } from '@helpers/listing';
import { useEffect } from 'react';

const columns = [
  {
    dataField: 'image',
    text: 'Image',
    classes: 'border-0 align-middle text-center',
    headerClasses: 'border-0',
    sort: false,
    formatter: (_, row) => {
      const images = row.productData?.productData?.images;
      if (images && images.length > 0) {
        const image = images[0][Object.keys(images[0])[0]];
        return (
          <img
            className="img-fluid rounded"
            src={image}
            style={{ maxHeight: 80, maxWidth: 120 }}
          />
        );
      } else {
        return <FontAwesomeIcon icon={faGift} size="5x"></FontAwesomeIcon>;
      }
    },
  },
  {
    dataField: 'sku',
    text: 'SKU',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
    formatter: (_, row) => {
      return (
        <Link
          href={`/catalog/${row.productId}?marketplace=${row.sourceId}`}
          className="font-weight-semi-bold"
          legacyBehavior
        >
          <a>{row.productId}</a>
        </Link>
      );
    },
  },
  {
    dataField: 'title',
    text: 'Name',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
    formatter: (_, row) => {
      return (
        <Link
          href={`/catalog/${row.productId}?marketplace=${row.sourceId}`}
          className="font-weight-semi-bold"
          legacyBehavior
        >
          <a>{row.productData?.productData?.title}</a>
        </Link>
      );
    },
  },
  {
    dataField: 'sourceId',
    text: 'Marketplace',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
  },
  {
    dataField: 'externalId',
    text: 'Marketplace ID',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
  },
  {
    dataField: 'quality',
    text: 'Quality',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
    formatter: (_, row) => {
      const score = row.analyticsData.score;
      const color = getScoreBackground(score);

      return (
        <div
          style={{
            backgroundColor: color,
            color: 'white',
            borderRadius: 4,
            textAlign: 'center',
            fontSize: 20,
            padding: 16,
          }}
        >
          {score}
        </div>
      );
    },
  },
  {
    dataField: 'issues',
    text: 'Issues',
    classes: 'border-0 align-middle',
    headerClasses: 'border-0',
    sort: false,
    formatter: (_, row, index) => {
      const productErrors = row.analyticsData.dataAnalysis?.errors || [];
      const reviewErrors = row.analyticsData.reviewAnalysis?.errors || [];
      const qaErrors = row.analyticsData.qaAnalysis?.errors || [];
      const allErrors = [...productErrors, ...reviewErrors, ...qaErrors];

      const productWarnings = row.analyticsData.dataAnalysis?.warnings || [];
      const reviewWarnings = row.analyticsData.reviewAnalysis?.warnings || [];
      const qaWarnings = row.analyticsData.qaAnalysis?.warnings || [];
      const allWarnings = [
        ...productWarnings,
        ...reviewWarnings,
        ...qaWarnings,
      ];

      return (
        <>
          <Link
            href={`/catalog/${row.productId}?marketplace=${row.sourceId}`}
            className="font-weight-semi-bold"
            legacyBehavior
          >
            <a id={'issues' + index}>
              {allErrors.length + allWarnings.length} Issues
            </a>
          </Link>
          <UncontrolledPopover
            placement="left"
            trigger="hover"
            target={'issues' + index}
          >
            <PopoverHeader>{row.keyword}</PopoverHeader>
            <PopoverBody>
              <Row noGutters={true}>
                <Col>
                  <ul className="mb-0">
                    {[
                      ...allErrors.map((e) => e.label),
                      ...allWarnings.map((e) => e.label),
                    ].map((el, key) => (
                      <li key={index}>{el}</li>
                    ))}
                  </ul>
                </Col>
              </Row>
            </PopoverBody>
          </UncontrolledPopover>
        </>
      );
    },
  },
];

const ListingsTable = ({
  filter,
  sortBy,
  marketplace,
  minQuality,
  maxQuality,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  setAverageScore,
}) => {
  const {
    status,
    isLoading: pagesLoading,
    data: listingsResult,
  } = useGetListings(
    (currentPage - 1) * pageSize,
    pageSize,
    filter,
    sortBy,
    marketplace,
    minQuality,
    maxQuality,
  );

  useEffect(() => {
    setAverageScore(Math.round(listingsResult?.averageScore));
  }, [listingsResult?.averageScore]);

  return (
    <>
      {status === 'success' && listingsResult && listingsResult.success && (
        <>
          <PaginatedDataTable
            keyField="listingId"
            data={listingsResult.listings}
            totalCount={listingsResult.totalCount}
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

export default ListingsTable;
