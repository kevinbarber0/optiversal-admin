import React, { useEffect, useMemo, useState, useRef } from 'react';
import { requireAuth, useAuth } from '@util/auth.js';
import Router, { useRouter } from 'next/router';
import {
  Card,
  CardBody,
  Row,
  Col,
  FormGroup,
  Button,
  Input,
  Label,
  InputGroup,
  InputGroupAddon,
  Collapse,
} from 'reactstrap';
import ProductSearchBox from '@components/ProductSearchBox';
import Flex from '@components/common/Flex';
import {
  useGetProductWithContent,
  composeProductContent,
  useGetListing,
} from '@util/api';
import Head from 'next/head';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import FalconCardHeader from '@components/common/FalconCardHeader';
import ProductCopy from '@components/ProductCopy';
import FormGroupSelect from '@components/common/FormGroupSelect';
import CardSummary from '@components/dashboard/CardSummary';
import { UserRole } from '@util/enum';
import { isEqual } from 'lodash';
import { filterNullValues } from '@helpers/utils';

function offset(el) {
  if (el) {
    const rect = el.getBoundingClientRect();
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }
  return { top: 0, left: 0 };
}

const getContentClassNames = (color) => {
  const contentClassNames =
    'display-4 fs-4 mb-2 font-weight-normal text-sans-serif';
  if (color === 'success') return contentClassNames;
  return `${contentClassNames} text-${color}`;
};

function ProductPage() {
  const router = useRouter();
  const auth = useAuth();
  const sku = Router.query.sku;
  const isMountedRef = useRef(false);

  const { data: productResult } = useGetProductWithContent(sku);
  const { data: listingResult } = useGetListing(sku);

  const [selectedSource, setSelectedSource] = useState(null);
  const [productCopyType, setProductCopyType] = useState('Product One-Liner');
  const [socialCopyType, setSocialCopyType] = useState('Product Tweet');
  const [authoring, setAuthoring] = useState(false);
  const [activeTab, setActiveTab] = useState(Router.query.view);
  const [indicatorLeft, setIndicatorLeft] = useState(null);
  const [indicatorRight, setIndicatorRight] = useState(null);
  const [currentTabIndex, setCurrentTabIndex] = useState(null);
  const [isReverse, setIsReverse] = useState(false);
  const [openIssues, setOpenIssues] = useState([]);

  const updateIndicator = (id) => {
    const navbar = document.getElementById('fancy-tab-footer');
    if (navbar) {
      const tabnavCurrentItem = document.getElementById(id);
      const navbarLeft = offset(navbar).left;
      const left = offset(tabnavCurrentItem).left - navbarLeft;
      const right = navbar.offsetWidth - (left + tabnavCurrentItem.offsetWidth);
      setIndicatorLeft(left);
      setIndicatorRight(right);
    }
  };

  const handleActiveTab = ({ target }) => {
    setSocialCopyType('Product Tweet');
    setProductCopyType('Product One-Liner');
    const { id, tabIndex } = target;
    setActiveTab(id);
    updateIndicator(id);
    setIsReverse(currentTabIndex > tabIndex);
    setCurrentTabIndex(tabIndex);
  };

  const handleSelectItem = (sku) => {
    Router.push('/catalog/[sku]', '/catalog/' + sku, { shallow: true });
  };

  useEffect(() => {
    if (listingResult && listingResult.listing) {
      if (listingResult.listing.length > 0) {
        if (Router.query.marketplace) {
          setSelectedSource(
            listingResult.listing.findIndex(
              ({ sourceId }) => sourceId === Router.query.marketplace,
            ),
          );
        } else {
          setSelectedSource(0);
        }

        if (!activeTab) setActiveTab('listing');
      } else {
        if (!activeTab) setActiveTab('reviews');
      }
    }
  }, [listingResult]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const { query } = router;

    if (query.view !== activeTab) {
      setActiveTab(query.view || 'reviews');
    }
  }, [router]);

  useEffect(() => {
    if (isMountedRef.current) {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          ...query,
          view: activeTab,
        },
        [undefined, null, ''],
      );

      if (!isEqual(newQuery, query)) {
        router.push({
          query: newQuery,
        });
      }
    }
  }, [activeTab]);

  const handleAuthorProductCopy = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setAuthoring(true);
    const res = await composeProductContent(
      productResult.product,
      productCopyType === 'Product Description' &&
        productResult.product.description &&
        productResult.product.description.trim() !== ''
        ? 'Product Rewritten Description'
        : productCopyType,
      true,
    );
    if (!res.success) {
      toast.error('Could not compose copy: ' + res.message);
    }
    setAuthoring(false);
  };

  const handleAuthorSocialCopy = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setAuthoring(true);
    const res = await composeProductContent(
      productResult.product,
      socialCopyType,
      true,
    );
    if (!res.success) {
      toast.error('Could not compose copy: ' + res.message);
    }
    setAuthoring(false);
  };

  const getFontClass = (item, keys) => {
    //keys are sorted biggest to smallest
    let itemIndex = keys.indexOf(item) + 1;
    //split into 5 size buckets (fs -> 4, 2, 1, 0, -1)
    let bucketSize = Math.ceil(keys.length / 5);
    let fontSize = 4;
    if (itemIndex >= bucketSize * 4) {
      fontSize = -1;
    } else if (itemIndex >= bucketSize * 3) {
      fontSize = 0;
    } else if (itemIndex >= bucketSize * 2) {
      fontSize = 1;
    } else if (itemIndex >= bucketSize) {
      fontSize = 2;
    }
    return 'fs-' + fontSize;
  };

  return (
    <>
      <Head>
        <title>
          Optiversal
          {productResult &&
            productResult.product &&
            ' - ' + productResult.product.name}
        </title>
      </Head>
      <Card>
        <FalconCardHeader title="Catalog Explorer" light={false} />
        <CardBody>
          <Row className="justify-content-between align-items-center">
            <Col md>
              <ProductSearchBox onSelectItem={handleSelectItem} />
            </Col>
          </Row>
        </CardBody>
      </Card>
      <br />
      {productResult && productResult.product && (
        <Card>
          <CardBody>
            <Row>
              <Col lg={3} className="mb-4 mb-lg-0">
                <img
                  className="img-fluid rounded"
                  src={productResult.product.imageUrl}
                  alt={productResult.product.name}
                  style={{ maxHeight: 200 }}
                />
              </Col>
              <Col lg={9} tag={Flex} justify="between" column>
                <div>
                  <h5>
                    {productResult.product.name} ({productResult.product.sku})
                  </h5>
                  <span className="fs--1 mb-2 d-block">
                    <a
                      href={productResult.product.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {productResult.product.url}
                    </a>
                    <br />
                    {productResult.product.categoryId}
                  </span>
                  {productResult.product.description && (
                    <>
                      <strong>Description:</strong>{' '}
                      {productResult.product.description}
                    </>
                  )}
                  {productResult.product.features &&
                    productResult.product.features.length > 0 && (
                      <>
                        <br />
                        <strong>Features:</strong>{' '}
                        {productResult.product.features.join(', ')}
                      </>
                    )}
                </div>
              </Col>
            </Row>
            <Row>
              <Col>
                <div
                  className="fancy-tab overflow-hidden mt-4"
                  id="fancy-tab-footer"
                >
                  <div className="nav-bar">
                    {listingResult &&
                      listingResult.listing &&
                      listingResult.listing.length > 0 && (
                        <div
                          className={classNames(
                            'nav-bar-item pl-0 pr-2 pr-sm-4',
                            {
                              active: activeTab === 'listing',
                            },
                          )}
                        >
                          <div
                            className="mt-1 fs--1"
                            id="listing"
                            tabIndex={1}
                            onClick={handleActiveTab}
                          >
                            Listing Quality
                          </div>
                        </div>
                      )}
                    <div
                      className={classNames('nav-bar-item pl-0 pr-2 pr-sm-4', {
                        active: activeTab === 'reviews',
                      })}
                    >
                      <div
                        className="mt-1 fs--1"
                        id="reviews"
                        tabIndex={2}
                        onClick={handleActiveTab}
                      >
                        Review Insights
                      </div>
                    </div>
                    {auth.user?.roles.includes(UserRole.ManageProductCopy) && (
                      <div
                        className={classNames('nav-bar-item px-2 px-sm-4', {
                          active: activeTab === 'productcopy',
                        })}
                      >
                        <div
                          className="mt-1 fs--1"
                          id="productcopy"
                          tabIndex={3}
                          onClick={handleActiveTab}
                        >
                          Product Copy
                        </div>
                      </div>
                    )}
                    <div
                      className={classNames('nav-bar-item px-2 px-sm-4', {
                        active: activeTab === 'socialcopy',
                      })}
                    >
                      <div
                        className="mt-1 fs--1"
                        id="socialcopy"
                        tabIndex={4}
                        onClick={handleActiveTab}
                      >
                        Social Copy
                      </div>
                    </div>
                    {productResult.product &&
                      productResult.product.content &&
                      productResult.product.content[
                        'Description Question and Answer'
                      ] && (
                        <div
                          className={classNames('nav-bar-item px-2 px-sm-4', {
                            active: activeTab === 'qanda',
                          })}
                        >
                          <div
                            className="mt-1 fs--1"
                            id="qanda"
                            tabIndex={5}
                            onClick={handleActiveTab}
                          >
                            Product Q&amp;A
                          </div>
                        </div>
                      )}
                    <div
                      className={classNames('tab-indicator', {
                        'transition-reverse': isReverse,
                      })}
                      style={{ left: indicatorLeft, right: indicatorRight }}
                    />
                  </div>
                  <div className="tab-contents">
                    <div
                      className={classNames('tab-content', {
                        active: activeTab === 'listing',
                      })}
                    >
                      {listingResult && listingResult.listing && (
                        <>
                          {selectedSource !== null && (
                            <div style={{ maxWidth: 400 }}>
                              <FormGroupSelect
                                id="marketplace"
                                loading={false}
                                label="Marketplace"
                                value={selectedSource.toString()}
                                onChange={({ target }) =>
                                  setSelectedSource(target.value)
                                }
                                options={listingResult.listing.map(
                                  (listing, key) => ({
                                    value: key,
                                    label: listing.sourceId,
                                  }),
                                )}
                              />
                            </div>
                          )}
                          <br />
                          {selectedSource !== null &&
                            listingResult.listing[selectedSource] &&
                            renderListingQuality(
                              listingResult.listing[selectedSource],
                              openIssues,
                              setOpenIssues,
                            )}
                        </>
                      )}
                    </div>
                    <div
                      className={classNames('tab-content', {
                        active: activeTab === 'reviews',
                      })}
                    >
                      <p>
                        {productResult.product &&
                        productResult.product.reviewAnalysis ? (
                          <>
                            <div className="card-deck">
                              {productResult.product.reviewAnalysis.pros && (
                                <Card
                                  className="mb-3 overflow-hidden"
                                  style={{
                                    minWidth: '12rem',
                                    background:
                                      'linear-gradient(#d0f7eb, #fff)',
                                  }}
                                >
                                  <CardBody className="position-relative">
                                    <h6>Best Features</h6>
                                    <div
                                      className={getContentClassNames(
                                        'success',
                                      )}
                                    >
                                      {Object.keys(
                                        productResult.product.reviewAnalysis
                                          .pros,
                                      )
                                        .sort(function (a, b) {
                                          return (
                                            productResult.product.reviewAnalysis
                                              .pros[b] -
                                            productResult.product.reviewAnalysis
                                              .pros[a]
                                          );
                                        })
                                        .map((key) => (
                                          <>
                                            <span
                                              key={key}
                                              className={getFontClass(
                                                key,
                                                Object.keys(
                                                  productResult.product
                                                    .reviewAnalysis.pros,
                                                ).sort(function (a, b) {
                                                  return (
                                                    productResult.product
                                                      .reviewAnalysis.pros[b] -
                                                    productResult.product
                                                      .reviewAnalysis.pros[a]
                                                  );
                                                }),
                                              )}
                                            >
                                              {key}
                                            </span>
                                            <br />
                                          </>
                                        ))}
                                    </div>
                                  </CardBody>
                                </Card>
                              )}
                              <Card
                                className="mb-3 overflow-hidden"
                                style={{
                                  minWidth: '12rem',
                                  background: 'linear-gradient(#ffe1da, #fff)',
                                }}
                              >
                                <CardBody className="position-relative">
                                  <h6>Worst Features</h6>
                                  <div
                                    className={getContentClassNames('warning')}
                                  >
                                    {Object.keys(
                                      productResult.product.reviewAnalysis.cons,
                                    )
                                      .sort(function (a, b) {
                                        return (
                                          productResult.product.reviewAnalysis
                                            .cons[b] -
                                          productResult.product.reviewAnalysis
                                            .cons[a]
                                        );
                                      })
                                      .map((key) => (
                                        <>
                                          <span
                                            key={key}
                                            className={getFontClass(
                                              key,
                                              Object.keys(
                                                productResult.product
                                                  .reviewAnalysis.cons,
                                              ).sort(function (a, b) {
                                                return (
                                                  productResult.product
                                                    .reviewAnalysis.cons[b] -
                                                  productResult.product
                                                    .reviewAnalysis.cons[a]
                                                );
                                              }),
                                            )}
                                          >
                                            {key}
                                          </span>
                                          <br />
                                        </>
                                      ))}
                                  </div>
                                </CardBody>
                              </Card>
                              <Card
                                className="mb-3 overflow-hidden"
                                style={{
                                  minWidth: '12rem',
                                  background: 'linear-gradient(#ceeeff, #fff)',
                                }}
                              >
                                <CardBody className="position-relative">
                                  <h6>Purchased For</h6>
                                  <div className={getContentClassNames('info')}>
                                    {Object.keys(
                                      productResult.product.reviewAnalysis
                                        .boughtFor,
                                    )
                                      .sort(function (a, b) {
                                        return (
                                          productResult.product.reviewAnalysis
                                            .boughtFor[b] -
                                          productResult.product.reviewAnalysis
                                            .boughtFor[a]
                                        );
                                      })
                                      .map((key) => (
                                        <>
                                          <span
                                            key={key}
                                            className={getFontClass(
                                              key,
                                              Object.keys(
                                                productResult.product
                                                  .reviewAnalysis.boughtFor,
                                              ).sort(function (a, b) {
                                                return (
                                                  productResult.product
                                                    .reviewAnalysis.boughtFor[
                                                    b
                                                  ] -
                                                  productResult.product
                                                    .reviewAnalysis.boughtFor[a]
                                                );
                                              }),
                                            )}
                                          >
                                            {key}
                                          </span>
                                          <br />
                                        </>
                                      ))}
                                  </div>
                                </CardBody>
                              </Card>
                              <Card
                                className="mb-3 overflow-hidden"
                                style={{
                                  minWidth: '12rem',
                                  background: 'linear-gradient(#ceeeff, #fff)',
                                }}
                              >
                                <CardBody className="position-relative">
                                  <h6>User Traits</h6>
                                  <div className={getContentClassNames('info')}>
                                    {Object.keys(
                                      productResult.product.reviewAnalysis
                                        .userTraits,
                                    )
                                      .sort(function (a, b) {
                                        return (
                                          productResult.product.reviewAnalysis
                                            .userTraits[b] -
                                          productResult.product.reviewAnalysis
                                            .userTraits[a]
                                        );
                                      })
                                      .map((key) => (
                                        <>
                                          <span
                                            key={key}
                                            className={getFontClass(
                                              key,
                                              Object.keys(
                                                productResult.product
                                                  .reviewAnalysis.userTraits,
                                              ).sort(function (a, b) {
                                                return (
                                                  productResult.product
                                                    .reviewAnalysis.userTraits[
                                                    b
                                                  ] -
                                                  productResult.product
                                                    .reviewAnalysis.userTraits[
                                                    a
                                                  ]
                                                );
                                              }),
                                            )}
                                          >
                                            {key}
                                          </span>
                                          <br />
                                        </>
                                      ))}
                                  </div>
                                </CardBody>
                              </Card>
                              <Card
                                className="mb-3 overflow-hidden"
                                style={{
                                  minWidth: '12rem',
                                  background: 'linear-gradient(#ceeeff, #fff)',
                                }}
                              >
                                <CardBody className="position-relative">
                                  <h6>Used For</h6>
                                  <div className={getContentClassNames('info')}>
                                    {Object.keys(
                                      productResult.product.reviewAnalysis
                                        .usedFor,
                                    )
                                      .sort(function (a, b) {
                                        return (
                                          productResult.product.reviewAnalysis
                                            .usedFor[b] -
                                          productResult.product.reviewAnalysis
                                            .usedFor[a]
                                        );
                                      })
                                      .map((key) => (
                                        <>
                                          <span
                                            key={key}
                                            className={getFontClass(
                                              key,
                                              Object.keys(
                                                productResult.product
                                                  .reviewAnalysis.usedFor,
                                              ).sort(function (a, b) {
                                                return (
                                                  productResult.product
                                                    .reviewAnalysis.usedFor[b] -
                                                  productResult.product
                                                    .reviewAnalysis.usedFor[a]
                                                );
                                              }),
                                            )}
                                          >
                                            {key}
                                          </span>
                                          <br />
                                        </>
                                      ))}
                                  </div>
                                </CardBody>
                              </Card>
                            </div>
                          </>
                        ) : (
                          <>There are not enough reviews to be analyzed.</>
                        )}
                      </p>
                    </div>
                    <div
                      className={classNames('tab-content', {
                        active: activeTab === 'productcopy',
                      })}
                    >
                      <FormGroup style={{ maxWidth: 400 }}>
                        <Label for="template">Copy Type</Label>
                        <InputGroup>
                          <Input
                            type="select"
                            name="template"
                            id="template"
                            onChange={({ target }) =>
                              setProductCopyType(target.value)
                            }
                          >
                            <option value="Product One-Liner">
                              Product One-Liner
                            </option>
                            <option value="Product Ideal For">
                              Product Ideal For
                            </option>
                            <option value="Product Description">
                              Product Description
                            </option>
                            {productResult.product?.description &&
                              productResult.product?.description.trim().length >
                                0 &&
                              productResult.product?.features &&
                              productResult.product?.description.length > 0 && (
                                <option value="Long Product Description">
                                  Long Product Description
                                </option>
                              )}
                            {productResult.product?.description &&
                              productResult.product?.description.trim().length >
                                0 &&
                              productResult.product?.features &&
                              productResult.product?.description.length > 0 && (
                                <option value="Extra Long Product Description">
                                  Extra Long Product Description
                                </option>
                              )}
                            <option value="Product Bullets">
                              Product Bullets
                            </option>
                          </Input>
                          <InputGroupAddon addonType="append">
                            <Button
                              color="primary"
                              size="sm"
                              className="float-right"
                              disabled={authoring}
                              onClick={handleAuthorProductCopy}
                            >
                              <FontAwesomeIcon icon={faMagic}></FontAwesomeIcon>{' '}
                              {authoring ? 'Authoring...' : 'Author'}
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormGroup>
                      <p>
                        {productResult.product?.content &&
                          productResult.product?.content[
                            'Product One-Liner'
                          ] && (
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
                                    sku={sku}
                                    contentId={contentId}
                                    copy={
                                      productResult.product.content[
                                        'Product One-Liner'
                                      ][contentId]
                                    }
                                    type="Product One-Liner"
                                    allProductCopy={
                                      productResult.product.content
                                    }
                                  />
                                ))}
                              </ul>
                            </>
                          )}
                        {productResult.product?.content &&
                          productResult.product?.content[
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
                                    sku={sku}
                                    contentId={contentId}
                                    copy={
                                      productResult.product.content[
                                        'Product Ideal For'
                                      ][contentId]
                                    }
                                    type="Product Ideal For"
                                    allProductCopy={
                                      productResult.product.content
                                    }
                                  />
                                ))}
                              </ul>
                            </>
                          )}
                        {productResult.product?.content &&
                          (productResult.product?.content[
                            'Product Description'
                          ] ||
                            productResult.product?.content[
                              'Product Rewritten Description'
                            ]) && (
                            <>
                              <strong>Product Descriptions</strong>
                              <br />
                              <ul>
                                {productResult.product &&
                                  productResult.product.content &&
                                  productResult.product.content[
                                    'Product Description'
                                  ] &&
                                  Object.keys(
                                    productResult.product.content[
                                      'Product Description'
                                    ],
                                  ).map((contentId) => (
                                    // eslint-disable-next-line react/jsx-key
                                    <ProductCopy
                                      sku={sku}
                                      contentId={contentId}
                                      copy={
                                        productResult.product.content[
                                          'Product Description'
                                        ][contentId]
                                      }
                                      type="Product Description"
                                      allProductCopy={
                                        productResult.product.content
                                      }
                                    />
                                  ))}
                                {productResult.product &&
                                  productResult.product.content &&
                                  productResult.product.content[
                                    'Product Rewritten Description'
                                  ] &&
                                  Object.keys(
                                    productResult.product.content[
                                      'Product Rewritten Description'
                                    ],
                                  ).map((contentId) => (
                                    <ProductCopy
                                      key={contentId}
                                      sku={sku}
                                      contentId={contentId}
                                      copy={
                                        productResult.product.content[
                                          'Product Rewritten Description'
                                        ][contentId]
                                      }
                                      type="Product Rewritten Description"
                                      allProductCopy={
                                        productResult.product.content
                                      }
                                    />
                                  ))}
                              </ul>
                            </>
                          )}

                        {productResult.product?.content &&
                          productResult.product?.content[
                            'Long Product Description'
                          ] && (
                            <>
                              <strong>Long Product Descriptions</strong>
                              <br />
                              <ul>
                                {productResult.product &&
                                  productResult.product.content &&
                                  productResult.product.content[
                                    'Long Product Description'
                                  ] &&
                                  Object.keys(
                                    productResult.product.content[
                                      'Long Product Description'
                                    ],
                                  ).map((contentId) => (
                                    <ProductCopy
                                      key={contentId}
                                      sku={sku}
                                      contentId={contentId}
                                      copy={
                                        productResult.product.content[
                                          'Long Product Description'
                                        ][contentId]
                                      }
                                      type="Long Product Description"
                                      allProductCopy={
                                        productResult.product.content
                                      }
                                    />
                                  ))}
                              </ul>
                            </>
                          )}

                        {productResult.product?.content &&
                          productResult.product?.content[
                            'Extra Long Product Description'
                          ] && (
                            <>
                              <strong>Extra Long Product Descriptions</strong>
                              <br />
                              <ul>
                                {productResult.product &&
                                  productResult.product.content &&
                                  productResult.product.content[
                                    'Extra Long Product Description'
                                  ] &&
                                  Object.keys(
                                    productResult.product.content[
                                      'Extra Long Product Description'
                                    ],
                                  ).map((contentId) => (
                                    <ProductCopy
                                      key={contentId}
                                      sku={sku}
                                      contentId={contentId}
                                      copy={
                                        productResult.product.content[
                                          'Extra Long Product Description'
                                        ][contentId]
                                      }
                                      type="Extra Long Product Description"
                                      allProductCopy={
                                        productResult.product.content
                                      }
                                    />
                                  ))}
                              </ul>
                            </>
                          )}

                        {productResult.product?.content &&
                          productResult.product?.content['Product Bullets'] && (
                            <>
                              <strong>Product Bullets</strong>
                              <br />
                              <ul>
                                {Object.keys(
                                  productResult.product.content[
                                    'Product Bullets'
                                  ],
                                ).map((contentId) => (
                                  <ProductCopy
                                    key={contentId}
                                    sku={sku}
                                    contentId={contentId}
                                    copy={
                                      productResult.product.content[
                                        'Product Bullets'
                                      ][contentId]
                                    }
                                    type="Product Bullets"
                                    allProductCopy={
                                      productResult.product.content
                                    }
                                  />
                                ))}
                              </ul>
                            </>
                          )}
                      </p>
                    </div>
                    <div
                      className={classNames('tab-content', {
                        active: activeTab === 'socialcopy',
                      })}
                    >
                      <FormGroup style={{ maxWidth: 400 }}>
                        <Label for="template">Copy Type</Label>
                        <InputGroup>
                          <Input
                            type="select"
                            name="template"
                            id="template"
                            onChange={({ target }) =>
                              setSocialCopyType(target.value)
                            }
                          >
                            <option value="Product Tweet">Tweet</option>
                            <option value="Product Instagram Post">
                              Instagram Post
                            </option>
                          </Input>
                          <InputGroupAddon addonType="append">
                            <Button
                              color="primary"
                              size="sm"
                              className="float-right"
                              disabled={authoring}
                              onClick={handleAuthorSocialCopy}
                            >
                              <FontAwesomeIcon icon={faMagic}></FontAwesomeIcon>{' '}
                              {authoring ? 'Authoring...' : 'Author'}
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormGroup>
                      <p>
                        {productResult.product &&
                          productResult.product.content &&
                          productResult.product.content['Product Tweet'] && (
                            <>
                              <strong>Tweets</strong>
                              <br />
                              <ul>
                                {productResult.product &&
                                  productResult.product.content &&
                                  Object.keys(
                                    productResult.product.content[
                                      'Product Tweet'
                                    ],
                                  ).map((contentId) => (
                                    <ProductCopy
                                      key={contentId}
                                      sku={sku}
                                      contentId={contentId}
                                      copy={
                                        productResult.product.content[
                                          'Product Tweet'
                                        ][contentId]
                                      }
                                      type="Product Tweet"
                                      allProductCopy={
                                        productResult.product.content
                                      }
                                    />
                                  ))}
                              </ul>
                            </>
                          )}
                        {productResult.product &&
                          productResult.product.content &&
                          productResult.product.content[
                            'Product Instagram Post'
                          ] && (
                            <>
                              <strong>Instagram Posts</strong>
                              <br />
                              <ul>
                                {productResult.product &&
                                  productResult.product.content &&
                                  Object.keys(
                                    productResult.product.content[
                                      'Product Instagram Post'
                                    ],
                                  ).map((contentId) => (
                                    <ProductCopy
                                      key={contentId}
                                      sku={sku}
                                      contentId={contentId}
                                      copy={
                                        productResult.product.content[
                                          'Product Instagram Post'
                                        ][contentId]
                                      }
                                      type="Product Instagram Post"
                                      allProductCopy={
                                        productResult.product.content
                                      }
                                    />
                                  ))}
                              </ul>
                            </>
                          )}
                      </p>
                    </div>

                    <div
                      className={classNames('tab-content', {
                        active: activeTab === 'qanda',
                      })}
                    >
                      <p>
                        {productResult.product &&
                          productResult.product.content &&
                          productResult.product.content[
                            'Description Question and Answer'
                          ] && (
                            <>
                              <strong>Description Q&amp;A</strong>
                              <br />
                              <ul>
                                {productResult.product &&
                                  productResult.product.content &&
                                  Object.keys(
                                    productResult.product.content[
                                      'Description Question and Answer'
                                    ],
                                  ).map((contentId) => (
                                    <ProductCopy
                                      key={contentId}
                                      sku={sku}
                                      contentId={contentId}
                                      copy={
                                        productResult.product.content[
                                          'Description Question and Answer'
                                        ][contentId]
                                      }
                                      type="Description Question and Answer"
                                      allProductCopy={
                                        productResult.product.content
                                      }
                                    />
                                  ))}
                              </ul>
                            </>
                          )}
                        {productResult.product &&
                          productResult.product.content &&
                          productResult.product.content[
                            'Review Question and Answer'
                          ] && (
                            <>
                              <strong>Review Q&amp;A</strong>
                              <br />
                              <ul>
                                {productResult.product &&
                                  productResult.product.content &&
                                  Object.keys(
                                    productResult.product.content[
                                      'Review Question and Answer'
                                    ],
                                  ).map((contentId) => (
                                    <ProductCopy
                                      key={contentId}
                                      sku={sku}
                                      contentId={contentId}
                                      copy={
                                        productResult.product.content[
                                          'Review Question and Answer'
                                        ][contentId]
                                      }
                                      type="Review Question and Answer"
                                      allProductCopy={
                                        productResult.product.content
                                      }
                                    />
                                  ))}
                              </ul>
                            </>
                          )}
                      </p>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
          </CardBody>
        </Card>
      )}
    </>
  );
}

const renderListingQuality = (listingResult, openIssues, setOpenIssues) => {
  const productErrors = listingResult.analyticsData.dataAnalysis.errors || [];
  const reviewErrors = listingResult.analyticsData.reviewAnalysis.errors || [];
  const qaErrors = listingResult.analyticsData.qaAnalysis.errors || [];
  const allErrors = [...productErrors, ...reviewErrors, ...qaErrors];

  const productWarnings =
    listingResult.analyticsData.dataAnalysis.warnings || [];
  const reviewWarnings =
    listingResult.analyticsData.reviewAnalysis.warnings || [];
  const qaWarnings = listingResult.analyticsData.qaAnalysis.warnings || [];
  const allWarnings = [...productWarnings, ...reviewWarnings, ...qaWarnings];

  const productSuccess =
    listingResult.analyticsData.dataAnalysis.successes || [];
  const reviewSuccess =
    listingResult.analyticsData.reviewAnalysis.successes || [];
  const qaSuccess = listingResult.analyticsData.qaAnalysis.successes || [];
  const allSuccess = [...productSuccess, ...reviewSuccess, ...qaSuccess];

  return (
    <>
      <div className="card-deck">
        <CardSummary
          title={
            listingResult.sourceId[0].toUpperCase() +
            listingResult.sourceId.slice(1) +
            ' Listing'
          }
          color="info"
          style={{ height: 90 }}
        >
          <a href={listingResult.url} target="_blank" rel="noreferrer">
            View &raquo;
          </a>
        </CardSummary>
        <CardSummary
          title="Overall Listing Score"
          color={listingResult.analyticsData.score < 80 ? 'warning' : 'success'}
          style={{ height: 90 }}
        >
          {listingResult.analyticsData.score}
        </CardSummary>
        <CardSummary
          title="Positive Signals"
          color="success"
          style={{ height: 90 }}
        >
          {allSuccess.length}
        </CardSummary>
        <CardSummary
          title="Negative Signals"
          color="warning"
          style={{ height: 90 }}
        >
          {allErrors.length + allWarnings.length}
        </CardSummary>
      </div>
      <Row>
        <Col xs={6}>
          <Card
            className="mb-3 overflow-hidden"
            style={{
              minWidth: '12rem',
              background: 'linear-gradient(#d0f7eb, #fff)',
            }}
          >
            <CardBody className="position-relative">
              <h3>👍 Looking Good</h3>
              <div className={getContentClassNames('success')}>
                {allSuccess.map((item) => (
                  <>
                    <span
                      className="fs--1 cursor-pointer"
                      onClick={() => {
                        openIssues.includes(item.message)
                          ? setOpenIssues(
                              openIssues.filter((i) => i !== item.message),
                            )
                          : setOpenIssues([...openIssues, item.message]);
                      }}
                    >
                      <FontAwesomeIcon icon={faPlusSquare} /> {item.message}
                    </span>
                    <Collapse isOpen={openIssues.includes(item.message)}>
                      <span
                        className="fs--1"
                        dangerouslySetInnerHTML={{ __html: item.value }}
                      />
                    </Collapse>
                    <br />
                  </>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xs={6}>
          <Card
            className="mb-3 overflow-hidden"
            style={{
              minWidth: '12rem',
              background: 'linear-gradient(#ffe1da, #fff)',
            }}
          >
            <CardBody className="position-relative">
              <h3>⚠️ Needs Attention</h3>
              <div className={getContentClassNames('warning')}>
                {allErrors.map((item) => (
                  <>
                    <span
                      className="fs--1 cursor-pointer"
                      onClick={() => {
                        openIssues.includes(item.message)
                          ? setOpenIssues(
                              openIssues.filter((i) => i !== item.message),
                            )
                          : setOpenIssues([...openIssues, item.message]);
                      }}
                    >
                      <FontAwesomeIcon icon={faPlusSquare} /> {item.message}
                    </span>
                    <Collapse isOpen={openIssues.includes(item.message)}>
                      <span
                        className="fs--1"
                        dangerouslySetInnerHTML={{ __html: item.value }}
                      />
                    </Collapse>
                    <br />
                  </>
                ))}
                {allWarnings.map((item) => (
                  <>
                    <span
                      className="fs--1 cursor-pointer"
                      onClick={() => {
                        openIssues.includes(item.message)
                          ? setOpenIssues(
                              openIssues.filter((i) => i !== item.message),
                            )
                          : setOpenIssues([...openIssues, item.message]);
                      }}
                    >
                      <FontAwesomeIcon icon={faPlusSquare} /> {item.message}
                    </span>
                    <Collapse isOpen={openIssues.includes(item.message)}>
                      <span
                        className="fs--1"
                        dangerouslySetInnerHTML={{ __html: item.value }}
                      />
                    </Collapse>
                    <br />
                  </>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default requireAuth(ProductPage);
