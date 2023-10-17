import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useEditPageContext } from '@context/EditPageContext';

const EditPage = dynamic(() => import('@components/edit-page'), {
  ssr: false,
});

function PageLayout(props) {
  const { action } = props;

  const { page, title } = useEditPageContext();
  return (
    <>
      <Head>
        <title>
          {action === 'add'
            ? 'Optiversal - Create a page'
            : `Optiversal - ${title}`}
        </title>
      </Head>

      {(action === 'add' || (action === 'edit' && page)) && <EditPage />}
    </>
  );
}

export default PageLayout;
