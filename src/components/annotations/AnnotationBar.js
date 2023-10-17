import React from 'react';
import { Card, CardBody, Button } from 'reactstrap';
import Loader from '@components/common/Loader';
import FalconCardHeader from '@components/common/FalconCardHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge } from 'reactstrap';
import Flex from '@components/common/Flex';
import FilterSelect from '@components/FilterSelect';
import { loadAnnotationTopicOptions } from '@util/load-options';

const AnnotationBar = (props) => {
  const {
    annotationTypeLoading,
    annotationTypes,
    annotations,
    updateAnnotationTopic,
    onClickRemoveAnnotation,
    onPredict,
    isComposing,
  } = props;
  return (
    <Card>
      <FalconCardHeader title="Annotations">
        <Button
          color="falcon-primary"
          size="sm"
          className="mr-2"
          onClick={onPredict}
          disabled={isComposing}
        >
          Predict
        </Button>
      </FalconCardHeader>
      <CardBody>
        {annotationTypeLoading && <Loader />}
        {!annotationTypeLoading && annotationTypes && (
          <>
            {annotationTypes.length > 0 &&
              annotationTypes.map((aType, index) => (
                <div key={aType.annotationTypeId}>
                  <AnnotationItem
                    annotationType={aType}
                    annotations={annotations}
                    updateAnnotationTopic={updateAnnotationTopic}
                    handleClick={onClickRemoveAnnotation}
                  />
                  {index + 1 !== annotationTypes.length && (
                    <hr className="border-dashed border-bottom-0" />
                  )}
                </div>
              ))}
          </>
        )}
      </CardBody>
    </Card>
  );
};

const AnnotationItem = ({
  annotationType,
  annotations,
  updateAnnotationTopic,
  handleClick,
}) => {
  const getTopicOptions = async (qeury, annotation, annotationTypeId) => {
    const res = await loadAnnotationTopicOptions(qeury, annotationTypeId);
    if (res.length > 0) {
      updateAnnotationTopic(annotation, res[0]);
    }

    return res;
  };

  return (
    <div className="position-relative btn-reveal-trigger anntotiaon-list">
      <Badge style={{ backgroundColor: `#${annotationType.color}` }} pill>
        {annotationType.name}
      </Badge>
      {annotations?.length > 0 && (
        <ul className="list-unstyled mt-3" style={{ fontSize: '0.875rem' }}>
          {annotations
            .filter(
              (annotation) =>
                annotationType.annotationTypeId === annotation.annotationTypeId,
            )
            ?.map((annotation, index) => (
              <li key={`${annotation.annotationTypeId}_${index}`}>
                <Flex align="center">
                  <FontAwesomeIcon
                    icon="times-circle"
                    size="lg"
                    transform="shrink-4 down-2"
                    className="text-primary mr-2 cursor-pointer"
                    onClick={(e) =>
                      handleClick(
                        `${annotationType.name
                          .toLowerCase()
                          .replaceAll(/\s/g, '')}_${annotation.startIndex}_${
                          annotation.endIndex
                        }_${annotation.source}`,
                        annotation.excerpt,
                      )
                    }
                  />
                  <Flex
                    align="center"
                    justify="between"
                    style={{ width: '100%' }}
                  >
                    <p className="mb-0">{annotation.excerpt}</p>

                    <div className="flex-shrink-0">
                      <FilterSelect
                        label=""
                        placeholder="Select or enter a topic"
                        value={
                          annotation?.topic
                            ? {
                                label: annotation?.topic,
                                value: annotation?.topicId || annotation?.topic,
                              }
                            : ''
                        }
                        onChange={(value) =>
                          updateAnnotationTopic(annotation, value)
                        }
                        defaultOptions
                        loadOptions={(inputValue) =>
                          getTopicOptions(
                            inputValue || annotation.excerpt,
                            annotation,
                            annotationType.annotationTypeId,
                          )
                        }
                        isClearable={true}
                        isCreatable={true}
                      />
                    </div>
                  </Flex>
                </Flex>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default AnnotationBar;
