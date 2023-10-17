import React from 'react';
import { requireRoles } from '@util/auth.js';
import FalconCardHeader from '@components/common/FalconCardHeader';
import ReviewWorkflowItemsTable from '@components/workflow/tables/ReviewWorkflowItemsTable';
import { Button, Card, CardBody } from 'reactstrap';
import { getRouteRoles } from 'routes';
import Router from 'next/router';
import { useGetWorkflow } from '@util/api';
import { capitalize } from '@helpers/utils';

function ReviewWorkflow() {
  const workflowId = Router.query.id;
  const { status, data } = useGetWorkflow(workflowId);
  return (
    <Card className="mb-3">
      <FalconCardHeader
        title={
          data
            ? `Review ${data?.workflow?.name} (${capitalize(
                data?.workflow?.workflowType,
              )}) Workflow`
            : ''
        }
        light={false}
      />
      {data?.workflow && (
        <CardBody className="p-0">
          <ReviewWorkflowItemsTable
            workflowId={workflowId}
            workflowType={data?.workflow?.workflowType}
          />
        </CardBody>
      )}
    </Card>
  );
}

export default requireRoles(ReviewWorkflow, getRouteRoles('/workflows'));
