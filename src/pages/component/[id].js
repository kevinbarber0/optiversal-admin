import { useEffect } from 'react';
import { requireAdmin } from '@util/auth.js';
import EditComponent from '@components/EditComponent';
import Router from 'next/router';
import { useGetComponent } from '@util/api.js';

function ModifyComponent() {
  const id = Router.query.id;
  const { status, data: componentResult } = useGetComponent(id);

  useEffect(() => {
    console.log(componentResult);
    if (componentResult) {
      if (componentResult.status === 'error') {
        Router.push('/components');
      }
      if (!componentResult.success) {
        if (componentResult.message === 'Not found') {
          Router.push('/404');
        } else if (componentResult.message === 'Unauthorized') {
          Router.push('/');
        }
      }
    }
  }, [componentResult]);

  const handleCancel = () => {
    Router.push('/components');
  };

  const handleSave = () => {};

  return (
    <>
      {status === 'success' && componentResult.component && (
        <EditComponent
          onCancel={handleCancel}
          onSave={handleSave}
          component={componentResult.component}
        ></EditComponent>
      )}
    </>
  );
}

export default requireAdmin(ModifyComponent);
