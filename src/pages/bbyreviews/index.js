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
  Progress
} from 'reactstrap';
import { fetchUrl, analyzeReview } from '@util/api';
import CardSummary from '@components/dashboard/CardSummary';
import FalconCardHeader from '@components/common/FalconCardHeader';
import stopword from 'stopword';
import { stem } from '@util/string';
import Router from 'next/router';

function BestBuyReviewsPage({ req }) {
  const [url, setURL] = useState(Router.query.sku);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [progress, setProgress] = useState(0);
  const [topPros, setTopPros] = useState();
  const [topCons, setTopCons] = useState();
  const [topUses, setTopUses] = useState();

  const handleCheckQuality = useCallback(async (e) => {

    const fetchAndAnalyzeSku = async (sku) => {
      setReviews([]);
      setProgress(0);
      setTopPros(null);
      setTopCons(null);
      setTopUses(null);
      const reviewUrl = 'https://0q2ff0c09l.execute-api.us-east-1.amazonaws.com/staging/topreviews?o=101072e19&limit=100&sku=' + sku;
      const reviewsObj = await fetchUrl(reviewUrl);
      const allReviews = [];
      if (reviewsObj && reviewsObj.length > 0) {
        const stemLookup = new Map();
        const proStemCounts = new Map();
        const conStemCounts = new Map();
        const useStemCounts = new Map();
        for (let i = 0; i < reviewsObj.length; i++) {
          const review = reviewsObj[i];
          review.status = 'Analyzing';
          review.index = (i + 1);
          const reviewsCopy = allReviews.slice();
          reviewsCopy.unshift(review);
          setReviews(reviewsCopy);
          const res = await analyzeReview(review.title + '\n' + review.text);
          if (res && res.success) {
            review.insights = res.insights;
            review.status = 'Success';
            //roll up insight counts
            if (res.insights.pros) {
              for (let i = 0; i < res.insights.pros.length; i++) {
                const s = stopword.removeStopwords(stem(res.insights.pros[i]).split(' ')).join(' ');
                if (s && s.length > 0) {
                  if (!stemLookup.has(s)) {
                    stemLookup.set(s, res.insights.pros[i]);
                  }
                  let found = false;
                  for (const [key] of proStemCounts.entries()) {
                    if (s.indexOf(key) >= 0 || key.indexOf(s) >= 0) {
                      proStemCounts.set(key, proStemCounts.get(key) + 1);
                      found = true;
                      break;
                    }
                  }
                  if (!found) {
                    proStemCounts.set(s, 1);
                  }
                }
                const sortedPros = new Map([...proStemCounts.entries()].sort((a, b) => b[1] - a[1]));
                setTopPros(Array.from(sortedPros).map(([key, value]) => stemLookup.get(key) + ' (' + value + ')').join(', '));
              }
            }
            if (res.insights.cons) {
              for (let i = 0; i < res.insights.cons.length; i++) {
                const s = stopword.removeStopwords(stem(res.insights.cons[i]).split(' ')).join(' ');
                if (s && s.length > 0) {
                  if (!stemLookup.has(s)) {
                    stemLookup.set(s, res.insights.cons[i]);
                  }
                  let found = false;
                  for (const [key] of conStemCounts.entries()) {
                    if (s.indexOf(key) >= 0 || key.indexOf(s) >= 0) {
                      conStemCounts.set(key, conStemCounts.get(key) + 1);
                      found = true;
                      break;
                    }
                  }
                  if (!found) {
                    conStemCounts.set(s, 1);
                  }
                }
                const sortedCons = new Map([...conStemCounts.entries()].sort((a, b) => b[1] - a[1]));
                setTopCons(Array.from(sortedCons).map(([key, value]) => stemLookup.get(key) + ' (' + value + ')').join(', '));
              }
            }
            if (res.insights.usedFor) {
              for (let i = 0; i < res.insights.usedFor.length; i++) {
                const s = stopword.removeStopwords(stem(res.insights.usedFor[i]).split(' ')).join(' ');
                if (s && s.length > 0) {
                  if (!stemLookup.has(s)) {
                    stemLookup.set(s, res.insights.usedFor[i]);
                  }
                  let found = false;
                  for (const [key] of useStemCounts.entries()) {
                    if (s.indexOf(key) >= 0 || key.indexOf(s) >= 0) {
                      useStemCounts.set(key, useStemCounts.get(key) + 1);
                      found = true;
                      break;
                    }
                  }
                  if (!found) {
                    useStemCounts.set(s, 1);
                  }
                }
                const sortedUses = new Map([...useStemCounts.entries()].sort((a, b) => b[1] - a[1]));
                setTopUses(Array.from(sortedUses).map(([key, value]) => stemLookup.get(key) + ' (' + value + ')').join(', '));
              }
            }
          }
          else {
            review.status = 'Error';
          }
          allReviews.unshift(review);
          setReviews(allReviews);
          setProgress(100.0 * (i + 1) / reviewsObj.length);
        }
      }
    };

    if (e) {
      e.preventDefault();
    }

    setIsProcessing(true);
    let sku = url;
    if (sku.indexOf('skuId') > 0) {
      sku = sku.split('skuId=')[1];
    }
    await fetchAndAnalyzeSku(sku);
    setIsProcessing(false);
  }, [url, reviews]);

  return (
    <Card style={{ minHeight: 500 }} className="mb-3">
      <FalconCardHeader title="Best Buy Review Analysis" light={false} />
      <CardBody className="bg-light">
        <Row>
          <Col xs={12}>
            <Form onSubmit={handleCheckQuality}>
              <FormGroup>
                <InputGroup>
                  <Input
                    placeholder="Best Buy Product URL or SKU"
                    value={url}
                    onChange={(e) => setURL(e.target.value)}
                  />
                  <InputGroupAddon addonType="append">
                    <Button color="primary" type="submit" disabled={isProcessing}>
                      {isProcessing ? 'Analyzing Reviews...' : 'Analyze Reviews'}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </FormGroup>
            </Form>
          </Col>
        </Row>
        {progress > 0 && (
          <Card>
            <CardBody>
              {progress < 120 && (<Row>
                <Col xs={12}>
                  <Progress animated color="success" className="mb-3" value={progress} style={{ height: '40px' }}><strong>{progress < 100 ? 'Processing Reviews' : 'Analysis Complete'}</strong></Progress>
                </Col>
              </Row>)}
              <Row>
                <Col>
                  <h2>Product Highlights</h2>
                  <div className="card-deck">
                    <CardSummary
                      title="Overall Product Pros"
                      color="success"
                      size="sm"
                    >
                      {topPros ? topPros : 'none'}
                    </CardSummary>
                    <CardSummary
                      title="Overall Product Cons"
                      color="warning"
                      size="sm"
                    >
                      {topCons ? topCons : 'none'}
                    </CardSummary>
                    <CardSummary
                      title="Overall Product Uses"
                      color="info"
                      size="sm"
                    >
                      {topUses ? topUses : 'none'}
                    </CardSummary>
                  </div>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col>
                  {reviews && reviews.length > 0 && reviews.map(review => (
                    <Row key={review.reviewId}>
                      <Col>
                        <h3>Top Review {review.index}</h3>
                        <p className="mb-1 bg-200 rounded-soft p-2">
                          <span className="ml-1">
                            <strong>{review.title}</strong> {review.text}
                          </span>

                          <div className="card-deck">
                            <CardSummary
                              title="Review Pros"
                              color="success"
                            >
                              {review.insights.pros ? review.insights.pros.join(', ') : 'none'}
                            </CardSummary>
                            <CardSummary
                              title="Review Cons"
                              color="warning"
                            >
                              {review.insights.cons ? review.insights.cons.join(', ') : 'none'}
                            </CardSummary>
                            <CardSummary
                              title="Review Uses"
                              color="info"
                            >
                              {review.insights.usedFor ? review.insights.usedFor.join(', ') : 'none'}
                            </CardSummary>
                          </div>
                        </p>
                        <br />
                      </Col>
                    </Row>))}
                </Col>
              </Row>
            </CardBody>
          </Card>)}
      </CardBody>
    </Card>
  );
}

BestBuyReviewsPage.showNav = false;
export default BestBuyReviewsPage;
