import { requireAdmin } from '@util/auth.js';
import ContentTemplateEditor from '@components/ContentTemplateEditor';
import Router from 'next/router';

function AddContentTemplate() {
  const handleCancel = () => {
    Router.push('/contenttemplates');
  };

  const handleSave = (contentTemplateId) => {
    Router.push('/contenttemplate/' + contentTemplateId);
  };

  return (
    <>
      <ContentTemplateEditor
        onCancel={handleCancel}
        onSave={handleSave}
      ></ContentTemplateEditor>
    </>
  );
}

export default requireAdmin(AddContentTemplate);
