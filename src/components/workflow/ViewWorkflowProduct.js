import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  useGetWorkflowNextProduct,
  composeProductContent,
  setProductContent,
  finishWorkflowProduct,
} from '@util/api';
import { Row, Col, Card, Button, CardBody, Form } from 'reactstrap';
import FalconCardHeader from '@components/common/FalconCardHeader';
import { toast } from 'react-toastify';
import Flex from '@components/common/Flex';
import ButtonIcon from '@components/common/ButtonIcon';
import ProductCopy from '@components/ProductCopy';
import { WorkflowType } from '@util/enum';
import { v4 as uuidv4 } from 'uuid';

const WorkflowInputEditor = dynamic(
  () => import('@components/WorkflowInputEditor'),
  {
    ssr: false,
  },
);

const ViewWorkflowProduct = ({ workflow, onCancel }) => {
  const workflowId = workflow.workflowId;
  const { status, data: productResult } = useGetWorkflowNextProduct(workflowId);
  const [working, setWorking] = useState(false);
  const [complete, setComplete] = useState(false);
  const [currentContent, setCurrentContent] = useState({});
  const [savedContent, setSavedContent] = useState({});
  const [isPopulated, setIsPopulated] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();

    setWorking(true);
    const res = await finishWorkflowProduct(
      workflowId,
      productResult?.product?.sku,
      productResult?.product?.name,
      savedContent,
    );
    if (res.success) {
      toast.info('Moving to the next product', {
        theme: 'colored',
      });
      setCurrentContent({});
      setSavedContent({});
      setIsPopulated(false);
    } else {
      toast.error('Product could not be updated: ' + res.message, {
        theme: 'colored',
      });
      setWorking(false);
    }
  };

  const updateCurrentContent = useCallback(
    (contentType, value) => {
      const newObj = { ...currentContent } || {};
      newObj[contentType] = value;
      setCurrentContent(newObj);
    },
    [currentContent],
  );

  const handleAuthorProductCopy = async ({ productCopyType }) => {
    setWorking(true);
    const res = await composeProductContent(
      productResult.product,
      productCopyType === 'Product Description' &&
        productResult.product.description &&
        productResult.product.description.trim() !== ''
        ? 'Product Rewritten Description'
        : productCopyType,
      false,
    );
    if (!res.success) {
      toast.error('Could not compose copy: ' + res.message, {
        theme: 'colored',
      });
      setWorking(false);
      return null;
    } else {
      updateCurrentContent(productCopyType, res.composition);
      setWorking(false);
      return res;
    }
  };

  useEffect(() => {
    if (!isPopulated) {
      if (productResult?.success) {
        if (productResult?.product) {
          workflow.contentTypes.forEach((ct) => {
            handleAuthorProductCopy({ productCopyType: ct.value });
          });
        } else {
          setCurrentContent({});
          toast.success('There are no remaining products in this workflow!', {
            theme: 'colored',
          });
          setComplete(true);
          setWorking(false);
        }
      }
    }
  }, [workflow, productResult, isPopulated]);

  const handleSaveContentClick = async (contentType) => {
    setWorking(true);
    const content = productResult.product.content
      ? productResult.product.content[contentType] || {}
      : {};
    content[uuidv4()] = {
      content: currentContent[contentType],
    };
    const res = await setProductContent(
      productResult.product.sku,
      contentType,
      content,
    );
    if (res.success) {
      const newObj = { ...savedContent } || {};
      newObj[contentType] = currentContent[contentType];
      setSavedContent(newObj);
      toast.success('Copy saved!', {
        theme: 'colored',
      });
    } else {
      toast.error('Copy could not be saved: ' + res.message, {
        theme: 'colored',
      });
    }
    setWorking(false);
  };

  return (
    <>
      {status === 'success' && productResult && (
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
              onClick={handleSave}
              disabled={working || complete}
            >
              Next Product
            </Button>
          </FalconCardHeader>

          <CardBody tag={Form} className="bg-light">
            <Row>
              <Col lg={4} className="mb-4 mb-lg-0">
                <img
                  className="img-fluid rounded"
                  src={productResult?.product?.imageUrl}
                  alt={productResult?.product?.name}
                  style={{ maxHeight: 200 }}
                />
              </Col>
              <Col lg={8} tag={Flex} justify="between" column>
                {productResult?.product && (
                  <div>
                    <h5>
                      {productResult.product.name} ({productResult.product.sku})
                    </h5>
                    <span className="fs--1 mb-2 d-block">
                      {productResult.product.categoryId}
                    </span>
                    {productResult.product.description && (
                      <>
                        <strong>Description:</strong>{' '}
                        {productResult.product.description}
                      </>
                    )}
                    {productResult.product.features?.length > 0 && (
                      <>
                        <br />
                        <strong>Features:</strong>{' '}
                        {productResult.product.features.join(', ')}
                      </>
                    )}

                    <p>
                      {productResult.product.content?.['Product One-Liner'] && (
                        <>
                          <strong>Product One-Liners</strong>
                          <br />
                          <ul>
                            {Object.keys(
                              productResult.product.content[
                                'Product One-Liner'
                              ],
                            ).map((contentId) => (
                              <ProductCopy
                                key={contentId}
                                sku={productResult.product?.sku}
                                contentId={contentId}
                                copy={
                                  productResult.product.content[
                                    'Product One-Liner'
                                  ][contentId]
                                }
                                type="Product One-Liner"
                                allProductCopy={productResult.product.content}
                              />
                            ))}
                          </ul>
                        </>
                      )}
                      {productResult?.product.content?.[
                        'Product Ideal For'
                      ] && (
                        <>
                          <strong>Product Ideal For</strong>
                          <br />
                          <ul>
                            {Object.keys(
                              productResult.product.content[
                                'Product Ideal For'
                              ],
                            ).map((contentId) => (
                              <ProductCopy
                                key={contentId}
                                sku={productResult.product?.sku}
                                contentId={contentId}
                                copy={
                                  productResult.product.content[
                                    'Product Ideal For'
                                  ][contentId]
                                }
                                type="Product Ideal For"
                                allProductCopy={productResult.product.content}
                              />
                            ))}
                          </ul>
                        </>
                      )}
                      {(productResult.product.content?.[
                        'Product Description'
                      ] ||
                        productResult.product.content?.[
                          'Product Rewritten Description'
                        ]) && (
                        <>
                          <strong>Product Descriptions</strong>
                          <br />
                          <ul>
                            {productResult.product.content?.[
                              'Product Description'
                            ] &&
                              Object.keys(
                                productResult.product.content[
                                  'Product Description'
                                ],
                              ).map((contentId) => (
                                <ProductCopy
                                  key={contentId}
                                  sku={productResult.product.sku}
                                  contentId={contentId}
                                  copy={
                                    productResult.product.content[
                                      'Product Description'
                                    ][contentId]
                                  }
                                  type="Product Description"
                                  allProductCopy={productResult.product.content}
                                />
                              ))}
                            {productResult.product.content?.[
                              'Product Rewritten Description'
                            ] &&
                              Object.keys(
                                productResult.product.content[
                                  'Product Rewritten Description'
                                ],
                              ).map((contentId) => (
                                <ProductCopy
                                  key={contentId}
                                  sku={productResult.product.sku}
                                  contentId={contentId}
                                  copy={
                                    productResult.product.content[
                                      'Product Rewritten Description'
                                    ][contentId]
                                  }
                                  type="Product Rewritten Description"
                                  allProductCopy={productResult.product.content}
                                />
                              ))}
                          </ul>
                        </>
                      )}

                      {productResult.product.content?.[
                        'Long Product Description'
                      ] && (
                        <>
                          <strong>Long Product Descriptions</strong>
                          <br />
                          <ul>
                            {productResult.product.content[
                              'Long Product Description'
                            ] &&
                              Object.keys(
                                productResult.product.content[
                                  'Long Product Description'
                                ],
                              ).map((contentId) => (
                                <ProductCopy
                                  key={contentId}
                                  sku={productResult.product.sku}
                                  contentId={contentId}
                                  copy={
                                    productResult.product.content[
                                      'Long Product Description'
                                    ][contentId]
                                  }
                                  type="Long Product Description"
                                  allProductCopy={productResult.product.content}
                                />
                              ))}
                          </ul>
                        </>
                      )}

                      {productResult.product.content?.[
                        'Extra Long Product Description'
                      ] && (
                        <>
                          <strong>Extra Long Product Descriptions</strong>
                          <br />
                          <ul>
                            {productResult.product.content[
                              'Extra Long Product Description'
                            ] &&
                              Object.keys(
                                productResult.product.content[
                                  'Extra Long Product Description'
                                ],
                              ).map((contentId) => (
                                <ProductCopy
                                  key={contentId}
                                  sku={productResult.product.sku}
                                  contentId={contentId}
                                  copy={
                                    productResult.product.content[
                                      'Extra Long Product Description'
                                    ][contentId]
                                  }
                                  type="Extra Long Product Description"
                                  allProductCopy={productResult.product.content}
                                />
                              ))}
                          </ul>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </Col>
            </Row>
            <Row className="mt-4">
              <Col tag={Flex} column>
                <div>
                  {workflow?.contentTypes?.map((ct) => (
                    <React.Fragment key={ct.value}>
                      <strong>{ct.label}</strong>

                      <WorkflowInputEditor
                        workflowType={WorkflowType.Product}
                        onCompose={handleAuthorProductCopy}
                        updateContent={updateCurrentContent}
                        size="small"
                        contentType={ct.value}
                        content={currentContent[ct.value] || ''}
                        working={working}
                        setWorking={setWorking}
                        isPopulated={isPopulated}
                        setIsPopulated={setIsPopulated}
                      />
                      <div className="d-flex justify-content-between mb-2 mt-4">
                        <ButtonIcon
                          color="primary"
                          icon="save"
                          disabled={working || complete}
                          onClick={() => {
                            handleSaveContentClick(ct.value);
                          }}
                        >
                          {working ? 'Working...' : 'Save to Product'}
                        </ButtonIcon>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      )}
    </>
  );
};

export default ViewWorkflowProduct;
