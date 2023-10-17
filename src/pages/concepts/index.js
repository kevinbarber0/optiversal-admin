import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Input,
  InputGroupText,
  InputGroupAddon,
  InputGroup,
  Row,
  Col,
  FormGroup,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { useQuery } from 'react-query';
import Graph from 'react-graph-vis';
import FalconCardHeader from '@components/common/FalconCardHeader';
import FilterSelect from '@components/FilterSelect';
import { arrayToString, stringToArray, getOptionNames } from '@helpers/concept';
import { graphRequest } from '@util/util';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import ButtonIcon from '@components/common/ButtonIcon';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';

export default function AllConcepts() {
  const [keyword, setKeyword] = useState('');
  const [editConcept, setEditConcept] = useState(null);

  const [graphData, setGraphData] = useState(null);

  const {
    data: concepts,
    isFetching: isConceptsLoading,
    refetch: getConceptList,
  } = useQuery('concepts', async () => {
    const res = await graphRequest('/concepts');
    const result = res.concepts.sort((a, b) =>
      a.name > b.name ? 1 : a.name < b.name ? -1 : 0,
    );
    return result;
  });

  const onViewGraph = useCallback(async (conceptName) => {
    const data = await graphRequest(
      `/concepts/${window.encodeURI(conceptName)}`,
    );

    const nodes = [];
    const edges = [];

    nodes.push(
      {
        id: data.concept.concept_id,
        label: data.concept.name,
        color: 'tan',
      },
      ...data.parents.map((parent) => ({
        id: parent.concept_id,
        label: parent.name,
        color: 'lightgreen',
      })),
      ...data.children.map((child) => ({
        id: child.concept_id,
        label: child.name,
        color: 'lightblue',
      })),
    );

    edges.push(
      ...data.parents.map((parent) => ({
        from: parent.concept_id,
        to: data.concept.concept_id,
        label: 'ChildOf',
      })),
      ...data.children.map((child) => ({
        from: data.concept.concept_id,
        to: child.concept_id,
        label: 'ParentOf',
      })),
    );

    data.descendants
      .filter(
        (descendant) =>
          nodes.find((node) => node.id === descendant.concept_id) === undefined,
      )
      .forEach((descendant) => {
        nodes.push({
          id: descendant.concept_id,
          label: descendant.name,
          color: 'orange',
        });
        edges.push(
          ...descendant.parent_concept_ids.map((parentId) => ({
            from: parentId,
            to: descendant.concept_id,
          })),
        );
      });

    setGraphData({ nodes, edges });
  }, []);

  const networkEvents = useMemo(
    () => ({
      doubleClick: (ev) => {
        const { nodes } = ev;
        const concept = (concepts || []).find(
          (concept) => concept.concept_id === nodes[0],
        );
        concept && onViewGraph(concept.name);
      },
    }),
    [concepts, onViewGraph],
  );

  const filteredConcepts = useMemo(() => {
    return (concepts || []).filter((concept) =>
      `${concept.name}[${concept.expressions.join(', ')}]`.includes(keyword),
    );
  }, [concepts, keyword]);

  return (
    <>
      <Card style={{ minHeight: 500 }}>
        <FalconCardHeader title="Manage Concepts" light={false}>
          <InputGroup>
            <InputGroupAddon addonType="prepend">
              <InputGroupText>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroupText>
            </InputGroupAddon>
            <Input
              placeholder="Enter keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </InputGroup>
        </FalconCardHeader>
        <CardBody>
          {isConceptsLoading && <Loader />}

          {!isConceptsLoading && filteredConcepts && (
            <Row>
              <Col>
                <ConceptsTable
                  concepts={filteredConcepts}
                  onViewGraph={onViewGraph}
                  setEditConcept={setEditConcept}
                />
              </Col>
              <Col className="flex-1 border h-full">
                {graphData && (
                  <Graph graph={graphData} events={networkEvents} />
                )}
              </Col>
            </Row>
          )}

          <EditModal
            isOpen={editConcept !== null}
            concepts={concepts}
            conceptName={editConcept}
            onCancel={(shouldRefetch = false) => {
              setEditConcept(null);
              if (shouldRefetch) {
                getConceptList();
              }
            }}
          />
        </CardBody>
      </Card>
    </>
  );
}

const ConceptsTable = ({ concepts, onViewGraph, setEditConcept }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const columns = useMemo(
    () => [
      {
        dataField: 'name',
        text: 'Name',
        formatter: (cell, row) => {
          return `${cell}[${row.expressions.join(', ')}]`;
        },
        classes: 'border-0 align-middle',
        headerClasses: 'border-0',
        sort: false,
      },
      {
        dataField: 'action',
        text: 'Actions',
        formatter: (cell, row) => {
          return (
            <Row noGutters className="flex-nowrap">
              <Col>
                <ButtonIcon
                  color="falcon-success"
                  icon="eye"
                  onClick={() => onViewGraph(row.name)}
                />
              </Col>
              &nbsp;
              <Col>
                <ButtonIcon
                  color="falcon-info"
                  icon="edit"
                  onClick={() => setEditConcept(row.name)}
                />
              </Col>
            </Row>
          );
        },
        classes: 'border-0 align-middle',
        headerClasses: 'border-0',
        sort: false,
      },
    ],
    [onViewGraph, setEditConcept],
  );

  return (
    <PaginatedDataTable
      data={concepts || []}
      columns={columns}
      keyField="concept_id"
      config={{ pageOptions: [15] }}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      pageSize={pageSize}
      setPageSize={setPageSize}
      headerClasses="d-none"
    />
  );
};

function EditModal({ isOpen, concepts, conceptName, onCancel }) {
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [positiveExpressions, setPositiveExpressions] = useState([]);
  const [negativeExpressions, setNegativeExpressions] = useState([]);
  const [neutralExpressions, setNeutralExpressions] = useState([]);

  useEffect(() => {
    (async () => {
      if (conceptName) {
        setLoading(true);
        const data = await graphRequest(
          `/concepts/${window.encodeURI(conceptName)}`,
        );
        setData(data);
        setPositiveExpressions(
          arrayToString(data.concept.custom_positive, ','),
        );
        setNegativeExpressions(
          arrayToString(data.concept.custom_negative, ','),
        );
        setNeutralExpressions(arrayToString(data.concept.custom_neutral, ','));
        setLoading(false);
      } else {
        setData(null);
      }
    })();
  }, [conceptName]);

  const onSave = useCallback(
    async (
      data,
      positiveExpressions,
      negativeExpressions,
      neutralExpressions,
    ) => {
      try {
        const res = await graphRequest(
          `/concepts/${data.concept.concept_id}`,
          'POST',
          {
            ...data,
            concept: {
              ...data.concept,
              name: data.concept.expressions.join('|'),
              custom_positive: stringToArray(positiveExpressions),
              custom_neutral: stringToArray(neutralExpressions),
              custom_negative: stringToArray(negativeExpressions),
            },
          },
        );
        if (res.success) {
          alert('Concept updated');
          onCancel(true);
        } else {
          alert(res.message);
          onCancel();
        }
      } catch (e) {
        alert('Error: ' + e);
      }
    },
    [onCancel],
  );

  const onDelete = useCallback(
    async (data) => {
      if (data.children.length > 0) {
        alert(
          'This concept has children and cannot be deleted. Think of the children',
        );
        return;
      }
      if (data.descendants.length > 0) {
        alert('This concept has descendants and cannot be deleted');
      }

      if (window.confirm('Are you sure you want to delete this concept?')) {
        try {
          const res = await graphRequest(
            `/concepts/${data.concept.concept_id}`,
            'DELETE',
            data,
          );
          if (res.success) {
            alert('Concept deleted');
            onCancel(true);
          } else {
            alert(res.message);
            onCancel();
          }
        } catch (e) {
          alert('Error: ' + e);
          onCancel();
        }
      }
    },
    [onCancel],
  );

  if (isLoading || !data || !data.concept) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClosed={onCancel}
      centered={true}
      style={{ width: '500px' }}
    >
      <ModalBody>
        <FormGroup>
          <FilterSelect
            isMulti={true}
            id="parent-concept"
            classNamePrefix=""
            label="Parent Concepts"
            placeholder="Select/Enter Parent"
            options={concepts}
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => getOptionNames(option)}
            value={data.parents || []}
            onChange={(v) => setData({ ...data, parents: v })}
          />
        </FormGroup>
        <FormGroup>
          <Label for="expressions">Expressions</Label>
          <Input
            type="textarea"
            id="expressions"
            onChange={(e) =>
              setData({
                ...data,
                concept: {
                  ...data.concept,
                  expressions: stringToArray(e.target.value || []),
                },
              })
            }
            value={arrayToString(data.concept.expressions)}
          />
        </FormGroup>
        <FormGroup>
          <Label for="positive-expressions">Positive Expressions</Label>
          <Input
            type="textarea"
            id="positive-expressions"
            onChange={(e) => setPositiveExpressions(e.target.value)}
            value={positiveExpressions}
          />
        </FormGroup>
        <FormGroup>
          <Label for="neutral-expressions">Neutral Expressions</Label>
          <Input
            type="textarea"
            id="neutral-expressions"
            onChange={(e) => setNeutralExpressions(e.target.value)}
            value={neutralExpressions}
          />
        </FormGroup>
        <FormGroup>
          <Label for="negative-expressions">Negative Expressions</Label>
          <Input
            type="textarea"
            id="negative-expressions"
            onChange={(e) => setNegativeExpressions(e.target.value)}
            value={negativeExpressions}
          />
        </FormGroup>
        <FormGroup>
          <Label for="notes">Notes</Label>
          <Input
            id="notes"
            type="textarea"
            onChange={(e) =>
              setData({
                ...data,
                concept: {
                  ...data.concept,
                  notes: e.target.value,
                },
              })
            }
            value={data.concept.notes}
          />
        </FormGroup>
        <FormGroup>
          <FilterSelect
            isMulti={true}
            isCreatable={true}
            classNamePrefix=""
            label="Child Concepts"
            placeholder="Select/Enter Children"
            id="child-concept"
            options={concepts}
            getOptionLabel={(option) => option.name}
            getOptionValue={(option) => getOptionNames(option)}
            getNewOptionData={(inputValue) => {
              return {
                name: inputValue,
                concept_id: 0,
                expressions: null,
              };
            }}
            value={data.children || []}
            onChange={(v) => setData({ ...data, children: v })}
          />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button
          color="success"
          className="btn mr-4"
          onClick={() =>
            onSave(
              data,
              positiveExpressions,
              negativeExpressions,
              neutralExpressions,
            )
          }
        >
          Save
        </Button>
        <Button
          color="danger"
          className="btn mr-4"
          onClick={() => onDelete(data)}
        >
          Delete
        </Button>
        <Button className="btn mr-4" onClick={onCancel}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
