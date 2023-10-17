import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Col,
  Row,
  Spinner,
  UncontrolledPopover,
  PopoverHeader,
  PopoverBody,
  Input,
} from 'reactstrap';
import Flex from '../../common/Flex';
import classNames from 'classnames';
import ButtonIcon from '../../common/ButtonIcon';
import AppContext from '../../../context/Context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faEdit,
  faGift,
  faRefresh,
  faTrash,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';
import StarCount from './StarCount';
import renderConfirmDialog from '@components/ConfirmDialog';
import CategoryChip from './CategoryChip';
import { useEditPageContext } from '@context/EditPageContext';

const ProductList = (props) => {
  const {
    id,
    pagetitle,
    image,
    images,
    reviewPros,
    reviewCons,
    url,
    name,
    category,
    features,
    highlights,
    regularPrice,
    sale,
    averageRating,
    reviewCount,
    salePrice,
    review,
    shippingCost,
    isInStock,
    isNew,
    sliderSettings,
    pinned,
    handlePin,
    handleExclude,
    handleExcludedCategory,
    index,
    includeReviewExcerpts,
    includeBlurbs,
    includeParagraphs,
    includePros,
    includeCons,
    isAuthoringBlurb,
    pageContent,
    isAuthoringParagraph,
    onRewriteBlurb,
    onUpdateBlurb,
    onRewriteParagraph,
    onChangeImage,
    onSuppressExcerpt,
    onUpdateExcerpt,
    translations,
  } = props;

  const blurb =
    pageContent?.['blurb|' + pagetitle.toLowerCase().replace(/"/g, '\\"')] ||
    null;
  const paragraph =
    pageContent?.[
      'paragraph|' + pagetitle.toLowerCase().replace(/"/g, '\\"')
    ] || null;

  const { currency, isDark } = useContext(AppContext);
  const { language } = useEditPageContext();
  const [isEditingBlurb, setEditingBlurb] = useState(false);
  const [blurbContent, setBlurbContent] = useState(blurb);
  const [editingExcerpt, setEditingExcerpt] = useState(null);
  const [excerptContent, setExcerptContent] = useState('');

  const handleSuppressExcerpt = useCallback(
    (excerptIndex) => {
      renderConfirmDialog(
        'Suppress Excerpt',
        'Do you really want to suppress this excerpt?',
      ).then(() => {
        onSuppressExcerpt(index, excerptIndex);
      });
    },
    [index],
  );

  // const handleUpdateExcerpt = useCallback(
  //   (excerptIndex) => {
  //     setExcerptContent(highlights[excerptIndex]);
  //     setEditingExcerpt(excerptIndex);
  //   },
  //   [highlights],
  // );

  useEffect(() => {
    if (blurbContent !== blurb) {
      setBlurbContent(blurb);
    }
  }, [blurb]);

  return (
    <Col
      xs={12}
      className={classNames('p-3', { 'bg-100': isDark && index % 2 !== 0 })}
    >
      <div className="p-1">
        <Row>
          <Col sm={5} md={4}>
            <div className="position-relative h-sm-100">
              {image && image !== '' && (
                <>
                  <div className="d-block h-100">
                    <img
                      className="img-fluid"
                      src={image}
                      style={{ maxHeight: 200 }}
                      alt={name}
                      id={'img' + index}
                      tabIndex={index}
                    />
                  </div>
                  <UncontrolledPopover
                    placement="right"
                    trigger="focus"
                    target={'img' + index}
                  >
                    <PopoverHeader>Pick a Product Image</PopoverHeader>
                    <PopoverBody>
                      <Row noGutters={true}>
                        {images &&
                          images.map((img, ix) => (
                            <span key={ix}>
                              <img
                                alt={name}
                                src={img}
                                style={{ maxHeight: 150, cursor: 'pointer' }}
                                onMouseDown={(e) => {
                                  onChangeImage(id, index, img);
                                }}
                              />
                              <br />
                            </span>
                          ))}
                      </Row>
                    </PopoverBody>
                  </UncontrolledPopover>
                </>
              )}
              {(!image || image === '') && (
                <FontAwesomeIcon icon={faGift} size="10x" />
              )}
            </div>
          </Col>
          <Col sm={7} md={8}>
            <Row>
              <Col lg={10}>
                <h5 className="mt-3 mt-sm-0">
                  <a
                    className="text-dark fs-0 fs-lg-1"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {translations?.[language]
                      ? translations[language].name
                      : name}
                  </a>
                </h5>
                <p className="fs--1 mb-2 mb-md-3">
                  <span className="text-500">
                    {id}
                    <br />
                    <CategoryChip
                      color="outline-danger"
                      text={category}
                      handleClick={handleExcludedCategory}
                    />
                  </span>
                  {averageRating && (
                    <>
                      <br />
                      <StarCount stars={averageRating} /> ({reviewCount})
                    </>
                  )}
                </p>
                {includePros && reviewPros && reviewPros.length > 0 && (
                  <>
                    <strong>Pros:</strong> {reviewPros.slice(0, 5).join(', ')}
                    <br />
                  </>
                )}
                {includeCons && reviewCons && reviewCons.length > 0 && (
                  <>
                    <strong>Cons</strong>: {reviewCons.slice(0, 5).join(', ')}
                    <br />
                  </>
                )}
                {(includePros || includeCons) && (
                  <div className="mb-2 mb-md-3"></div>
                )}
                {includeBlurbs &&
                  (isAuthoringBlurb ? (
                    <div className="mb-2 mb-md-3">
                      <Spinner size="sm" /> Authoring blurb...
                      <br />
                    </div>
                  ) : blurb && blurb.length > 0 ? (
                    <>
                      {isEditingBlurb ? (
                        <div className="mb-2 mb-md-3">
                          <Input
                            type="textarea"
                            defaultValue={blurbContent}
                            onChange={(e) => setBlurbContent(e.target.value)}
                          />
                          &nbsp;
                          <FontAwesomeIcon
                            icon={faCheck}
                            size="sm"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              onUpdateBlurb(index, blurbContent);
                              setEditingBlurb(false);
                            }}
                          />
                          &nbsp;
                          <FontAwesomeIcon
                            icon={faUndo}
                            size="sm"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingBlurb(false);
                              setBlurbContent(blurb);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="mb-2 mb-md-3">
                          <strong>{blurb}</strong>&nbsp;
                          <FontAwesomeIcon
                            icon={faEdit}
                            size="sm"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingBlurb(true);
                            }}
                          />
                          &nbsp;
                          <FontAwesomeIcon
                            icon={faRefresh}
                            style={{ cursor: 'pointer' }}
                            onClick={() => onRewriteBlurb(index)}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <ButtonIcon
                        color={'outline-warning'}
                        size="sm"
                        className={classNames('w-lg-30 mt-2 mr-2 mr-lg-0')}
                        icon={faRefresh}
                        onClick={() => {
                          onRewriteBlurb(index);
                        }}
                      >
                        Author Missing Blurb
                      </ButtonIcon>
                      <br />
                    </>
                  ))}

                {includeParagraphs &&
                  (isAuthoringParagraph ? (
                    <div className="mb-2 mb-md-3">
                      <Spinner size="sm" /> Authoring paragraph...
                    </div>
                  ) : paragraph ? (
                    <div className="mb-2 mb-md-3">
                      {paragraph}{' '}
                      <FontAwesomeIcon
                        icon={faRefresh}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onRewriteParagraph(index)}
                      />
                    </div>
                  ) : (
                    <>
                      <ButtonIcon
                        color={'outline-warning'}
                        size="sm"
                        className={classNames('w-lg-30 mt-2 mr-2 mr-lg-0')}
                        icon={faRefresh}
                        onClick={() => {
                          onRewriteParagraph(index);
                        }}
                      >
                        Author Missing Paragraph
                      </ButtonIcon>
                    </>
                  ))}

                {includeReviewExcerpts &&
                  highlights &&
                  highlights.length > 0 && (
                    <div className="mb-2 mb-md-3">
                      {highlights.map((highlight, excerptIndex) =>
                        excerptIndex === editingExcerpt ? (
                          <div key={excerptIndex}>
                            <Input
                              type="textarea"
                              defaultValue={highlight}
                              onChange={(e) =>
                                setExcerptContent(e.target.value)
                              }
                            />
                            &nbsp;
                            <FontAwesomeIcon
                              icon={faCheck}
                              size="sm"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                onUpdateExcerpt(
                                  index,
                                  excerptIndex,
                                  excerptContent,
                                );
                                setEditingExcerpt(null);
                              }}
                            />
                            &nbsp;
                            <FontAwesomeIcon
                              icon={faUndo}
                              size="sm"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                setEditingExcerpt(null);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="fs--1" key={excerptIndex}>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: `...${highlight
                                  .replaceAll('<em>', '<strong>')
                                  .replaceAll('</em>', '</strong>')}...`,
                              }}
                            />
                            &nbsp;
                            {/* <FontAwesomeIcon
                            icon={faEdit}
                            size="sm"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              handleUpdateExcerpt(excerptIndex);
                            }}
                          />
                          &nbsp; */}
                            <FontAwesomeIcon
                              icon={faTrash}
                              size="sm"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                handleSuppressExcerpt(excerptIndex);
                              }}
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}
              </Col>
              <Col lg={2} tag={Flex} column>
                {salePrice && regularPrice && salePrice < regularPrice ? (
                  <>
                    <h6
                      className="fs-0 fs-md-0 text-warning mb-0"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {currency}
                      {salePrice.toFixed(2)}
                    </h6>
                    <p
                      className="fs--1 fs-md--1 mb-0"
                      style={{
                        whiteSpace: 'nowrap',
                        textDecoration: 'line-through',
                      }}
                    >
                      {currency}
                      {regularPrice.toFixed(2)}
                    </p>
                  </>
                ) : (
                  <>
                    <h6
                      className="fs-0 fs-md-0 text-warning mb-0"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {currency}
                      {salePrice?.toFixed(2) || regularPrice?.toFixed(2) || '?'}
                    </h6>
                  </>
                )}
                <div className="mt-md-2">
                  <ButtonIcon
                    color={pinned ? 'primary' : 'outline-secondary'}
                    size="sm"
                    className={classNames('w-lg-30 mt-2 mr-2 mr-lg-0')}
                    icon="thumbtack"
                    onClick={(e) => {
                      handlePin(id);
                    }}
                  ></ButtonIcon>
                  <br />
                  <ButtonIcon
                    color={'outline-danger'}
                    size="sm"
                    className={classNames('w-lg-30 mt-2 mr-2 mr-lg-0')}
                    icon="times"
                    onClick={(e) => {
                      handleExclude(id);
                    }}
                  ></ButtonIcon>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </Col>
  );
};

ProductList.defaultProps = { isNew: false, isInStock: false, files: [] };

export default ProductList;
