import React, { useState, useEffect, useCallback } from 'react';
import { requireAuth } from '@util/auth.js';
import { useRouter } from 'next/router';
import { Card, CardBody, Row, Col } from 'reactstrap';
import { toast } from 'react-toastify';
import Loader from '@components/common/Loader';
import FalconCardHeader from '@components/common/FalconCardHeader';
import AnnotationBar from '@components/annotations/AnnotationBar';
import AnnotationEditor from '@components/annotation-editor';
import Header from '@components/annotations/Header';
import { isEmpty } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import {
  useGetReview,
  useGetAnnotationTypes,
  useGetReviewAnnotations,
  updateReviewAnnotations,
  getCompletion,
} from '@util/api';
import { dateFormatter } from '@helpers/formatter';
import { ReviewSource } from '@util/enum';

function ReviewPage() {
  const [annotations, setAnnotations] = useState();
  const [reviewTitleValue, setReviewTitleValue] = useState(getInitialValue(''));
  const [reviewTextValue, setReviewTextValue] = useState(getInitialValue(''));
  const [isComposing, setIsComposing] = useState(false);

  const [removeAnnotationInTitle, setRemoveAnnotationInTitle] = useState(null);
  const [removeAnnotationInText, setRemoveAnnotationInText] = useState(null);
  const router = useRouter();
  const id = router.query?.id;
  const {
    status: reviewStatus,
    isLoading: reviewLoading,
    data: reviewsResult,
  } = useGetReview(id);

  const {
    status: annotationTypeSatus,
    isLoading: annotationTypeLoading,
    data: annotationTypesResult,
  } = useGetAnnotationTypes();

  const {
    status: annotationsSatus,
    isLoading: annotationsLoading,
    data: annotationsResult,
  } = useGetReviewAnnotations(id);

  useEffect(() => {
    if (annotationsResult?.annotations?.length > 0)
      setAnnotations(annotationsResult.annotations);
  }, [annotationsResult]);

  const onPredict = useCallback(async () => {
    if (reviewsResult?.reviews?.length === 1) {
      setIsComposing(true);
      const rev = reviewsResult.reviews[0];
      const settings = {
        componentId: 'Best Buy Review Annotation',
        tokens: {
          productName: rev.productName,
          reviewTitle: rev.title,
          reviewText: rev.text,
        },
      };
      const res = await getCompletion(settings);

      if (res?.success) {
        const composition = res.composition;
        if (composition?.length > 0) {
          let [annotatedTitle, annotatedText] = composition.split(
            '\nAnnotated review text:',
          );
          annotatedTitle = annotatedTitle?.trim();
          annotatedText = annotatedText?.trim();

          const annotionsForTitle = await disassembleAnnotations(
            annotatedTitle,
            ReviewSource.Title,
            annotationTypesResult?.annotationTypes,
          );
          updateInitValues(
            ReviewSource.Title,
            annotionsForTitle.text,
            annotionsForTitle.annotations,
          );

          const annotionsForText = await disassembleAnnotations(
            annotatedText,
            ReviewSource.Text,
            annotationTypesResult?.annotationTypes,
          );
          updateInitValues(
            ReviewSource.Text,
            annotionsForText.text,
            annotionsForText.annotations,
          );
          setAnnotations([
            ...annotionsForTitle.annotations,
            ...annotionsForText.annotations,
          ]);
        }
      }
      setIsComposing(false);
    }
  }, [reviewsResult, annotationTypesResult]);

  const onSave = useCallback(async () => {
    if (isEmpty(annotations) || isEmpty(reviewsResult?.reviews)) return;

    const emtpyTopics = annotations.filter(
      (annotation) => !annotation.topic || !annotation.topicId,
    );

    if (emtpyTopics.length > 0) {
      toast.error('You must assign a topic to all annotations. ', {
        theme: 'colored',
      });

      return;
    }

    const annotatedTitle = await assembleAnnotations(
      reviewsResult?.reviews[0]?.title,
      ReviewSource.Title,
      annotations,
    );
    const annotatedText = await assembleAnnotations(
      reviewsResult?.reviews[0]?.text,
      ReviewSource.Text,
      annotations,
    );

    const res = await updateReviewAnnotations(reviewsResult?.reviews[0], {
      annotatedTitle,
      annotatedText,
      annotations,
    });

    if (res.success) {
      toast.success('Review annotaions saved!', { theme: 'colored' });
    } else {
      toast.error(
        'There was a problem saving the review annotations: ' + res.message,
        {
          theme: 'colored',
        },
      );
    }
  }, [annotations, reviewsResult]);

  const updateInitValues = async (source, text, annotations) => {
    if (!text) return;
    if (source === ReviewSource.Title) {
      if (annotations?.length > 0)
        setReviewTitleValue(await getEditorValue(text, source, annotations));
      else setReviewTitleValue(getInitialValue(text));
    }
    if (source === ReviewSource.Text) {
      if (annotations?.length > 0)
        setReviewTextValue(await getEditorValue(text, source, annotations));
      else setReviewTextValue(getInitialValue(text));
    }
  };

  useEffect(() => {
    if (
      !(
        annotationTypeSatus === 'success' &&
        annotationTypesResult?.annotationTypes
      )
    )
      return;
    if (!(reviewStatus === 'success' && reviewsResult?.reviews?.length > 0))
      return;

    if (!(annotationsSatus === 'success')) return;

    if (reviewsResult.reviews[0]?.title) {
      updateInitValues(
        ReviewSource.Title,
        reviewsResult.reviews[0].title,
        annotationsResult?.annotations,
      ).catch(console.error);
    }

    if (reviewsResult.reviews[0]?.text) {
      updateInitValues(
        ReviewSource.Text,
        reviewsResult.reviews[0].text,
        annotationsResult?.annotations,
      ).catch(console.error);
    }
  }, [annotationsResult, reviewsResult, annotationTypesResult]);

  const handleAddAnnotation = (formatKey, excerpt) => {
    const [annotationType, startIndex, endIndex, source] = formatKey.split('_');
    const newAnnotations = [
      ...(annotations || []),
      {
        source,
        annotationType,
        annotationTypeId: annotationTypesResult?.annotationTypes?.find(
          (aType) =>
            aType.name.toLowerCase().replaceAll(/\s/g, '') === annotationType,
        )?.annotationTypeId,
        startIndex: parseInt(startIndex),
        endIndex: parseInt(endIndex),
        excerpt,
      },
    ];
    setAnnotations(newAnnotations);
  };

  const handleRemoveAnnotation = (formatKey, excerpt) => {
    const [annotationType, startIndex, endIndex, source] = formatKey.split('_');
    const annotationTypeId = annotationTypesResult?.annotationTypes?.find(
      (aType) =>
        aType.name.toLowerCase().replaceAll(/\s/g, '') === annotationType,
    )?.annotationTypeId;
    const newAnnotations = annotations.filter(
      (annotation) =>
        !(
          annotation.source === source &&
          annotation.annotationType === annotationType &&
          annotation.annotationTypeId === annotationTypeId &&
          annotation.startIndex === parseInt(startIndex) &&
          annotation.endIndex === parseInt(endIndex) &&
          annotation.excerpt === excerpt
        ),
    );
    setAnnotations(newAnnotations);
  };

  const onClickRemoveAnnotation = (formatKey, excerpt) => {
    const source = formatKey.split('_')[3];
    if (source === ReviewSource.Title)
      setRemoveAnnotationInTitle({ formatKey, excerpt });
    else setRemoveAnnotationInText({ formatKey, excerpt });
  };

  const updateAnnotationTopic = (annotation, topic) => {
    const newAnnotations = annotations.map((a) => {
      if (
        annotation.source === a.source &&
        annotation.annotationType === a.annotationType &&
        annotation.annotationTypeId === a.annotationTypeId &&
        annotation.startIndex === a.startIndex &&
        annotation.endIndex === a.endIndex &&
        annotation.excerpt === a.excerpt
      ) {
        a.topic = topic?.label || '';
        a.topicId = topic?.value || '';
      }
      return a;
    });

    setAnnotations(newAnnotations);
  };

  return (
    <>
      <Header onSave={onSave} />
      <br />
      <Row>
        <Col lg={7} className="pr-lg-2">
          <Card>
            <FalconCardHeader title="Review" />
            <CardBody className="annotate-review-container">
              {reviewLoading && <Loader />}
              {!reviewLoading && reviewsResult?.reviews?.length > 0 && (
                <>
                  <Row>
                    <Col sm={2}>
                      <span>
                        <b>Title</b>
                      </span>
                    </Col>
                    <Col sm={10}>
                      <AnnotationEditor
                        annotationTypes={annotationTypesResult?.annotationTypes}
                        source={ReviewSource.Title}
                        initValue={reviewTitleValue}
                        removeAnnotation={removeAnnotationInTitle}
                        handleAddAnnotation={handleAddAnnotation}
                        handleRemoveAnnotation={handleRemoveAnnotation}
                      />
                      <hr className="border-dashed border-bottom-0" />
                    </Col>
                  </Row>

                  <Row>
                    <Col sm={2}>
                      <span>
                        <b>Content</b>
                      </span>
                    </Col>
                    <Col sm={10}>
                      <AnnotationEditor
                        annotationTypes={annotationTypesResult?.annotationTypes}
                        source="reviewText"
                        initValue={reviewTextValue}
                        removeAnnotation={removeAnnotationInText}
                        handleAddAnnotation={handleAddAnnotation}
                        handleRemoveAnnotation={handleRemoveAnnotation}
                      />
                      <hr className="border-dashed border-bottom-0" />
                    </Col>
                  </Row>
                  <Row>
                    <Col sm={2}>
                      <span>
                        <b>Author</b>
                      </span>
                    </Col>
                    <Col sm={10}>
                      {reviewsResult.reviews[0].author}
                      <hr className="border-dashed border-bottom-0" />
                    </Col>
                  </Row>

                  <Row>
                    <Col sm={2}>
                      <span>
                        <b>Date</b>
                      </span>
                    </Col>
                    <Col sm={10}>
                      {dateFormatter(reviewsResult.reviews[0].submissionTime)}
                    </Col>
                  </Row>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col lg={5} className="pl-lg-2 mb-3 mb-lg-0 pr-lg-2">
          <AnnotationBar
            annotationTypeLoading={annotationTypeLoading}
            annotationTypes={annotationTypesResult?.annotationTypes}
            annotations={annotations || []}
            updateAnnotationTopic={updateAnnotationTopic}
            onClickRemoveAnnotation={onClickRemoveAnnotation}
            onPredict={onPredict}
            isComposing={isComposing}
          />
        </Col>
      </Row>
    </>
  );
}

const compareAnnotations = (a, b) => {
  if (a.endIndex > b.endIndex) {
    return -1;
  } else if (a.endIndex < b.endIndex) {
    return 1;
  } else {
    if (a.startIndex > b.startIndex) {
      return 1;
    } else if (a.startIndex < b.startIndex) {
      return -1;
    } else {
      return 0;
    }
  }
};

const assembleAnnotations = async (text, type, annotations) => {
  const sortedAnnotations = annotations
    .filter((a) => a.source === type)
    .sort(compareAnnotations);

  let annotatedText = '';
  for (let i = text?.length; i >= 0; i--) {
    for (let j = 0; j < sortedAnnotations.length; j++) {
      if (sortedAnnotations[j].endIndex === i) {
        annotatedText =
          `[/${sortedAnnotations[j].annotationType} "${sortedAnnotations[j].topic}"]` +
          annotatedText;
      }
    }
    for (let j = 0; j < sortedAnnotations.length; j++) {
      if (sortedAnnotations[j].startIndex === i) {
        annotatedText =
          `[${sortedAnnotations[j].annotationType} "${sortedAnnotations[j].topic}"]` +
          annotatedText;
      }
    }
    if (i > 0) annotatedText = text[i - 1] + annotatedText;
  }

  return annotatedText;
};

const disassembleAnnotations = async (annotated, textType, annotationTypes) => {
  let annotations = [];
  let annotatedText = annotated;

  for (let i = 0; i <= annotatedText?.length; i++) {
    if (annotatedText[i] === '[' && annotatedText[i + 1] !== '/') {
      const openTag = annotatedText.substring(
        i,
        annotatedText.indexOf(']', i + 1) + 1,
      );
      const { annotationType, topic } = annotionTag(openTag);
      annotations.push({
        topic: topic,
        source: textType,
        topicId: uuidv4(),
        startIndex: i,
        annotationType: annotationType,
        annotationTypeId: annotationTypes.find(
          (t) => t.name.toLowerCase().replaceAll(/\s/g, '') === annotationType,
        )?.annotationTypeId,
      });

      annotatedText = annotatedText.replace(openTag, '');
      i--;
    } else if (annotatedText[i] === '[' && annotatedText[i + 1] === '/') {
      const closeTag = annotatedText.substring(
        i,
        annotatedText.indexOf(']', i + 1) + 1,
      );

      const { annotationType, topic } = annotionTag(closeTag);
      const index = annotations.findIndex(
        (a) => a.annotationType === annotationType && a.topic === topic,
      );

      if (index !== -1) {
        let excerpt = annotatedText.slice(annotations[index].startIndex, i);

        annotations[index].endIndex = i;
        annotations[index].excerpt = excerpt;
      }
      annotatedText = annotatedText.replace(closeTag, '');
      i--;
    }
  }

  return { text: annotatedText, annotations: annotations };
};

const annotionTag = (tag) => {
  if (!(tag.startsWith('[') && tag.endsWith(']')))
    return { annotationType: null, topic: null };
  let text = tag.slice(1, -1);
  if (text.startsWith('/')) text = text.slice(1);
  return {
    annotationType: text.slice(0, text.indexOf(' ')),
    topic: text.slice(text.indexOf(' ') + 1).slice(1, -1),
  };
};

const getEditorValue = async (text, type, annotations) => {
  const filteredAnnotations = annotations.filter((a) => a.source === type);

  let children = [];
  let annotatedText = '';
  let annotationKeys = [];
  for (let i = 0; i <= text?.length; i++) {
    for (let j = 0; j < filteredAnnotations.length; j++) {
      if (filteredAnnotations[j].startIndex === i) {
        if (annotatedText.length > 0) {
          const item = { text: annotatedText };
          for (const key of annotationKeys) {
            item[key] = true;
          }
          children.push(item);
        }
        annotationKeys.push(
          `${filteredAnnotations[j].annotationType}_${filteredAnnotations[j].startIndex}_${filteredAnnotations[j].endIndex}_${filteredAnnotations[j].source}`,
        );
        annotatedText = '';
      }
    }

    for (let j = 0; j < filteredAnnotations.length; j++) {
      if (filteredAnnotations[j].endIndex === i) {
        if (annotatedText.length > 0) {
          const item = { text: annotatedText };
          for (const key of annotationKeys) {
            item[key] = true;
          }
          children.push(item);
        }

        annotationKeys = annotationKeys.filter(
          (key) =>
            key !==
            `${filteredAnnotations[j].annotationType}_${filteredAnnotations[j].startIndex}_${filteredAnnotations[j].endIndex}_${filteredAnnotations[j].source}`,
        );
        annotatedText = '';
      }
    }

    if (i < text.length) annotatedText = annotatedText + text[i];
  }

  if (annotatedText.length > 0) children.push({ text: annotatedText });
  return [{ children }];
};

const getInitialValue = (text) => {
  return [
    {
      children: [{ text: text }],
    },
  ];
};

export default requireAuth(ReviewPage);
