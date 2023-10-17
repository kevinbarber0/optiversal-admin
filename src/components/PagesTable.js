import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon, Button } from '@fortawesome/react-fontawesome';
import { Badge } from 'reactstrap';
import Link from 'next/link';
import { useGetPages, updatePageLabels, useOrgPageSettings } from '@util/api';
import Loader from '@components/common/Loader';
import { PageStatus } from '@util/enum';
import { toast } from 'react-toastify';
import LabelPicker from '@components/LabelPicker';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import { dateFormatter } from '@helpers/formatter';

import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/tooltip';

import { Modal, ModalBody } from 'reactstrap';
import moment from 'moment';
import { getPageLink } from '@helpers/page';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { isEmpty } from 'lodash';

const dateFormat = 'M/D';

const titleFormatter = (value, row, rowIndex, { workflowId, orgSettings }) => {
  const url = workflowId
    ? `workflow/${workflowId}?pageId=${row.pageId}`
    : `/page/${row.slug}`;
  const fullPath = getPageLink(row, orgSettings);
  return (
    <>
      <Link href={`${url}`} className="font-weight-semi-bold" legacyBehavior>
        <a>{value.trim()}</a>
      </Link>

      <br />
      <small>
        {row?.pageSettings?.pagePath
          ? row?.pageSettings?.pagePath + row?.slug
          : '/' + row?.slug}
      </small>
      <small>
        <Link href={fullPath} legacyBehavior>
          <a target="_blank" className="ml-2 p-0">
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              size="sm"
              className="fs--0 sm"
            />
          </a>
        </Link>
      </small>
    </>
  );
};

const statusFormatter = (status) => {
  let color = '';
  let icon = '';
  let text = '';
  switch (status) {
    case PageStatus.PUBLISHED:
      color = 'success';
      icon = 'check';
      text = 'Published';
      break;
    case PageStatus.QUALITYISSUE:
      color = 'warning';
      icon = 'stream';
      text = 'Quality Issue';
      break;
    case PageStatus.DELETED:
      color = 'danger';
      icon = 'trash';
      text = 'Deleted';
      break;
    default:
      color = 'secondary';
      icon = 'ban';
      text = 'Draft';
  }
  return (
    <>
      <Badge color={`soft-${color}`} className="rounded-capsule">
        {text}
        <FontAwesomeIcon icon={icon} transform="shrink-2" className="ml-1" />
      </Badge>
    </>
  );
};

const handleLabelsChanged = async (pageId, labels) => {
  await updatePageLabels(pageId, pageId, labels);
  toast.success(`Labels updated for page`);
};

const labelsFormatter = (labels, row) => {
  return (
    <>
      <LabelPicker
        uId={row.pageId}
        labels={labels}
        labelContext={row.labelContext}
        itemId={row.pageId}
        onLabelsChanged={handleLabelsChanged}
        allowEdit={false}
      ></LabelPicker>
    </>
  );
};

const serpFormatter = (serp, row) =>
  serp?.currentPosition && (
    <>
      <span>{serp.currentPosition}</span>
      <br />
      {serp?.currentPositionChange > 0 && (
        <Badge pill color="soft-success" className="fs--2">
          <FontAwesomeIcon icon="caret-up" className="mr-1" />
          {serp.currentPositionChange}
        </Badge>
      )}
      {serp?.currentPositionChange < 0 && (
        <Badge pill color="soft-warning" className="fs--2">
          <FontAwesomeIcon icon="caret-down" className="mr-1" />
          {serp.currentPositionChange}
        </Badge>
      )}
    </>
  );

const metricsFormatter = (metrics, row, rowIndex, { openChart }) => {
  if (!metrics) {
    return <></>;
  }

  const sortedMetrics = metrics.sort(
    (metric1, metric2) =>
      moment(metric1.start).unix() - moment(metric2.start).unix(),
  );
  const dataKeys = ['clicks']; //, 'ctr', 'impressions', 'position'];
  const weekNums = sortedMetrics.map(
    (metric) =>
      `${dateFormatter(metric.start, dateFormat)}-${dateFormatter(
        metric.end,
        dateFormat,
      )}`,
  );
  const series = dataKeys.map((key) => ({
    name: key,
    type: 'line',
    stack: 'Total',
    data: sortedMetrics.map((metric) => metric[key]),
    showSymbol: false,
    color:
      sortedMetrics[0][key] - sortedMetrics[sortedMetrics.length - 1][key] > 0
        ? '#EA5265'
        : '#63B969',
    areaStyle: {
      color:
        sortedMetrics[0][key] - sortedMetrics[sortedMetrics.length - 1][key] > 0
          ? '#FCECEE'
          : '#EDF7EE',
    },
  }));

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      top: 10,
      left: 0,
      right: 0,
      bottom: 0,
      containLabel: false,
    },
    xAxis: {
      show: false,
      type: 'category',
      boundaryGap: false,
      data: weekNums,
    },
    yAxis: {
      show: false,
      type: 'value',
    },
    series: series,
  };

  return (
    <div onClick={() => openChart(sortedMetrics)}>
      <ReactEchartsCore
        echarts={echarts}
        option={option}
        style={{ width: 300, height: 50 }}
      />
    </div>
  );
};

const PagesTable = ({
  setIsSelected,
  keyword,
  filters,
  sortBy,
  selectedPageIds,
  setSelectedPageIds,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  resultKey,
  handleSortChange,
}) => {
  const { status: orgSettingsStatus, data: orgSettings } = useOrgPageSettings();

  Object.keys(filters).forEach((key) => {
    if (!filters[key]) {
      delete filters[key];
    }
  });
  const pageParams = {
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
    sortBy,
  };
  if (!isEmpty(filters)) {
    pageParams.filters = filters;
  }
  if (!isEmpty(keyword)) {
    pageParams.keyword = keyword;
  }
  if (!isEmpty(resultKey)) {
    pageParams.resultKey = resultKey;
  }

  const {
    status,
    isLoading: pagesLoading,
    data: pagesResult,
  } = useGetPages(pageParams);

  const pageWorkflow = filters.pageWorkflow;
  const [chartData, setChartData] = useState(null);
  const chartOption = useMemo(() => {
    if (!chartData) return null;
    const dataKeys = ['clicks', 'ctr', 'impressions', 'position'];
    const weekNums = chartData.map(
      (metric) =>
        `${dateFormatter(metric.start, dateFormat)}-${dateFormatter(
          metric.end,
          dateFormat,
        )}`,
    );
    const series = dataKeys.map((key, index) => ({
      name: key,
      type: 'line',
      stack: 'Total',
      data: chartData.map((metric) => metric[key]),
      yAxisIndex: index,
    }));

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: dataKeys,
      },
      grid: {
        left: 10,
        right: 0,
        bottom: 0,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: weekNums,
      },
      yAxis: [
        {
          show: false,
          type: 'value',
        },
        {
          show: false,
          type: 'value',
        },
        {
          show: false,
          type: 'value',
        },
        {
          show: false,
          type: 'value',
        },
      ],
      series: series,
    };
  }, [chartData]);

  const onSelect = (row, selected) => {
    if (setSelectedPageIds) {
      if (selected) {
        setSelectedPageIds([...selectedPageIds, row.pageId]);
        setIsSelected(true);
      } else {
        const newSel = selectedPageIds.filter((id) => id !== row.pageId);
        setSelectedPageIds(newSel);
        setIsSelected(newSel.length > 0);
      }
    }
  };

  const onSelectAll = (selected, rows) => {
    if (setSelectedPageIds) {
      if (selected) {
        setSelectedPageIds(rows.map((r) => r.pageId));
        setIsSelected(true);
      } else {
        setSelectedPageIds([]);
        setIsSelected(false);
      }
    }
  };

  const onOpenChart = (chartOption) => {
    setChartData(chartOption);
  };

  const columns = [
    {
      dataField: 'title',
      text: 'Title',
      formatter: titleFormatter,
      formatExtraData: {
        workflowId: pageWorkflow?.value,
        orgSettings: orgSettings?.settings,
      },
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: true,
    },
    {
      dataField: 'contentTemplateName',
      text: 'Content Type',
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
      dataField: 'dateModified',
      text: 'Edited',
      formatter: (v) => dateFormatter(v),
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: true,
    },
    {
      dataField: 'status',
      text: 'Status',
      formatter: statusFormatter,
      classes: 'border-0 align-middle fs-0',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'labels',
      text: 'Labels',
      formatter: labelsFormatter,
      classes: 'border-0 align-middle fs-0',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'serp',
      classes: 'border-0 align-middle text-center',
      headerClasses: 'border-0',
      text: 'SERP',
      formatter: serpFormatter,
      sort: true,
    },
    {
      dataField: 'weeklyMetrics',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      text: 'Weekly Metrics',
      formatter: metricsFormatter,
      formatExtraData: {
        openChart: onOpenChart,
      },
      sort: true,
    },
    {
      dataField: 'action',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      text: '',
    },
  ];

  const defaultSortedBy = [
    {
      dataField:
        sortBy.split('_')[0] == 'clicks'
          ? 'weeklyMetrics'
          : sortBy.split('_')[0],
      order: sortBy.split('_')[1], // or desc
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
            onSelect={onSelect}
            onSelectAll={onSelectAll}
            handleSortChange={handleSortChange}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            defaultSorted={defaultSortedBy}
          />
        </>
      )}
      {pagesLoading && <Loader></Loader>}
      <Modal size="lg" isOpen={!!chartOption} toggle={() => setChartData(null)}>
        <ModalBody>
          {chartOption && (
            <ReactEchartsCore
              echarts={echarts}
              option={{
                ...chartOption,
                tooltip: {
                  trigger: 'axis',
                },
              }}
              style={{ height: 400 }}
            />
          )}
          {chartData && (
            <>
              <br />
              <strong>Queries: </strong>
              {[
                ...new Set(
                  chartData
                    .map((d) => d.queries)
                    .flat(2)
                    .filter((q) => q?.trim()?.length > 0),
                ),
              ].join(', ')}
            </>
          )}
        </ModalBody>
      </Modal>
    </>
  );
};

export default PagesTable;
