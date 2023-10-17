import React, { useState, useEffect } from 'react';
import Router from 'next/router';
import { createCookie } from '@helpers/utils';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

function AuthErr({ errmsg }) {
  const [collapseOpen, setCollapseOpen] = useState(true);
  useEffect(() => {
    if (!errmsg) Router.push('/api/auth/login');
    createCookie('orgId', '');
  }, [errmsg]);

  const handleClose = () => {
    setCollapseOpen(!collapseOpen);
    Router.push('/api/auth/logout');
  };

  return (
    <>
      {errmsg && (
        <Modal isOpen={collapseOpen} toggle={handleClose}>
          <ModalHeader>Authentication failure</ModalHeader>
          <ModalBody>{errmsg}</ModalBody>
          <ModalFooter>
            <Button color='primary' onClick={handleClose}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}

AuthErr.showNav = false;

export async function getServerSideProps(context) {
  const { errmsg } = context.query;
  return {
    props: {
      errmsg: errmsg || null,
    },
  };
}

export default AuthErr;
