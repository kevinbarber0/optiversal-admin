import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  useGetWorkflows,
  getWorkflowExportUrl,
  updateWorkflowStatus,
  startWorkflowAutomation,
  stopWorkflowAutomation,
} from '@util/api';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import ButtonIcon, { ForwardRefButtonIcon } from '@components/common/ButtonIcon';
import renderConfirmDialog from '@components/ConfirmDialog';
import { toast } from 'react-toastify';
import { dateFormatter } from '@helpers/formatter';
import { useAuth } from '@util/auth.js';
import useWorkingState from 'hooks/useWorkingState';
import { WorkflowStatus, WorkflowType, WorkflowAutomationStatus } from '@util/enum';
import queryClient from '@util/query-client';
import { getOrgId } from '@helpers/auth';


// TODO Currently use a build env var. Revisit feature toggles attached to org
// configuration.
const ENABLED_ORG_IDS = process.env.NEXT_PUBLIC_AUTOMATED_WORKFLOW_ENABLED_ORG_IDS?.split(',') || [];

const AutomationUiState = {
  OFF: 'off',
  READY: 'ready',
  RUNNING: 'running',
}

export const isAutomatedWorkflowFeatureEnabled = (auth) => {
  const orgId = getOrgId(auth);
  return ENABLED_ORG_IDS.some((id) => id === orgId);
};

const WorkflowsTable = () => {
  const auth = useAuth();

  const { isWorking: working, setWorking, workingGuard } = useWorkingState();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const {
    status,
    isLoading: workflowsLoading,
    data: workflowsResult,
    refetch: refetchWorkflows,
  } = useGetWorkflows();

  // Refresh workflow data every 5 seconds to get automation status updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchWorkflows({ cancelRefetch: false });
    }, 5000);
    return () => clearInterval(interval);
  });

  const optimisticallySetAutomationStatus = (workflowId, newStatus) => {
    queryClient.setQueryData('workflows', (oldData) => {
      const data = oldData;
      const workflow = data.workflows.find((w) => w.workflowId === workflowId);

      if (workflow) {
        workflow.automationStatus = newStatus;
      }

      return data;
    });
  };

  const titleFormatter = (value, row) => (
    <Link
      href={`/workflow/${row.workflowId}`}
      className="font-weight-semi-bold"
      legacyBehavior
    >
      <a>{value}</a>
    </Link>
  );

  const todoLinkFormatter = (value, row) => {
    if (
      value === '0' ||
      (row.workflowType !== WorkflowType.Idea &&
        row.workflowType !== WorkflowType.Page)
    )
      return value;
    let url = '';
    if (row.workflowType === WorkflowType.Idea) {
      url = `/ideas?ideaWorkflow=${row.workflowId}`;
    } else {
      url = `/pages?view=pages&pageWorkflow=${row.workflowId}`;
    }

    return (
      <Link href={url} className="font-weight-semi-bold" legacyBehavior>
        <a>{value}</a>
      </Link>
    );
  };

  const completedLinkFormatter = (value, row) => {
    if (value === '0') return 0;
    else
      return (
        <Link
          href={`/workflow/${row.workflowId}/review`}
          className="font-weight-semi-bold"
          legacyBehavior
        >
          <a>{value}</a>
        </Link>
      );
  };

  const handleExport = async (workflowId, workflowType) => {
    setWorking(true);
    const res = await getWorkflowExportUrl(workflowId, workflowType);
    if (res.success && res.downloadUrl) {
      //trigger download
      // console.log('download: ', res.downloadUrl);
      const link = document.createElement('a');
      const fileName = res.downloadUrl.substring(
        res.downloadUrl.lastIndexOf('/') + 1,
      );
      link.setAttribute('download', fileName);
      link.href = res.downloadUrl;
      document.body.appendChild(link);

      // wait for the link to be added to the document
      window.requestAnimationFrame(function () {
        var event = new MouseEvent('click');
        link.dispatchEvent(event);
        document.body.removeChild(link);
      });
    } else {
      toast.error('Unable to download content: ' + res.message, {
        theme: 'colored',
      });
    }
    setWorking(false);
  };

  const handleCancelAutomatedWorkflow = async (workflowId) => {
    const res = await stopWorkflowAutomation(workflowId);
    if (res.success) {
      toast.success('Workflow automation cancelled!', {
        theme: 'colored',
      });
      optimisticallySetAutomationStatus(workflowId, WorkflowAutomationStatus.IDLE);
    } else {
      toast.error('Unable to cancel workflow automation: ' + res.message, {
        theme: 'colored',
      });
    }
  };

  const confirmCancelAutomatedWorkflow = async (row) => {
    await workingGuard(async () => {
      try {
        await renderConfirmDialog(
          `Cancel Automated Workflow`,
          `Are you sure you want to cancel automation for ${row.name}?`,
          'Yes',
        );
        await handleCancelAutomatedWorkflow(row.workflowId);
      } catch (err) {
        // renderConfirmDialog throws if the user cancels, handle it by just
        // returning w/o action
        if (err === false)
          return;
        throw(err);
      }
    });
  };

  const handleStartAutomatedWorkflow = async (workflowId) => {
    const res = await startWorkflowAutomation(workflowId);
    if (res.success) {
      toast.success('Workflow automation started!', {
        theme: 'colored',
      });
      optimisticallySetAutomationStatus(workflowId, WorkflowAutomationStatus.RUNNING);
    } else {
      toast.error('Unable to start workflow automation: ' + res.message, {
        theme: 'colored',
      });
    }
  }

  const confirmStartAutomatedWorkflow = async (row) => {
    await workingGuard(async () => {
      try {
        await renderConfirmDialog(
          `Start Automated Workflow`,
          `Are you sure you want to automatically generate content for ${row.itemCount} products?`,
          'Yes',
        );
        await handleStartAutomatedWorkflow(row.workflowId);
      } catch (err) {
        // renderConfirmDialog throws if the user cancels, handle it by just
        // returning w/o action
        if (err === false)
          return;
        throw(err);
      }
    });
  };

  const handleDelete = async (workflowId) => {
    const res = await updateWorkflowStatus(
      workflowId,
      WorkflowStatus.DELETED,
    );
    if (res.success) {
      toast.success('Workflow deleted!', {
        theme: 'colored',
      });
    } else {
      toast.error('Unable to delete the workflow: ' + res.message, {
        theme: 'colored',
      });
    }
  };

  const confirmDeleteWorkflow = (row) => {
    setWorking(true);
    renderConfirmDialog(
      `Delete Workflow`,
      `Are you sure you want to delete workflow ${row.name}?`,
      'Delete',
      'Close',
    ).then(() => {
      return handleDelete(row.workflowId);
    }).catch((err) => {
      // renderConfirmDialog throws if the user cancels, handle it by just
      // returning w/o action
      if (err === false)
        return;
      throw(err);
    }).finally(() => {
      setWorking(false);
    });
  };

  const actionFormatter = (k, row, index, data) => {
    const { working } = data;

    let automationUiState = AutomationUiState.OFF;
    if (row.automationStatus === WorkflowAutomationStatus.RUNNING) {
      automationUiState = AutomationUiState.RUNNING;
    } else if (row.itemCount > 0 && row.workflowType === 'product') {
      automationUiState = AutomationUiState.READY;
    }

    const disableNonAutomationButtons = working || automationUiState === AutomationUiState.RUNNING;
    const showAutomationButton = isAutomatedWorkflowFeatureEnabled(auth) && automationUiState !== AutomationUiState.OFF;
    const isAutomationReadyUiState = automationUiState === AutomationUiState.READY;

    return (
      <>
        {row && (
          <>
            <Link href={`/workflow/${row.workflowId}`}>
              <ForwardRefButtonIcon
                color="falcon-success"
                icon="person"
                transform="shrink-3"
                className="mr-1"
                disabled={disableNonAutomationButtons}
              />
            </Link>
            {showAutomationButton && (
              <ButtonIcon
                color={isAutomationReadyUiState ? "falcon-success" : "falcon-danger"}
                icon="robot"
                transform="shrink-3"
                className="mr-1"
                disabled={working}
                onClick={
                  isAutomationReadyUiState ?
                  (() => confirmStartAutomatedWorkflow(row)) :
                  (() => confirmCancelAutomatedWorkflow(row))
                }
              ></ButtonIcon>
            )}
            <Link href={`/workflow/${row.workflowId}/edit`}>
              <ForwardRefButtonIcon
                color="falcon-info"
                icon="edit"
                transform="shrink-3"
                className="mr-1"
                disabled={disableNonAutomationButtons}
              />
            </Link>
            {row.creator === auth.user.uid && (
              <ButtonIcon
                color="falcon-danger"
                icon="trash"
                iconAlign="left"
                transform="shrink-3"
                className="mr-1"
                onClick={() => confirmDeleteWorkflow(row)}
                disabled={disableNonAutomationButtons}
              ></ButtonIcon>
            )}
            {row.completedItemCount > 0 && (
              <ButtonIcon
                color="falcon-info"
                icon="download"
                transform="shrink-3"
                className="mr-1"
                onClick={() => handleExport(row.workflowId, row.workflowType)}
                disabled={disableNonAutomationButtons}
              ></ButtonIcon>
            )}
          </>
        )}
      </>
    );
  };

  const columns = [
    {
      dataField: 'name',
      text: 'Name',
      formatter: titleFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'dateAdded',
      text: 'Created',
      formatter: (v) => dateFormatter(v),
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'dateModified',
      text: 'Edited',
      formatter: (v) => dateFormatter(v),
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'itemCount',
      text: 'TODO Items',
      formatter: todoLinkFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'completedItemCount',
      text: 'Completed Items',
      formatter: completedLinkFormatter,
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'actions',
      text: ' ',
      formatter: actionFormatter,
      formatExtraData: { working },
      classes: 'border-0 align-right fs-0',
      headerClasses: 'border-0',
      sort: false,
    },
  ];

  return (
    <>
      {status === 'success' && workflowsResult && workflowsResult.success && (
        <>
          <PaginatedDataTable
            keyField="workflowId"
            data={workflowsResult.workflows}
            columns={columns}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </>
      )}
      {workflowsLoading && <Loader></Loader>}
    </>
  );
};

export default WorkflowsTable;
