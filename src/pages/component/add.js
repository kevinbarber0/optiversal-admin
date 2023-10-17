import { requireAdmin } from '@util/auth.js';
import EditComponent from '@components/EditComponent';
import Router from 'next/router';

function AddComponent() {
  const handleCancel = () => {
    Router.push('/components');
  };

  const handleSave = (componentId) => {
    Router.push('/component/' + componentId);
  };

  return (
    <>
      <EditComponent
        onCancel={handleCancel}
        onSave={handleSave}
      ></EditComponent>
    </>
  );
}

export default requireAdmin(AddComponent);
