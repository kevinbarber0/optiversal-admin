import React, { useEffect } from 'react';
import { EditPageContextProvider } from '@context/EditPageContext';
import Loader from '@components/common/Loader';
import { toast } from 'react-toastify';
import PageLayout from '@components/PageLayout';
import { useGetNextPage } from '@util/api.js';
import { isEmpty } from 'lodash';

function ViewWorkflowPage({ workflow, pageId, onCancel }) {
  const contentTemplate = workflow?.contentTypes;
  const { editors, filterLabels, matchType, pageStatus } =
    workflow?.searchParams;
  const {
    status,
    isLoading: pageLoading,
    data: pageData,
  } = useGetNextPage(
    workflow.workflowId,
    editors.map(({ value }) => value),
    contentTemplate?.value,
    filterLabels.map((label) => label.value),
    matchType,
    pageStatus,
    pageId,
  );

  useEffect(() => {
    if (!pageLoading && isEmpty(pageData?.page)) {
      toast.success('There is no remaining page in this workflow!', {
        theme: 'colored',
      });
    }
  }, [pageData]);
  return (
    <>
      {status === 'success' && !isEmpty(pageData?.page) && (
        <EditPageContextProvider
          workflow={workflow}
          completedWorkflow={isEmpty(pageData?.page)}
          page={pageData?.page}
          onCancel={onCancel}
        >
          <PageLayout action="edit" />
        </EditPageContextProvider>
      )}
      {pageLoading && <Loader />}
    </>
  );
}

export default ViewWorkflowPage;
