import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardBody, Row, Col, Form, Button } from 'reactstrap';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import { graphRequest } from '@util/util';
import { requireAdmin } from '@util/auth.js';
import FalconCardHeader from '@components/common/FalconCardHeader';
import FilterSelect from '@components/FilterSelect';
import { getOptionNames } from '@helpers/concept';

function CategoriesPage() {
  const queryClient = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState([]);

  const { data: organizations, isFetching: isOrgLoading } = useQuery(
    'organizations',
    async () => {
      const res = await graphRequest('/organizationconcepts');
      return res.organizations.reduce(
        (acc, org) => ({ ...acc, [org.organization_id]: org }),
        {},
      );
    },
  );

  const { data: concepts, isFetching: isConceptsLoading } = useQuery(
    'concepts',
    async () => {
      const res = await graphRequest('/concepts');
      return res.concepts.reduce(
        (acc, concept) => ({ ...acc, [concept.concept_id]: concept }),
        {},
      );
    },
  );

  const { data: categories, isFetching: isCategoriesLoading } = useQuery(
    ['categories', selectedOrg],
    async ({}) => {
      if (!selectedOrg) {
        return null;
      } else {
        const res = await graphRequest(
          `/categoryconcepts?org=${selectedOrg.organization_id}`,
        );
        return res.categories.reduce(
          (acc, category) => ({ ...acc, [category.category_id]: category }),
          {},
        );
      }
    },
  );

  // Assign To Concept Mutation
  const assignToConceptMutation = useMutation(
    async () => {
      const categoriesName =
        selectedCategory.length > 0
          ? selectedCategory
              .map((category) => categories[category].name)
              .join(', ')
          : '[None]';
      const conceptName =
        selectedConcept && concepts
          ? concepts[selectedConcept.concept_id].name
          : '(please select)';

      if (
        window.confirm(
          `Are you sure you want to assign ${categoriesName} to concept ${conceptName}`,
        )
      ) {
        try {
          const res = await graphRequest(
            `/categoryconcepts?org=${selectedOrg.organization_id}&concept=${
              selectedConcept?.concept_id || 0
            }`,
            'PUT',
            selectedCategory,
          );
          if (res.success) {
            return Promise.resolve();
          } else {
            return Promise.reject(res.message);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
    },
    {
      onSuccess: async () => {
        await queryClient.cancelQueries(['categories', selectedOrg]);

        const updatedCategories = selectedCategory.reduce(
          (acc, categoryId) => ({
            ...acc,
            [categoryId]: {
              ...categories[categoryId],
              concept_id: selectedConcept?.concept_id || 0,
            },
          }),
          [],
        );

        queryClient.setQueryData(['categories', selectedOrg], (old) => ({
          ...old,
          ...updatedCategories,
        }));

        alert('Success');
      },
      onError: (error) => {
        alert('Error: ' + error);
      },
    },
  );

  // Selector Options
  const orgOptions = useMemo(
    () =>
      organizations
        ? Object.values(organizations).sort((a, b) =>
            a.name > b.name ? 1 : a.name < b.name ? -1 : 0,
          )
        : [],
    [organizations],
  );

  const conceptOptions = useMemo(
    () =>
      concepts
        ? Object.values(concepts).sort((a, b) =>
            a.name > b.name ? 1 : a.name < b.name ? -1 : 0,
          )
        : [],
    [concepts],
  );

  const categoryOptions = useMemo(
    () => (categories ? Object.values(categories) : []),
    [categories],
  );

  // Update Selected Category when category selection is changed or refetched
  useEffect(() => {
    if (selectedConcept && categoryOptions) {
      setSelectedCategory(
        categoryOptions
          .filter(
            (category) => category.concept_id === selectedConcept.concept_id,
          )
          .map((category) => category.category_id),
      );
    } else {
      setSelectedCategory([]);
    }
  }, [selectedConcept, categoryOptions]);

  return (
    <>
      <Card style={{ minHeight: 500 }}>
        <FalconCardHeader title="Assign Categories" light={false} />
        <CardBody>
          <Form>
            <FilterSelect
              classNamePrefix=""
              className="mt-3 rounded-pill"
              isAsync={false}
              isClearable={true}
              isLoading={isOrgLoading}
              value={selectedOrg}
              label="Select an organization"
              onChange={setSelectedOrg}
              placeholder="(please select)"
              options={orgOptions}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.organization_id}
            />
            <FilterSelect
              classNamePrefix=""
              className="mt-3 rounded-pill"
              isAsync={false}
              isClearable={true}
              isLoading={isConceptsLoading}
              value={selectedConcept}
              label="Concept"
              onChange={setSelectedConcept}
              placeholder="(please select)"
              options={conceptOptions}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => getOptionNames(option)}
            />

            <Row>
              {isCategoriesLoading && (
                <Col>
                  <span>Loading...</span>
                </Col>
              )}
              {!isCategoriesLoading && categories && (
                <>
                  <Col xs={12}>
                    <Button
                      color="primary"
                      onClick={assignToConceptMutation.mutate}
                    >
                      Assign To Concept
                    </Button>
                  </Col>

                  <Col xs={12} className="mt-3">
                    {categoryOptions.map((category) => (
                      <div key={category.category_id}>
                        <input
                          type="checkbox"
                          className="mr-2"
                          key={category.category_id}
                          checked={selectedCategory.includes(
                            category.category_id,
                          )}
                          id={`category-concept-${category.category_id}`}
                          onChange={() => {
                            if (
                              selectedCategory.includes(category.category_id)
                            ) {
                              setSelectedCategory(
                                selectedCategory.filter(
                                  (id) => id !== category.category_id,
                                ),
                              );
                            } else {
                              setSelectedCategory([
                                ...selectedCategory,
                                category.category_id,
                              ]);
                            }
                          }}
                        />
                        <label
                          htmlFor={`category-concept-${category.category_id}`}
                        >
                          <a
                            href={category.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {category.name}
                          </a>
                          <span>
                            ({category.entity_count} entities, assigned to{' '}
                            <strong>
                              {category.concept_id
                                ? (concepts &&
                                    concepts[category.concept_id]?.name) ||
                                  'LOADING...'
                                : 'UNASSIGNED'}
                            </strong>
                            )
                          </span>
                        </label>
                      </div>
                    ))}
                  </Col>
                </>
              )}
            </Row>
          </Form>
        </CardBody>
      </Card>
      <br />
    </>
  );
}

export default requireAdmin(CategoriesPage);
