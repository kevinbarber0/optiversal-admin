import React, { useState } from 'react';
import Router from 'next/router';
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  CardBody,
  FormGroup,
  InputGroup,
  Label,
  Form,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';

import FalconCardHeader from '@components/common/FalconCardHeader';
import { toast } from 'react-toastify';
import { useAuth, requireAuth } from '@util/auth.js';
import {
  updateAuth0User,
  updateUserProfile,
  deleteUserProfile,
  resetPasswordAuth0,
  enableMFAAuth0,
} from '@util/api.js';
import { isValidateEmail } from '@helpers/utils.js';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  if (!user) Router.push('/api/auth/login');

  const [avatar, setAvatar] = useState(user.picture);
  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [working, setWorking] = useState(false);

  const handleSave = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!email) {
      toast.error('You must enter you email.', {
        theme: 'colored',
      });
      return;
    }

    if (!isValidateEmail(email)) {
      toast.error('Email is not valid.', {
        theme: 'colored',
      });
      return;
    }

    if (!fullName) {
      toast.error('You must enter you full name.', {
        theme: 'colored',
      });
      return;
    }

    const userData = {
      email: email,
      email_verified: true,
      name: fullName,
    };
    setWorking(true);

    const res = await updateUserProfile(user.uid, userData);

    if (res?.success) {
      const result = await updateAuth0User(userData);

      if (result?.success) {
        toast.success('User info has been updated!', { theme: 'colored' });
        setUser({
          ...user,
          ...{
            email,
            email_verified: true,
            name: fullName,
          },
        });
      } else {
        toast.error('User info could not be updated.', {
          theme: 'colored',
        });
      }
    } else {
      toast.error('User info could not be updated.', {
        theme: 'colored',
      });
    }
    setWorking(false);
    setOpenModal(!openModal);
  };

  const handleResetPassword = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setWorking(true);

    const res = await resetPasswordAuth0(user.email);
    if (res.success) {
      toast.success(res.data, { theme: 'colored' });
    } else {
      toast.error(res.message, {
        theme: 'colored',
      });
    }
    setWorking(false);
  };

  const enableMFA = async (e) => {
    if (e) {
      e.preventDefault();
    }

    setWorking(true);

    const res = await enableMFAAuth0(user.email);
    if (res.success && res.data) {
      if (res.data.ticket_url) Router.push(res.data.ticket_url);
      else if (res.data.error) {
        toast.error(
          'Unable to enable Multi-Factor Authentication: ' + res.data.error,
          {
            theme: 'colored',
          },
        );
      }
    } else {
      toast.error(
        'Unable to enable Multi-Factor Authentication: ' + res.message,
        {
          theme: 'colored',
        },
      );
    }
    setWorking(false);
  };

  const handleCancel = () => {
    Router.push('/');
  };

  const handleDelete = async () => {
    const userData = {
      blocked: true,
    };

    setWorking(true);

    const res = await updateAuth0User(userData);
    if (res?.success) {
      const result = await deleteUserProfile();
      if (result?.success) {
        toast.success('User account has been deleted!', { theme: 'colored' });
        setTimeout(() => {
          Router.push('/api/auth/logout');
        }, 5000);
      } else {
        toast.error('User account could not be deleted.', {
          theme: 'colored',
        });
      }
    } else {
      toast.error('User account could not be deleted.', {
        theme: 'colored',
      });
    }
    setWorking(false);
    setOpenModal(!openModal);
  };

  return (
    <>
      <Modal isOpen={openModal} toggle={() => setOpenModal(!openModal)}>
        {modalType === 'confirm-save' && (
          <ModalHeader>Confirm Profile</ModalHeader>
        )}
        {modalType === 'confirm-delete' && (
          <ModalHeader>Delete My Account</ModalHeader>
        )}
        {modalType === 'confirm-save' && (
          <ModalBody>
            <p>
              Please confirm you would like to update your profile as follows:
            </p>
            <div>
              Name: <b>{fullName}</b>
            </div>
            <div>
              Email: <b>{email}</b>
            </div>
          </ModalBody>
        )}
        {modalType === 'confirm-delete' && (
          <ModalBody>
            Are you sure you want to delete your account?{' '}
            <strong>This action is permanent and deletes your history.</strong>
          </ModalBody>
        )}
        <ModalFooter>
          <Button
            color="falcon-secondary"
            onClick={() => setOpenModal(!openModal)}
            disabled={working}
          >
            Cancel
          </Button>
          {modalType === 'confirm-save' && (
            <Button color="primary" onClick={handleSave} disabled={working}>
              Confirm
            </Button>
          )}
          {modalType === 'confirm-delete' && (
            <Button color="danger" onClick={() => handleDelete(!openModal)}>
              Delete Account
            </Button>
          )}
        </ModalFooter>
      </Modal>
      <Row noGutters>
        <Col lg="9">
          <Card className="mb-3">
            <FalconCardHeader title="Profile" light={true}>
              <Button
                color="falcon-secondary"
                size="sm"
                className="ml-2"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                outline
                color="primary"
                size="sm"
                className="ml-2"
                onClick={() => {
                  setModalType('confirm-save');
                  setOpenModal(!openModal);
                }}
                disabled={working}
              >
                Save
              </Button>
              <Button
                outline
                color="danger"
                size="sm"
                className="ml-2"
                onClick={() => {
                  setModalType('confirm-delete');
                  setOpenModal(!openModal);
                }}
                disabled={working}
              >
                Delete
              </Button>
            </FalconCardHeader>

            <CardBody>
              <Row noGutters>
                <Col lg="8">
                  <Form onSubmit={handleSave}>
                    <FormGroup>
                      <div className="avatar avatar-4xl shadow-sm img-thumbnail rounded-circle">
                        <div className="h-100 w-100 rounded-circle overflow-hidden position-relative">
                          <img src={avatar} width="200" alt="" />
                          {/* <Input
                          className="d-none"
                          id="profile-image"
                          type="file"
                        />
                        <Label
                          className="mb-0 overlay-icon d-flex flex-center"
                          htmlFor="profile-image"
                        >
                          <span className="bg-holder overlay overlay-0" />
                          <span className="z-index-1 text-white text-center fs--1">
                            <FontAwesomeIcon icon="camera" />
                          </span>
                        </Label> */}
                        </div>
                      </div>
                    </FormGroup>
                    <FormGroup>
                      <Label for="fullName">Full Name</Label>
                      <InputGroup>
                        <Input
                          id="fullName"
                          placeholder="Full Name"
                          defaultValue={fullName}
                          required={true}
                          onChange={({ target }) => setFullName(target.value)}
                        />
                      </InputGroup>
                    </FormGroup>
                    <FormGroup>
                      <Label for="email">Email</Label>
                      <InputGroup>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email"
                          defaultValue={email}
                          onChange={({ target }) => setEmail(target.value)}
                        />
                      </InputGroup>
                    </FormGroup>
                  </Form>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row noGutters>
        <Col lg="9">
          <Card className="mb-3">
            <FalconCardHeader title="Authentication" light={true} />
            <CardBody>
              <Row noGutters>
                <Col lg="8">
                  <Button
                    color="primary"
                    onClick={handleResetPassword}
                    disabled={working}
                  >
                    Reset Password
                  </Button>
                </Col>
              </Row>
              <Row noGutters className="mt-4">
                <Col lg="8">
                  <Button
                    color="primary"
                    onClick={enableMFA}
                    disabled={working}
                  >
                    Enable Multi-Factor Authentication
                  </Button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default requireAuth(ProfilePage);
