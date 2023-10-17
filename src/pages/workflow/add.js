import React from 'react';
import { requireRoles } from '@util/auth.js';
import { getRouteRoles } from 'routes';
import WorkflowSettings from '@components/WorkflowSettings';
import Router from 'next/router';

const AddWorkflowPage = () => {
  const handleCancel = () => {
    Router.push('/workflow');
  };

  const handleSave = (id) => {
    Router.push(`/workflow/${id}/edit`);
  };

  return (
    <>
      <WorkflowSettings onCancel={handleCancel} onSave={handleSave} />
    </>
  );
};

export default requireRoles(AddWorkflowPage, getRouteRoles('/workflows'));
