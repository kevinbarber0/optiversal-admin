import React, { useMemo } from 'react';
import { Card, CardBody, Row, Col } from 'reactstrap';
import echarts from 'echarts/lib/echarts';
import ReactEchartsCore from 'echarts-for-react/lib/core';
import { getPosition, getGrays, themeColors, rgbaColor } from '@helpers/utils';
import FalconCardHeader from '@components/common/FalconCardHeader';
import moment from 'moment';
import { Alert } from 'reactstrap';

import 'echarts/lib/chart/bar';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/legend';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, Tooltip, ArcElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, ChartDataLabels);

function getFormatter(title, params) {
  const { name, value } = params[0];
  return `${name} <br> ${title} - ${value}`;
}

function sortData(data) {
  //console.log('sortdata:', data)
  return data.sort(
    (item1, item2) => moment(item1.date).unix() - moment(item2.date).unix(),
  );
}

const getOption = (data, title) => {
  const grays = getGrays(false);

  return {
    tooltip: {
      trigger: 'axis',
      padding: [7, 10],
      backgroundColor: grays.white,
      borderColor: grays['300'],
      borderWidth: 1,
      textStyle: { color: themeColors.dark },
      formatter(params) {
        return getFormatter(title, params);
      },
      transitionDuration: 0,
      position(pos, params, dom, rect, size) {
        return getPosition(pos, params, dom, rect, size);
      },
    },
    xAxis: {
      type: 'category',
      data: data ? sortData(data).map((d) => d.date) : null,
      boundaryGap: false,
      axisPointer: {
        lineStyle: {
          color: grays['300'],
          type: 'dashed',
        },
      },
      splitLine: { show: false },
      axisLine: {
        lineStyle: {
          color: rgbaColor('#000', 0.01),
          type: 'dashed',
        },
      },
      axisTick: { show: false },
      axisLabel: {
        color: grays['400'],
        margin: 15,
      },
    },
    yAxis: {
      type: 'value',
      axisPointer: { show: false },
      splitLine: {
        lineStyle: {
          color: grays['300'],
          type: 'dashed',
        },
      },
      boundaryGap: false,
      axisLabel: {
        show: true,
        color: grays['400'],
        margin: 15,
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        type: 'line',
        data: data ? sortData(data).map((d) => d.data) : null,
        lineStyle: { color: themeColors.primary },
        itemStyle: {
          color: grays['100'],
          borderColor: themeColors.primary,
          borderWidth: 2,
        },
        symbol: 'circle',
        symbolSize: 10,
        smooth: false,
        hoverAnimation: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: rgbaColor(themeColors.primary, 0.2),
              },
              {
                offset: 1,
                color: rgbaColor(themeColors.primary, 0),
              },
            ],
          },
        },
      },
    ],
    grid: {
      right: '20px',
      left: '10px',
      bottom: '10%',
      top: '5%',
      containLabel: true,
    },
  };
};

const getSERPChartData = (serps) => {
  return {
    labels: Array.from({ length: 10 }, (_, i) => i + 1).map((i) => `SERP-${i}`),
    datasets: [
      {
        label: '',
        data: Array.from({ length: 10 }, (_, i) => i + 1).map(
          (i) => serps.find((s) => s.serp === i)?.serp_count || 0,
        ),
        backgroundColor: [
          'rgba(0, 225, 0, 0.2)',
          'rgba(28, 225, 0, 0.2)',
          'rgba(56, 225, 0, 0.2)',
          'rgba(84, 225, 0, 0.2)',
          'rgba(112, 225, 0, 0.2)',
          'rgba(140, 225, 0, 0.2)',
          'rgba(168, 225, 0, 0.2)',
          'rgba(196, 225, 0, 0.2)',
          'rgba(224, 225, 0, 0.2)',
          'rgba(255, 225, 0, 0.2)',
        ],
        borderColor: [
          'rgba(0, 255, 0, 1)',
          'rgba(28, 255, 0, 1)',
          'rgba(56, 255, 0, 1)',
          'rgba(84, 255, 0, 1)',
          'rgba(112, 255, 0, 1)',
          'rgba(140, 255, 0, 1)',
          'rgba(168, 255, 0, 1)',
          'rgba(196, 255, 0, 1)',
          'rgba(224, 255, 0, 1)',
          'rgba(255, 255, 0, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

const getSERPChartOptions = () => {
  return {
    legend: {
      display: false,
    },
    plugins: {
      datalabels: {
        display: true,
        formatter: (val, ctx) => {
          if (val === 0) return '';
          //SERPs are in order from 1-10 so use index
          return `${ctx.dataIndex + 1}`;
        },
        color: '#000',
      },
    },
  };
};

export const MetricCard = ({ metricsResult, name }) => {
  const metricData = useMemo(() => {
    if (!metricsResult || !metricsResult.success) return null;

    const index =
      metricsResult.metrics[0][name.toLowerCase()]?.findIndex(
        (val) => val.data > 0,
      ) || 0;
    const data = metricsResult.metrics[0][name.toLowerCase()]?.slice(index);

    return data;
  }, [metricsResult]);

  return (
    <Card style={{ boxShadow: 'none' }}>
      <FalconCardHeader
        title={name}
        light={false}
        titleTag="h6"
      ></FalconCardHeader>

      <CardBody className="h-100">
        {metricsResult.success && metricData && (
          <ReactEchartsCore
            echarts={echarts}
            option={getOption(metricData, name)}
            style={{ minHeight: '18.75rem' }}
          />
        )}

        {metricsResult.success && !metricData && (
          <div style={{ minHeight: '18.75rem' }}></div>
        )}

        {!metricsResult.success && (
          <div className="p-3">
            <Alert color="warning">
              <div
                dangerouslySetInnerHTML={{ __html: metricsResult.message }}
              ></div>
            </Alert>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export const PageCard = ({ pageResult, pageData, name }) => {
  return (
    <Card style={{ boxShadow: 'none' }}>
      <FalconCardHeader
        title={name}
        light={false}
        titleTag="h6"
      ></FalconCardHeader>

      <CardBody className="h-100">
        {pageResult.success && pageData && (
          <ReactEchartsCore
            echarts={echarts}
            option={getOption(pageData, name)}
            style={{ minHeight: '18.75rem' }}
          />
        )}

        {pageResult.success && !pageData && (
          <div style={{ minHeight: '18.75rem' }}></div>
        )}

        {!pageResult.success && (
          <div className="p-3">
            <Alert color="warning">{pageResult.message}</Alert>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export const SERPCard = ({ serpsResult, name }) => {
  return (
    <Card style={{ boxShadow: 'none' }}>
      <FalconCardHeader
        title={name}
        light={false}
        titleTag="h6"
      ></FalconCardHeader>

      <CardBody className="h-100">
        {serpsResult.success && serpsResult.serps?.length > 0 && (
          <div className="m-auto" style={{ maxWidth: '350px' }}>
            <Doughnut
              data={getSERPChartData(serpsResult.serps)}
              plugins={[ChartDataLabels]}
              options={getSERPChartOptions()}
            />
          </div>
        )}

        {serpsResult.success && serpsResult.serps?.length === 0 && (
          <div style={{ minHeight: '18.75rem' }}></div>
        )}

        {!serpsResult.success && (
          <div className="p-3">
            <Alert color="warning">{serpsResult.message}</Alert>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
