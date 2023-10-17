import React, { useEffect, useState } from 'react';
import { requireAuth } from '@util/auth.js';
import { Card, CardBody, Breadcrumb, BreadcrumbItem, Table } from 'reactstrap';
import Head from 'next/head';
import AspectList from '@components/AspectList';
import { useGetConceptInsights, authorConceptInsight } from '@util/api';
import Router from 'next/router';

function CategoryPage() {
  const conceptId = '256382';
  const { data: insightsResult } = useGetConceptInsights(conceptId);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (insightsResult) {
      if (insightsResult.status === 'error') {
        Router.push('/contenttemplates');
      }
      if (!insightsResult.success) {
        if (insightsResult.message === 'Not found') {
          Router.push('/404');
        } else if (insightsResult.message === 'Unauthorized') {
          Router.push('/');
        }
      } else {
        if (!insightsResult.insights && !fetched) {
          generateInsights();
        }
      }
    }
  }, [insightsResult]);

  const generateInsights = async () => {
    generateInsight('aspects');
    //generateInsight('motivations');
    //generateInsight('issues');
    //generateInsight('descriptions');
    //generateInsight('avoid');
    setFetched(true);
  };

  const generateInsight = async (type) => {
    const res = await authorConceptInsight(conceptId, type);
    console.log(res);
  };

  return (
    <>
      <Head>
        <title>Optiversal</title>
      </Head>
      <Card>
        <CardBody>
          <div>
            <Breadcrumb>
              <BreadcrumbItem>
                <a href="#">Personal Care</a>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <a href="#">Grooming Products</a>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <a href="#">Skin Care Product</a>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <a href="#">Facial Skin Care Product</a>
              </BreadcrumbItem>
              <BreadcrumbItem active>Facial Cleansers</BreadcrumbItem>
            </Breadcrumb>
          </div>
          <p>
            <div className="card-deck">
              <AspectList
                header="Key Aspects"
                items={insightsResult?.insights?.aspects || []}
              ></AspectList>
              <AspectList
                header="Motivations"
                items={insightsResult?.insights?.motivations || []}
              ></AspectList>
              <AspectList
                header="Issues Addressed"
                items={insightsResult?.insights?.issues || []}
              ></AspectList>
              <AspectList
                header="Ideal Description"
                items={insightsResult?.insights?.descriptions || []}
              ></AspectList>
              <AspectList
                header="Avoid"
                items={insightsResult?.insights?.avoid || []}
              ></AspectList>
            </div>
          </p>
          <Card className="h-lg-100 overflow-hidden">
            <CardBody className="p-0">
              <Table borderless className="table-dashboard mb-0 fs--1">
                <thead className="bg-light">
                  <tr className="text-900">
                    <th>Topic Ideas</th>
                    <th className="pr-card" style={{ width: '12rem' }}>
                      Monthly Searches
                    </th>
                    <th className="pr-card" style={{ width: '8rem' }}>
                      Competition
                    </th>
                    <th className="pr-card" style={{ width: '8rem' }}>
                      Bid Range
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">How to get rid of blackheads</a>
                      </strong>
                    </td>
                    <td>74,000</td>
                    <td>High</td>
                    <td>$1.15-$2.18</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">How to get rid of acne</a>
                      </strong>
                    </td>
                    <td>49,500</td>
                    <td>High</td>
                    <td>$1.14-$2.63</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">How to get rid of pimples</a>
                      </strong>
                    </td>
                    <td>49,500</td>
                    <td>High</td>
                    <td>$0.77-$2.35</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">How to get rid of blackheads on nose</a>
                      </strong>
                    </td>
                    <td>22,200</td>
                    <td>High</td>
                    <td>$0.73-$2.30</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          How to get rid of dark circles under the eyes
                        </a>
                      </strong>
                    </td>
                    <td>18,100</td>
                    <td>High</td>
                    <td>$0.84-$2.65</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">How to get rid of oily skin</a>
                      </strong>
                    </td>
                    <td>5,400</td>
                    <td>High</td>
                    <td>$0.78-$2.06</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">How to get rid of wrinkles</a>
                      </strong>
                    </td>
                    <td>4,400</td>
                    <td>High</td>
                    <td>$1.21-$5.34</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">How to get rid of dry skin</a>
                      </strong>
                    </td>
                    <td>4,400</td>
                    <td>High</td>
                    <td>$1.99-$3.74</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What is the best facial cleanser for sensitive skin?
                        </a>
                      </strong>
                    </td>
                    <td>50</td>
                    <td>High</td>
                    <td>$2.25-$4.24</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What is the best facial cleanser for oily skin?
                        </a>
                      </strong>
                    </td>
                    <td>50</td>
                    <td>High</td>
                    <td>$1.19-$4.39</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What is the best facial cleanser for aging skin?
                        </a>
                      </strong>
                    </td>
                    <td>40</td>
                    <td>High</td>
                    <td>$1.28-$3.17</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What is the best facial cleanser for dry skin?
                        </a>
                      </strong>
                    </td>
                    <td>40</td>
                    <td>High</td>
                    <td>$2.15-$4.55</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          How often should you use a facial cleanser?
                        </a>
                      </strong>
                    </td>
                    <td>30</td>
                    <td>Low</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What is the best facial cleanser for combination skin?
                        </a>
                      </strong>
                    </td>
                    <td>20</td>
                    <td>High</td>
                    <td>$1.28-$3.06</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What is the best facial cleanser for acne-prone skin?
                        </a>
                      </strong>
                    </td>
                    <td>10</td>
                    <td>High</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What are the benefits of using a facial cleanser?
                        </a>
                      </strong>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What is the best facial cleanser for rosacea-prone
                          skin?
                        </a>
                      </strong>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What are some natural ingredients in a good facial
                          cleanser?
                        </a>
                      </strong>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What are some ingredients in a good facial cleanser?
                        </a>
                      </strong>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>
                        <a href="#">
                          What are the side effects of using a facial cleanser?
                        </a>
                      </strong>
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </CardBody>
      </Card>
    </>
  );
}

export default requireAuth(CategoryPage);
