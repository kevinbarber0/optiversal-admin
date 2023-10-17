import React, { useState, useMemo, useCallback } from 'react';
import {
  Button,
  Card,
  CardBody,
  Col,
  Row,
  Tooltip,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { rolesMatch, useAuth } from '@util/auth';
import { UserRole } from '@util/enum';
import { isUserLoaded } from '@helpers/auth';
import { Router } from 'next/router';
import { useEditPageContext } from '@context/EditPageContext';
import { PageStatus, PageStatusStrings, WorkflowType } from '@util/enum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const Header = ({ onSave, onAccept, onReject, onPreview }) => {
  const {
    page,
    pageChanged,
    workflow,
    completedWorkflow,
    template,
    isWorking,
    onChangeStatus,
    onCancel,
  } = useEditPageContext();

  const [isPreviewTooltip, setIsPreviewTooltip] = useState(false);
  const [isStatusTooltip, setIsStatusTooltip] = useState(false);
  const [isOpenStatusDropdown, setIsOpenStatusDropdown] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [pageChangeStatus, setPageChangeStatus] = useState(null);

  const auth = useAuth();
  const canCreatePage = useMemo(() => {
    return (
      isUserLoaded(auth) && rolesMatch([UserRole.EditPages], auth.user?.roles)
    );
  }, [auth]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      Router.push('/pages');
    }
  }, []);

  const onClickStatusItem = (changeStatus) => {
    setIsOpenModal(true);
    setPageChangeStatus(changeStatus);
  };

  const onClickModalButtons = (btnName, changeStatus) => {
    if (btnName === 'yes') {
      onChangeStatus(changeStatus);
    }
    setPageChangeStatus(null);
    setIsOpenModal(false);
  };
  return (
    <>
      <div style={{ position: 'sticky', top: 70, zIndex: 10 }}>
        <Card>
          <CardBody>
            <Row className="justify-content-between align-items-center">
              <Col md>
                <h5 className="mb-2 mb-md-0">
                  {page ? 'Edit' : 'Create'} {template ? template.name : ''}{' '}
                  Page
                  {workflow ? ` ( Workflow: ${workflow.name})` : ''}
                </h5>
              </Col>
              <Col xs="auto">
                <Button
                  color="falcon-secondary"
                  size="sm"
                  className="ml-2"
                  onClick={handleCancel}
                  disabled={isWorking}
                >
                  Cancel
                </Button>
                {page && !pageChanged && (
                  <Button
                    color="falcon-default"
                    size="sm"
                    className="ml-2"
                    onClick={onPreview}
                    disabled={isWorking || completedWorkflow || pageChanged}
                  >
                    Preview
                  </Button>
                )}
                {page && pageChanged && (
                  <>
                    <Button
                      id="btn-preview"
                      color="falcon-default"
                      size="sm"
                      className="ml-2"
                      disabled={isWorking || completedWorkflow}
                      style={{
                        color: '#4d5969',
                        backgroundColor: '#fff',
                        borderColor: ' #fff',
                        cursor: 'not-allowed',
                        opacity: 0.65,
                      }}
                    >
                      Preview
                    </Button>
                    <Tooltip
                      placement="top"
                      isOpen={isPreviewTooltip}
                      target="btn-preview"
                      toggle={() => setIsPreviewTooltip(!isPreviewTooltip)}
                    >
                      You must save your changes to preview the page.
                    </Tooltip>
                  </>
                )}
                {canCreatePage &&
                  workflow?.workflowType !== WorkflowType.Idea && (
                    <Button
                      color="falcon-default"
                      size="sm"
                      className="ml-2"
                      onClick={onSave}
                      disabled={isWorking || completedWorkflow}
                    >
                      Save
                    </Button>
                  )}

                {canCreatePage && page && !workflow && !pageChanged && (
                  <Dropdown
                    isOpen={isOpenStatusDropdown}
                    toggle={() =>
                      setIsOpenStatusDropdown(!isOpenStatusDropdown)
                    }
                    className="ml-2 d-inline"
                  >
                    <DropdownToggle
                      caret
                      color={
                        page.status === PageStatus.PUBLISHED
                          ? 'success'
                          : page.status === PageStatus.DRAFT
                          ? 'secondary'
                          : page.status === PageStatus.DELETED
                          ? 'danger'
                          : 'light'
                      }
                      className="btn"
                      size="sm"
                      disabled={isWorking || completedWorkflow || pageChanged}
                    >
                      {PageStatusStrings[page.status]}
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem header>Change status to:</DropdownItem>
                      <DropdownItem
                        onClick={() => onClickStatusItem(PageStatus.PUBLISHED)}
                      >
                        Published
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => onClickStatusItem(PageStatus.DRAFT)}
                      >
                        Draft
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => onClickStatusItem(PageStatus.DELETED)}
                      >
                        Deleted
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                )}
                {canCreatePage && page && !workflow && pageChanged && (
                  <>
                    <Button
                      id="dropdown-status"
                      color={
                        page.status === PageStatus.PUBLISHED
                          ? 'success'
                          : page.status === PageStatus.DRAFT
                          ? 'secondary'
                          : page.status === PageStatus.DELETED
                          ? 'danger'
                          : 'light'
                      }
                      className="btn dropdown-toggle ml-2 d-inline"
                      size="sm"
                      disabled={isWorking || completedWorkflow}
                      style={{
                        cursor: 'not-allowed',
                        opacity: 0.5,
                      }}
                    >
                      {PageStatusStrings[page.status]}
                    </Button>
                    <Tooltip
                      placement="top"
                      isOpen={isStatusTooltip}
                      target="dropdown-status"
                      toggle={() => setIsStatusTooltip(!isStatusTooltip)}
                    >
                      You must save your changes to change the page status.
                    </Tooltip>
                  </>
                )}
                {canCreatePage && workflow && (
                  <>
                    <Button
                      color="success"
                      size="sm"
                      className="ml-2"
                      onClick={onAccept}
                      disabled={isWorking || completedWorkflow}
                    >
                      Accept
                    </Button>

                    <Button
                      color="danger"
                      size="sm"
                      className="ml-2"
                      onClick={onReject}
                      disabled={isWorking || completedWorkflow}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </Col>
            </Row>
          </CardBody>
        </Card>
      </div>
      <Modal
        isOpen={isOpenModal}
        toggle={() => setIsOpenModal(!isOpenModal)}
        centered
      >
        <ModalHeader>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            size="lg"
            className="mr-2 text-warning"
          />
          Page status change
        </ModalHeader>
        <ModalBody>{`Are you sure you want to change this page's status to ${PageStatusStrings[pageChangeStatus]}?`}</ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => onClickModalButtons('yes', pageChangeStatus)}
          >
            Yes
          </Button>
          <Button onClick={() => onClickModalButtons('no', pageChangeStatus)}>
            No
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default Header;
