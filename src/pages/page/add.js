import React from 'react';
import { EditPageContextProvider } from '@context/EditPageContext';
import { requireAuth } from '@util/auth.js';
import PageLayout from '@components/PageLayout';

function ModifyPage() {
  return (
    <EditPageContextProvider>
      <PageLayout action="add" />
    </EditPageContextProvider>
  );
}

export default requireAuth(ModifyPage);
