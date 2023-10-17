import React, { useEffect } from 'react';
import { requireRoles } from '@util/auth.js';
import { getRouteRoles } from 'routes';
import WorkflowSettings from '@components/WorkflowSettings';
import Router from 'next/router';
import { useGetWorkflow } from '@util/api';

const EditWorkflowPage = () => {
  const workflowId = Router.query.id;
  const { status, data: workflowResult } = useGetWorkflow(workflowId);

  useEffect(() => {
    if (workflowResult) {
      if (workflowResult.status === 'error') {
        Router.push('/workflows');
      }
      if (!workflowResult.success) {
        if (workflowResult.message === 'Not found') {
          Router.push('/404');
        } else if (workflowResult.message === 'Unauthorized') {
          Router.push('/');
        }
      }
    }
  }, [workflowResult]);

  const handleCancel = () => {
    Router.push('/workflow');
  };

  return (
    <>
      {status === 'success' && workflowResult.workflow && (
        <>
          <WorkflowSettings onCancel={handleCancel} workflow={workflowResult.workflow} />
        </>)}
    </>
  );
};

export default requireRoles(EditWorkflowPage, getRouteRoles('/workflows/edit'));
