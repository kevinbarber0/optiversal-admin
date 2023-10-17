import React, { useState, useMemo } from 'react';
import {
  useGetPubPages,
  useGetImpPages,
  useGetMetrics,
  useGetSERPs,
} from '@util/api';
import Loader from '@components/common/Loader';
import { PageCard, MetricCard, SERPCard } from '@components/PeformanceCard';
import { Row, Col } from 'reactstrap';

const dataKeys = ['Clicks', 'Impressions', 'Position', 'CTR'];

const PerformanceTab = ({ filter }) => {
  const {
    status: pubPageStatus,
    isLoading: pubPageLoading,
    data: pubPageResult,
  } = useGetPubPages(filter);

  const {
    status: impPageStatus,
    isLoading: impPageLoading,
    data: impPageResult,
  } = useGetImpPages(filter);

  const {
    status: metricsStatus,
    isLoading: metricsLoading,
    data: metricsResult,
  } = useGetMetrics(filter);

  const {
    status: serpsStatus,
    isLoading: serpsLoading,
    data: serpsResult,
  } = useGetSERPs(filter);

  return (
    <>
      <>
        <Row noGutters>
          <Col lg="6">
            {pubPageStatus === 'success' &&
              pubPageResult &&
              pubPageResult.success && (
                <PageCard
                  pageResult={pubPageResult}
                  pageData={pubPageResult.pubPages[0].pg_data}
                  name="Published pages"
                />
              )}
            {pubPageLoading && <Loader></Loader>}
          </Col>
          <Col lg="6">
            {impPageStatus === 'success' && impPageResult && (
              <PageCard
                pageResult={impPageResult}
                pageData={impPageResult.impPages[0].pg_data}
                name="Pages with impressions"
              />
            )}
            {impPageLoading && <Loader></Loader>}
          </Col>
        </Row>
      </>
      <>
        {metricsStatus === 'success' && metricsResult && (
          <Row noGutters>
            {dataKeys.map((value, index) => (
              <Col lg="6" key={index}>
                <MetricCard name={value} metricsResult={metricsResult} />
              </Col>
            ))}
          </Row>
        )}
        {metricsLoading && <Loader></Loader>}
      </>
      <>
        <Row noGutters>
          <Col lg="6">
            {serpsStatus === 'success' &&
              serpsResult &&
              serpsResult.success && (
                <SERPCard serpsResult={serpsResult} name="SERP Distribution" />
              )}
            {serpsLoading && <Loader></Loader>}
          </Col>
        </Row>
      </>
    </>
  );
};

export default PerformanceTab;
