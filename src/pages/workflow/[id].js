import React, { useCallback, useEffect, useState } from 'react';
import { requireRoles } from '@util/auth.js';
import { getRouteRoles } from 'routes';
import Router from 'next/router';
import { useGetWorkflow } from '@util/api';
import { WorkflowType } from '@util/enum';
import ViewWorkflowProduct from '@components/workflow/ViewWorkflowProduct';
import ViewWorkflowFile from '@components/workflow/ViewWorkflowFile';
import ViewWorkflowPage from '@components/workflow/ViewWorkflowPage';
import ViewWorkflowIdea from '@components/workflow/ViewWorkflowIdea';
import Loader from '@components/common/Loader';

const ViewWorkflow = () => {
  const workflowId = Router.query.id;
  const keyword = Router.query.keyword;
  const pageId = Router.query.pageId;
  const { isLoading: workflowLoading, data: workflowData } =
    useGetWorkflow(workflowId);

  const handleCancel = () => {
    Router.push('/workflow');
  };

  if (workflowLoading || !workflowData) return <Loader />;
  return (
    <>
      {workflowData.workflow &&
        workflowData.workflow.workflowType === WorkflowType.File && (
          <ViewWorkflowFile
            workflow={workflowData.workflow}
            onCancel={handleCancel}
          />
        )}
      {workflowData.workflow &&
        workflowData.workflow.workflowType === WorkflowType.Idea && (
          <ViewWorkflowIdea
            workflow={workflowData.workflow}
            keyword={keyword}
            onCancel={handleCancel}
          />
        )}
      {workflowData.workflow &&
        workflowData.workflow.workflowType === WorkflowType.Page && (
          <ViewWorkflowPage
            workflow={workflowData.workflow}
            pageId={pageId}
            onCancel={handleCancel}
          />
        )}
      {workflowData.workflow &&
        (!workflowData.workflow.workflowType ||
          workflowData.workflow.workflowType === WorkflowType.Product) && (
          <ViewWorkflowProduct
            workflow={workflowData.workflow}
            onCancel={handleCancel}
          />
        )}
    </>
  );
};

export default requireRoles(ViewWorkflow, getRouteRoles('/workflows/[id]'));
