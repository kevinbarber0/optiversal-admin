import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Col,
  Row,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  ButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from 'reactstrap';
import FalconCardHeader from '@components/common/FalconCardHeader';
import classNames from 'classnames';
import { useGetComponents, updateContentTemplate } from '@util/api.js';
import Router from 'next/router';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { v4 as uuidv4 } from 'uuid';
const ContentBlockEditor = dynamic(
  () => import('@components/ContentBlockEditor'),
  {
    ssr: false,
  },
);

const ContentTemplateEditor = (props) => {
  const [name, setName] = useState(
    props.contentTemplate ? props.contentTemplate.name : null,
  );
  const [contentBlocks, setContentBlocks] = useState(
    props.contentTemplate
      ? new Map(
          props.contentTemplate.content.map((c) => [c.contentBlockId, c]),
        ) || new Map()
      : new Map(),
  );
  const [contentBlockOrder, setContentBlockOrder] = useState(
    props.contentTemplate
      ? props.contentTemplate.content?.map((ct) => ct.contentBlockId) || []
      : [],
  );
  const [contentBlockStr, setContentBlockStr] = useState();
  const { status, data: componentsResult } = useGetComponents(0, 100);
  const [isComposing, setIsComposing] = useState(false);
  const [activeComponent, setActiveComponent] = useState();
  const [dropdownOpen, setOpen] = useState(false);
  const toggle = () => setOpen(!dropdownOpen);

  const saveTemplate = async () => {
    const template = {
      contentTemplateId: props.contentTemplate?.contentTemplateId,
      name: name,
      content: contentBlockOrder.map((contentBlockId) =>
        contentBlocks.get(contentBlockId),
      ),
    };
    const res = await updateContentTemplate(template);
    if (res.success) {
      toast.success('Template saved!');
    } else {
      toast.error('There was a problem saving this template: ' + res.message);
    }
    return res;
  };

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    } else {
      Router.push('/contenttemplates');
    }
  };

  const handleSaveTemplate = async () => {
    const res = await saveTemplate();
    if (res.success && props.onSave) {
      props.onSave(res.contentTemplateId);
    }
  };

  const handleMoveUp = async (contentBlockId) => {
    const currentIndex = contentBlockOrder.indexOf(contentBlockId);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      contentBlockOrder.splice(
        newIndex,
        0,
        contentBlockOrder.splice(currentIndex, 1)[0],
      );
      setContentBlockOrder(contentBlockOrder);
      setContentBlockStr(contentBlockOrder.join('|'));
    }
  };

  const handleMoveDown = async (contentBlockId) => {
    const currentIndex = contentBlockOrder.indexOf(contentBlockId);
    if (currentIndex >= 0 && currentIndex < contentBlockOrder.length - 1) {
      const newIndex = currentIndex + 1;
      contentBlockOrder.splice(
        newIndex,
        0,
        contentBlockOrder.splice(currentIndex, 1)[0],
      );
      setContentBlockOrder(contentBlockOrder);
      setContentBlockStr(contentBlockOrder.join('|'));
    }
  };

  const handleRemove = async (contentBlockId) => {
    const ix = contentBlockOrder.indexOf(contentBlockId);
    if (ix >= 0) {
      contentBlockOrder.splice(ix, 1);
      setContentBlockOrder(contentBlockOrder);
      setContentBlockStr(contentBlockOrder.join('|'));
    }
  };

  const handleAddContent = async (componentId, header) => {
    const component =
      componentId === 'blank'
        ? {
            componentId: 'blank',
            name: 'Blank',
            settings: { componentType: 'paragraph' },
          }
        : componentsResult.components.find(
            (c) => c.componentId === componentId,
          );
    if (component) {
      setActiveComponent(component);
      //show placeholder
      setIsComposing(true);
      //fetch content
      const contentBlockId = uuidv4();
      const contentBlock = {
        contentBlockId: contentBlockId,
        component: component,
      };
      if (component.settings.componentType === 'search') {
        contentBlock.data = [
          { name: 'Sample Product 1' },
          { name: 'Sample Product 2' },
        ];
        contentBlock.header = 'Related Products';
        setContentBlockOrder([...contentBlockOrder, contentBlockId]);
        setContentBlocks(contentBlocks.set(contentBlockId, contentBlock));
      } else {
        contentBlock.content =
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
        contentBlock.data = ['Section 1', 'Section 2', 'Section 3'];
        if (header) {
          contentBlock.header = header;
          return contentBlock;
        } else {
          contentBlock.header = component.settings.header;
        }
        const addedBlockIds = [contentBlockId];
        const addedBlocks = [contentBlock];
        setContentBlockOrder([...contentBlockOrder, ...addedBlockIds]);
        addedBlocks.forEach((block) =>
          contentBlocks.set(block.contentBlockId, block),
        );
        setContentBlocks(contentBlocks);
      }
    }
    setIsComposing(false);
  };

  return (
    <>
      <Row noGutters>
        <Col lg="9" className={classNames('pr-lg-2', { 'mb-3': false })}>
          <Card className="mb-3">
            <FalconCardHeader title="Template Editor" light={true}>
              <Button
                color="falcon-secondary"
                size="sm"
                className="mr-2"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                color="falcon-primary"
                size="sm"
                className="mr-2"
                onClick={handleSaveTemplate}
              >
                Save Template
              </Button>
            </FalconCardHeader>
            <CardBody tag={Form}>
              <FormGroup>
                <Label for="tempname">Name</Label>
                <div className="input-group">
                  <Input
                    id="tempname"
                    placeholder="Template Name"
                    defaultValue={name}
                    onChange={({ target }) => setName(target.value)}
                  />
                </div>
              </FormGroup>
              <hr />
              <h1
                className="fs-3"
                style={{ paddingLeft: 15, fontFamily: "'Georgia', serif" }}
              >
                {name}
              </h1>
              {contentBlockOrder.map((contentBlockId, ix) => (
                <ContentBlockEditor
                  key={contentBlockId}
                  id={contentBlockId}
                  contentBlock={contentBlocks.get(contentBlockId)}
                  index={ix}
                  totalCount={contentBlockOrder.length}
                  onRemove={handleRemove}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  readOnly={true}
                ></ContentBlockEditor>
              ))}
              {isComposing && activeComponent && (
                <>
                  <Spinner size="sm" color="primary" /> Authoring{' '}
                  {activeComponent.name}...
                </>
              )}
              <center>
                {status === 'success' &&
                  componentsResult &&
                  componentsResult.success && (
                    <>
                      <ButtonDropdown isOpen={dropdownOpen} toggle={toggle}>
                        <DropdownToggle color="primary" size="lg">
                          Add Content <FontAwesomeIcon icon="plus" />
                        </DropdownToggle>
                        <DropdownMenu>
                          <DropdownItem
                            key="blank"
                            value="blank"
                            onClick={(e) => {
                              handleAddContent(e.target.value);
                            }}
                          >
                            Blank
                          </DropdownItem>
                          {componentsResult.components.map((comp) => (
                            <DropdownItem
                              key={comp.componentId}
                              value={comp.componentId}
                              onClick={(e) => {
                                handleAddContent(e.target.value);
                              }}
                            >
                              {comp.name}
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </ButtonDropdown>
                    </>
                  )}
              </center>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ContentTemplateEditor;
