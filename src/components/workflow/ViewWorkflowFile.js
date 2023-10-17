import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Row, Col, Card, Button, Input, CardBody, Form } from 'reactstrap';
import FalconCardHeader from '@components/common/FalconCardHeader';
import Loader from '@components/common/Loader';
import { toast } from 'react-toastify';
import Flex from '@components/common/Flex';
import ButtonIcon from '@components/common/ButtonIcon';
import {
  getCompletion,
  useGetWorkflowItems,
  updateWorkflowItem,
  completeWorkflowItem,
} from '@util/api';
import { WorkflowType } from '@util/enum';

const WorkflowInputEditor = dynamic(
  () => import('@components/WorkflowInputEditor'),
  {
    ssr: false,
  },
);

const ViewWorkflowFile = ({ workflow, onCancel }) => {
  const workflowId = workflow.workflowId;
  const { status, data: itemsData } = useGetWorkflowItems(workflowId);
  const [working, setWorking] = useState(false);
  const [complete, setComplete] = useState(false);

  const [index, setIndex] = useState(0);
  const [paragraph, setParagraph] = useState(null);
  const [isPopulated, setIsPopulated] = useState(false);

  useEffect(() => {
    if (!itemsData || !itemsData.items) return;

    if (itemsData.items.length > 0) {
      if (itemsData.items[0].outputContent) {
        setParagraph(itemsData.items[0].outputContent);
      } else authorParagraph({});

      setIsPopulated(false);
    } else {
      toast.success('There are no remaining items in this workflow!', {
        theme: 'colored',
      });
      setComplete(true);
    }
  }, [itemsData]);

  useEffect(() => {
    if (itemsData?.items?.length > 0) {
      if (index < itemsData.items.length) {
        setParagraph('');
        authorParagraph({});
        setIsPopulated(false);
      } else {
        setParagraph('');
        toast.success('There are no remaining items in this workflow!', {
          theme: 'colored',
        });
        setComplete(true);
      }
      setWorking(false);
    }
  }, [index]);

  const authorParagraph = async ({ component, header, content }) => {
    setWorking(true);
    const settings = {
      tokens: itemsData.items[index]?.inputContent,
      header: header ? header.trim() + '\n' : null,
      topic: itemsData.items[index]?.inputContent?.topic,
      componentId: component?.componentId || workflow.contentTypes?.label,
      content: content || null,
    };

    const res = await getCompletion(settings);
    if (res.success) {
      setParagraph(res.composition.trim());
      setWorking(false);
      return res;
    } else {
      toast.error('Unable to compose paragraph: ' + res.message, {
        theme: 'colored',
      });
      setWorking(false);
      return null;
    }
  };

  const handleNext = async () => {
    setWorking(true);
    const res = await completeWorkflowItem(
      itemsData.items[index].workflowId,
      itemsData.items[index].itemId,
    );

    if (res.success) {
      setIndex(index + 1);
    } else {
      toast.error('Workflow item could not be updated: ' + res.message, {
        theme: 'colored',
      });
      setWorking(false);
    }
  };

  const handleSave = async () => {
    setWorking(true);
    const item = {
      workflowId: itemsData.items[index].workflowId,
      itemId: itemsData.items[index].itemId,
      outputContent: paragraph,
    };
    const res = await updateWorkflowItem(item);
    if (res.success) {
      toast.success('Workflow item saved!', {
        theme: 'colored',
      });
    } else {
      toast.error('Workflow item could not be updated: ' + res.message, {
        theme: 'colored',
      });
    }
    setWorking(false);
  };

  if (status !== 'success' || !itemsData) return <></>;

  return (
    <>
      {status === 'success' && itemsData && itemsData.items ? (
        <Card className="mb-3">
          <FalconCardHeader
            title={workflow ? workflow.name : 'Workflow'}
            light={false}
          >
            <Button
              color="falcon-secondary"
              size="sm"
              className="mr-2"
              onClick={onCancel}
              disabled={working}
            >
              Exit
            </Button>
            <Button
              color="falcon-primary"
              size="sm"
              onClick={handleNext}
              disabled={working || complete}
            >
              {working ? 'Working...' : 'Next Item'}
            </Button>
          </FalconCardHeader>

          <CardBody tag={Form} className="bg-light">
            <Row>
              <Col lg={4} tag={Flex} justify="between" column>
                <div>
                  <span className="fs--1 mb-2 d-block">
                    {itemsData.items[index]?.inputContent &&
                      Object.keys(itemsData.items[index]?.inputContent).map(
                        (key) => (
                          <>
                            <strong>{key}:</strong>{' '}
                            {key.toLowerCase() === 'url' ? (
                              <a
                                href={itemsData.items[index].inputContent[key]}
                                target="_blank"
                              >
                                {itemsData.items[index].inputContent[key]}
                              </a>
                            ) : (
                              itemsData.items[index].inputContent[key]
                            )}
                            <br />
                          </>
                        ),
                      )}
                  </span>
                </div>
              </Col>
              <Col lg={8} tag={Flex} column>
                <div>
                  <WorkflowInputEditor
                    workflowType={WorkflowType.File}
                    onCompose={authorParagraph}
                    updateContent={setParagraph}
                    size="small"
                    contentType={null}
                    content={paragraph || ''}
                    working={working}
                    setWorking={setWorking}
                    isPopulated={isPopulated}
                    setIsPopulated={setIsPopulated}
                  />
                  <div className="d-flex justify-content-between mb-2 mt-2">
                    <ButtonIcon
                      color="primary"
                      icon="save"
                      disabled={working || complete}
                      onClick={handleSave}
                    >
                      {working ? 'Working...' : 'Save Result'}
                    </ButtonIcon>
                  </div>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      ) : (
        <Loader />
      )}
    </>
  );
};

export default ViewWorkflowFile;
