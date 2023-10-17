import React, { useState, useCallback, useEffect } from 'react';

import {
  Form,
  InputGroupAddon,
  Input,
  InputGroup,
  Card,
  CardBody,
  Row,
  Col,
  Button,
  FormGroup,
  Progress,
} from 'reactstrap';
import FalconCardHeader from '@components/common/FalconCardHeader';
import Accordion from '@components/common/accordion/Accordion';
import { runListingQualityService, useAnalysisData } from '@util/api';
import { isValidURL } from '@helpers/utils';
import { ListingAnalysisProcess } from '@util/enum';
import { getRating } from '@helpers/listing';

function ListingQualityPage() {
  const [url, setURL] = useState('');
  const [isInputValid, setInputValid] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const { result: analysisData, isFinished } = useAnalysisData(analysisId);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckQuality = useCallback(
    async (e) => {
      if (e) {
        e.preventDefault();
      }
      if (
        !url ||
        (!url.startsWith('https://www.amazon.com') &&
          !url.startsWith('https://amazon.com')) ||
        !isValidURL(url)
      ) {
        setInputValid(false);
      } else {
        setInputValid(true);
        setIsProcessing(true);
        const res = await runListingQualityService(url);
        if (res.success) {
          setAnalysisId(res.id);
        }
      }
    },
    [url],
  );

  useEffect(() => {
    if (isFinished === true) {
      setIsProcessing(false);
    }
  }, [analysisData]);

  return (
    <Card style={{ minHeight: 500 }} className="mb-3">
      <FalconCardHeader title="Amazon Listing Quality" light={false} />
      <CardBody className="bg-light">
        <Row>
          <Col xs={12}>
            <Form onSubmit={handleCheckQuality}>
              <FormGroup>
                <InputGroup>
                  <Input
                    placeholder="Listing URL"
                    value={url}
                    valid={isInputValid}
                    invalid={
                      isInputValid === null ? isInputValid : !isInputValid
                    }
                    onChange={(e) => setURL(e.target.value)}
                  />
                  <InputGroupAddon addonType="append">
                    <Button
                      color="primary"
                      type="submit"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Analyzing Listing...' : 'Check Quality'}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </FormGroup>
            </Form>
          </Col>
        </Row>

        {renderResults(analysisData)}
      </CardBody>
    </Card>
  );
}

const renderResults = (analysisData) => {
  if (!analysisData) return;
  const totalStepCount = 7;
  let completedCount = 0;
  let lastTask = null;
  for (const obj in analysisData.progress) {
    if (typeof analysisData.progress[obj] === 'object') {
      if (analysisData.progress[obj].status === 'Finished') {
        completedCount++;
      } else {
        lastTask = obj;
      }
    }
  }
  const activeTask = ListingAnalysisProcess[lastTask];
  let progress = (completedCount / totalStepCount) * 100;

  const productErrors =
    analysisData.listing_data?.productAnalysis?.errors || [];
  const reviewErrors = analysisData.listing_data?.reviewAnalysis?.errors || [];
  const qaErrors = analysisData.listing_data?.questionAnalysis?.errors || [];
  const allErrors = [...productErrors, ...reviewErrors, ...qaErrors];

  const productWarnings =
    analysisData.listing_data?.productAnalysis?.warnings || [];
  const reviewWarnings =
    analysisData.listing_data?.reviewAnalysis?.warnings || [];
  const qaWarnings =
    analysisData.listing_data?.questionAnalysis?.warnings || [];
  const allWarnings = [...productWarnings, ...reviewWarnings, ...qaWarnings];

  const productSuccess =
    analysisData.listing_data?.productAnalysis?.successes || [];
  const reviewSuccess =
    analysisData.listing_data?.reviewAnalysis?.successes || [];
  const qaSuccess =
    analysisData.listing_data?.questionAnalysis?.successes || [];
  const allSuccess = [...productSuccess, ...reviewSuccess, ...qaSuccess];

  const totalTestCount =
    allErrors.length + allWarnings.length + allSuccess.length;
  return (
    <Card>
      <CardBody>
        {progress < 100 && (
          <Row>
            <Col xs={12}>
              <Progress
                animated
                color="success"
                className="mb-3"
                value={progress}
                style={{ height: '40px' }}
              >
                <strong>{activeTask}</strong>
              </Progress>
              {/*<ul>
              {Object.keys(analysisData.progress)
                .filter((key) => typeof analysisData.progress[key] === 'object')
                .map((key) => {
                  return (
                    <li key={key}>
                      <b>{ListingAnalysisProcess[key]}:</b>
                      <span>{analysisData.progress[key].status}</span>
                    </li>
                  );
                })}
              </ul>*/}
            </Col>
          </Row>
        )}
        {analysisData.listing_data?.productData && (
          <>
            <Row>
              {analysisData.listing_data?.productData.images &&
                analysisData.listing_data?.productData.images.length > 0 && (
                  <Col xs={1} className="align-middle">
                    <img
                      src={
                        analysisData.listing_data.productData.images[0].large
                      }
                      style={{ maxHeight: 100, maxWidth: 116 }}
                    />
                  </Col>
                )}
              <Col className="align-middle">
                <h3>{analysisData.listing_data.productData.title}</h3>
              </Col>
              <Col
                xs={2}
                className="align-middle rounded"
                style={{
                  backgroundColor: '#0047AB',
                  color: 'white',
                  marginRight: 12,
                }}
              >
                <center>
                  <h1 style={{ color: 'white', paddingTop: 10 }}>
                    {totalTestCount
                      ? getRating(
                          totalTestCount,
                          allErrors.length,
                          allWarnings.length,
                        )
                      : '?'}
                  </h1>
                  <small>Listing Quality Rating</small>
                </center>
              </Col>
            </Row>
            <br />
            <Row>
              <Col xs={12}>
                {allErrors.map((e) => (
                  <>
                    <Accordion
                      open={true}
                      style={{ backgroundColor: 'rgba(210, 43, 43, .7)' }}
                      title={e.label + ': ' + e.message}
                      description={
                        <>
                          <span dangerouslySetInnerHTML={{ __html: e.value }} />
                        </>
                      }
                    />
                  </>
                ))}
                {allWarnings.map((e) => (
                  <>
                    <Accordion
                      open={true}
                      style={{ backgroundColor: 'rgba(255, 234, 0, .7)' }}
                      title={e.label + ': ' + e.message}
                      description={
                        <>
                          <span dangerouslySetInnerHTML={{ __html: e.value }} />
                        </>
                      }
                    />
                  </>
                ))}
                {allSuccess.map((e) => (
                  <>
                    <Accordion
                      open={true}
                      style={{ backgroundColor: 'rgba(8, 143, 143, .7)' }}
                      title={e.label + ': ' + e.message}
                      description={
                        <>
                          <span dangerouslySetInnerHTML={{ __html: e.value }} />
                        </>
                      }
                    />
                  </>
                ))}
                {/*<br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
              {JSON.stringify(analysisData.listing_data)}*/}
              </Col>
            </Row>
          </>
        )}
      </CardBody>
    </Card>
  );
};

ListingQualityPage.showNav = false;
export default ListingQualityPage;
