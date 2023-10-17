import React, { useEffect } from 'react';
import { EditPageContextProvider } from '@context/EditPageContext';
import Loader from '@components/common/Loader';
import { toast } from 'react-toastify';
import PageLayout from '@components/PageLayout';
import { useGetNextSuggestion } from '@util/api.js';
import { isEmpty } from 'lodash';

function ViewWorkflowIdea({ workflow, onCancel, keyword }) {
  const contentTemplate = workflow?.contentTypes;
  const { filterLabels, importedOnly, matchType } = workflow?.searchParams;
  const {
    status,
    isLoading: ideaLoading,
    data: ideaData,
  } = useGetNextSuggestion(
    workflow.workflowId,
    filterLabels.map((label) => label.value),
    importedOnly,
    matchType,
    keyword,
  );

  useEffect(() => {
    if (ideaData?.suggestion?.length == 0) {
      toast.success('There is no remaining idea in this workflow!', {
        theme: 'colored',
      });
    }
  }, [ideaData]);

  return (
    <>
      {status === 'success' && !isEmpty(ideaData?.suggestion) && (
        <EditPageContextProvider
          workflow={workflow}
          completedWorkflow={isEmpty(ideaData.suggestion)}
          keyword={ideaData.suggestion.keyword}
          contentTemplate={contentTemplate}
          onCancel={onCancel}
        >
          <PageLayout action="add" />
        </EditPageContextProvider>
      )}
      {ideaLoading && <Loader />}
    </>
  );
}

export default ViewWorkflowIdea;
