import { useEffect } from 'react';
import { requireAdmin } from '@util/auth.js';
import ContentTemplateEditor from '@components/ContentTemplateEditor';
import Router from 'next/router';
import { useGetContentTemplate } from '@util/api.js';

function ModifyContentTemplate() {
  const id = Router.query.id;
  const { status, data: contentTemplateResult } = useGetContentTemplate(id);

  useEffect(() => {
    if (contentTemplateResult) {
      if (contentTemplateResult.status === 'error') {
        Router.push('/contenttemplates');
      }
      if (!contentTemplateResult.success) {
        if (contentTemplateResult.message === 'Not found') {
          Router.push('/404');
        } else if (contentTemplateResult.message === 'Unauthorized') {
          Router.push('/');
        }
      }
    }
  }, [contentTemplateResult]);

  const handleCancel = () => {
    Router.push('/contenttemplates');
  };

  const handleSave = () => {};

  return (
    <>
      {status === 'success' && contentTemplateResult.contentTemplate && (
        <ContentTemplateEditor
          onCancel={handleCancel}
          onSave={handleSave}
          contentTemplate={contentTemplateResult.contentTemplate}
        ></ContentTemplateEditor>
      )}
    </>
  );
}

export default requireAdmin(ModifyContentTemplate);
