import React from 'react';
import { requireRoles } from '@util/auth.js';
import WorkflowsTable from '@components/workflow/tables/WorkflowsTable';
import FalconCardHeader from '@components/common/FalconCardHeader';
import { Button, Card, CardBody } from 'reactstrap';
import Link from 'next/link';
import { getRouteRoles } from 'routes';

function ViewWorkflows() {
  return (
    <>
      <Card className="mb-3">
        <FalconCardHeader title="Workflows" light={false}>
          <Link href="/workflow/add">
            <Button color="primary">Create Workflow</Button>
          </Link>
        </FalconCardHeader>
        <CardBody className="p-0">
          <WorkflowsTable />
        </CardBody>
      </Card>
    </>
  );
}

export default requireRoles(ViewWorkflows, getRouteRoles('/workflows'));
