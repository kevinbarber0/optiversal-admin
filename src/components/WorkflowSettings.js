import React, { useState, useEffect } from 'react';
import Router from 'next/router';
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  CardBody,
  FormGroup,
  InputGroup,
  Label,
  Form,
  Media,
  CustomInput,
  Table,
} from 'reactstrap';
import FalconCardHeader from '@components/common/FalconCardHeader';
import FalconDropzone from '@components/common/FalconDropzone';
import FilterSelect from '@components/FilterSelect';
import { toast } from 'react-toastify';
import {
  getCategories,
  getCustomAttributes,
  getAccounts,
  useGetWorkflowComponents,
  updateWorkflowSettings,
  updateFileWorkflowSettings,
} from '@util/api';
import contentTypeOptions from '@data/contentTypeOptions';
import cloudUpload from '../assets/img/cloud-upload.svg';
import { getExtension, hasUniqueID } from '@helpers/utils';
import { WorkflowType } from '@util/enum';
import AccountPicker from '@components/AccountPicker';
import { getOrgId } from '@helpers/auth';
import { useAuth } from '@util/auth.js';
import {
  loadLabelsOptions,
  loadProductLabelsOptions,
  loadContentTemplateOptions,
} from '@util/load-options';
import { isEmpty } from 'lodash';
import * as XLSX from 'xlsx';

const WorkflowSettings = (props) => {
  const auth = useAuth();
  const orgId = getOrgId(auth);

  const [working, setWorking] = useState(false);

  const [workflowType, setWorkflowType] = useState(
    props.workflow?.workflowType
      ? props.workflow.workflowType
      : WorkflowType.Product,
  );
  const [file, setFile] = useState();
  const [inputContent, setInputContent] = useState({});
  const [name, setName] = useState(props.workflow?.name);
  const [categories, setCategories] = useState(
    props.workflow?.searchParams?.categories || [],
  );
  const [includedFilters, setIncludedFilters] = useState(
    props.workflow?.searchParams?.attributes || [],
  );
  const [includedFiltersStr, setIncludedFiltersStr] = useState();
  const [activeIncludeAttribute, setActiveIncludeAttribute] = useState();
  const [activeIncludeAttributeValues, setActiveIncludeAttributeValues] =
    useState([]);
  const [activeIncludeAttributeMinValue, setActiveIncludeAttributeMinValue] =
    useState();
  const [activeIncludeAttributeMaxValue, setActiveIncludeAttributeMaxValue] =
    useState();
  const [missingContent, setMissingContent] = useState(
    props.workflow?.searchParams?.missingContent || [],
  );
  const [contentTypes, setContentTypes] = useState(
    props.workflow?.contentTypes || [],
  );
  const [assignees, setAssignees] = useState(props.workflow?.assignedTo || []);
  const [component, setComponent] = useState(
    props.workflow?.contentTypes || [],
  );

  const [componentOptions, setComponentOptions] = useState();

  // for ideas workflow
  const [contentTemplate, setContentTemplate] = useState(
    props.workflow?.contentTypes,
  );
  const [filterLabels, setFilterLabels] = useState(
    props.workflow?.searchParams?.filterLabels || [],
  );
  const [approvalApplyLabels, setApprovalApplyLabels] = useState(
    props.workflow?.settings?.approval?.applyLabels || [],
  );
  const [approvalRemoveLabels, setApprovalRemoveLabels] = useState(
    props.workflow?.settings?.approval?.removeLabels || [],
  );
  const [approvalPublishPage, setApprovalPublishPage] = useState(
    props.workflow?.settings?.approval?.publishPage || false,
  );
  const [rejectionApplyLabels, setRejectionApplyLabels] = useState(
    props.workflow?.settings?.rejection?.applyLabels || [],
  );
  const [rejectionRemoveLabels, setRejectionRemoveLabels] = useState(
    props.workflow?.settings?.rejection?.removeLabels || [],
  );
  const [rejectionDeleteIdea, setRejectionDeleteIdea] = useState(
    props.workflow?.settings?.rejection?.deleteIdea || false,
  );
  const [matchType, setMatchType] = useState(
    props.workflow?.searchParams?.matchType || 'all',
  );
  const [importedOnly, setImportedOnly] = useState(
    props.workflow?.searchParams?.importedOnly || false,
  );

  // for pages workflow
  const [pageStatus, setPageStatus] = useState(
    props.workflow?.searchParams?.pageStatus,
  );
  const [editors, setEditors] = useState(
    props.workflow?.searchParams?.editors || [],
  );
  const [approvalChanageStatus, setApprovalChangeStatus] = useState(
    props.workflow?.settings?.approval?.changeStatus || null,
  );
  const [rejectionChanageStatus, setRejectionChangeStatus] = useState(
    props.workflow?.settings?.rejection?.changeStatus || null,
  );

  const {
    status: componentStatus,
    isLoading: componentsLoading,
    data: componentsResult,
  } = useGetWorkflowComponents();

  useEffect(() => {
    if (componentStatus !== 'success' || componentsLoading) return;
    const options = componentsResult.components?.map((c) => {
      return {
        value: c.componentId,
        label: c.name,
      };
    });
    setComponentOptions(options);
  }, [componentStatus, componentsLoading, componentsResult]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name || name.trim().length === 0) {
      toast.error('Please enter a name for the workflow', {
        theme: 'colored',
      });
      return;
    }

    if (workflowType === WorkflowType.Product) {
      if (!contentTypes || contentTypes.length === 0) {
        toast.error('Please select a content type for this workflow', {
          theme: 'colored',
        });
        return;
      }
    } else if (workflowType === WorkflowType.Page) {
      if (!contentTemplate || isEmpty(contentTemplate)) {
        toast.error('Please select a page type for this workflow', {
          theme: 'colored',
        });
        return;
      }
    } else if (workflowType === WorkflowType.Idea) {
      if (!contentTemplate || isEmpty(contentTemplate)) {
        toast.error('Please select a page type for this workflow', {
          theme: 'colored',
        });
        return;
      }
    } else if (workflowType === WorkflowType.File) {
      if (!inputContent || isEmpty(inputContent)) {
        toast.error('Please upload a valid file for this workflow', {
          theme: 'colored',
        });
        return;
      }

      if (!component || component.length === 0) {
        toast.error('Please select a component for this workflow', {
          theme: 'colored',
        });
        return;
      }
    }

    if (!assignees || assignees.length === 0) {
      toast.error('Please select at least one assignee for this workflow', {
        theme: 'colored',
      });
      return;
    }

    setWorking(true);

    const workflowSettings = {};

    if (workflowType === WorkflowType.Product) {
      workflowSettings.workflowId = props.workflow?.workflowId;
      workflowSettings.name = name;
      workflowSettings.searchParams = {
        categories: categories || [],
        attributes: includedFilters || [],
        missingContent: missingContent,
        filterLabels: filterLabels || [],
        matchType: matchType,
      };
      workflowSettings.contentTypes = contentTypes;
      workflowSettings.assignedTo = assignees;
      workflowSettings.workflowType = workflowType;
    } else if (workflowType === WorkflowType.File) {
      workflowSettings.inputContents = null;
      workflowSettings.workflowId = props.workflow?.workflowId;
      workflowSettings.workflowItemId = props.workflow?.workflowItemId;
      workflowSettings.name = name;
      workflowSettings.component = component;
      workflowSettings.assignedTo = assignees;
      workflowSettings.workflowType = workflowType;
    } else if (workflowType === WorkflowType.Idea) {
      workflowSettings.workflowId = props.workflow?.workflowId;
      workflowSettings.name = name;
      workflowSettings.searchParams = {
        filterLabels: filterLabels || [],
        matchType: matchType,
        importedOnly: importedOnly,
      };
      workflowSettings.contentTypes = contentTemplate || {};
      workflowSettings.assignedTo = assignees;
      workflowSettings.settings = {
        approval: {
          applyLabels: approvalApplyLabels || [],
          removeLabels: approvalRemoveLabels || [],
          publishPage: approvalPublishPage || false,
        },
        rejection: {
          applyLabels: rejectionApplyLabels || [],
          removeLabels: rejectionRemoveLabels || [],
          deleteIdea: rejectionDeleteIdea || false,
        },
      };
      workflowSettings.workflowType = workflowType;
    } else if (workflowType === WorkflowType.Page) {
      workflowSettings.workflowId = props.workflow?.workflowId;
      workflowSettings.name = name;
      workflowSettings.searchParams = {
        filterLabels: filterLabels || [],
        matchType: matchType,
        pageStatus: pageStatus,
        editors: editors,
      };
      workflowSettings.contentTypes = contentTemplate;
      workflowSettings.assignedTo = assignees;
      workflowSettings.settings = {
        approval: {
          applyLabels: approvalApplyLabels || [],
          removeLabels: approvalRemoveLabels || [],
          changeStatus: approvalChanageStatus,
        },
        rejection: {
          applyLabels: rejectionApplyLabels || [],
          removeLabels: rejectionRemoveLabels || [],
          changeStatus: rejectionChanageStatus,
        },
      };
      workflowSettings.workflowType = workflowType;
    }

    let res = null;
    if (workflowType === WorkflowType.File && file) {
      var formData = new FormData();
      formData.append('file', file);
      formData.append('settings', JSON.stringify(workflowSettings));
      res = await updateFileWorkflowSettings(formData);
    } else res = await updateWorkflowSettings(workflowSettings);

    if (res.success) {
      toast.success('Workflow saved!', {
        theme: 'colored',
      });
      if (props.onSave) {
        props.onSave(res.workflowId);
      }
    } else {
      toast.error('Workflow could not be updated: ' + res.message, {
        theme: 'colored',
      });
    }

    setWorking(false);
  };

  const handleCancel = () => {
    Router.push('/workflow');
  };

  const loadCategoriesOptions = (inputValue) =>
    new Promise((resolve) => {
      resolve(
        getCategories(inputValue).then((res) =>
          res.categories.map((c) => {
            return {
              value: c.categoryId,
              label: c.name + ' (' + c.categoryId + ')',
            };
          }),
        ),
      );
    });

  const loadAccountsOptions = (inputValue) =>
    new Promise((resolve) => {
      resolve(
        getAccounts(inputValue).then((res) =>
          res.accounts.map((a) => {
            return {
              value: a.accountId,
              label: a.name || a.email,
            };
          }),
        ),
      );
    });

  const handleAttributeChange = (attribute) => {
    setActiveIncludeAttribute(attribute);
    setActiveIncludeAttributeValues([]);
  };

  const handleSelectIncludedAttributeValue = (val) => {
    setActiveIncludeAttributeValues(val);
  };

  const handleAddStringAttribute = () => {
    if (
      !activeIncludeAttributeValues ||
      activeIncludeAttributeValues.length < 1
    ) {
      toast.error('You must select at least one attribute value', {
        theme: 'colored',
      });
      return;
    }
    includedFilters.push({
      name: activeIncludeAttribute.name,
      dataType: activeIncludeAttribute.dataType,
      value:
        activeIncludeAttribute.value +
        ':' +
        activeIncludeAttributeValues.map((v) => v.value).join('|'),
      label:
        activeIncludeAttribute.value +
        ':' +
        activeIncludeAttributeValues.map((v) => v.value).join(','),
    });
    setIncludedFilters(includedFilters);
    setIncludedFiltersStr(includedFilters.join('|'));
    setActiveIncludeAttribute(null);
    setActiveIncludeAttributeMinValue(null);
    setActiveIncludeAttributeMaxValue(null);
    setActiveIncludeAttributeValues([]);
  };

  const handleChangeIncludedFilters = (val) => {
    setIncludedFilters(val || []);
    setIncludedFiltersStr((val || []).join('|'));
  };

  const loadAttributesOptions = () =>
    new Promise((resolve) => {
      resolve(
        getCustomAttributes().then((res) =>
          res.attributes
            .filter((a) => a.dataType === 2)
            .map((p) => {
              return {
                value: p.name,
                label: p.name,
                dataType: p.dataType,
                valueOptions: p.values,
              };
            }),
        ),
      );
    });

  const handleUploadedFile = (file) => {
    if (!file) return;
    setFile(file);
    const ext = getExtension(file.name).toLowerCase();
    switch (ext) {
      case 'xlsx':
      case 'csv':
        handleXlsxFile(file);
        break;
      default:
        toast.error('Unkown file.', {
          theme: 'colored',
        });
    }
  };

  const handleXlsxFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      /* Parse data */
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_json(ws);

      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        if (headers.length < 2) {
          setFile(null);
          setInputContent({});
          toast.error(
            'File must contain at least two columns (id and input).',
            {
              theme: 'colored',
            },
          );
          return;
        }

        const list = [];
        for (let i = 0; i < data.length; i++) {
          const obj = data[i];
          // remove the blank rows
          if (Object.values(obj).filter((x) => x).length > 0) {
            const newObj = {
              order: i + 1,
            };
            for (let j = 0; j < headers.length; j++) {
              newObj[headers[j]] = obj[headers[j]];
            }
            list.push(newObj);
          }
        }
        setInputContent({ count: list.length, contents: list });
      } else {
        toast.error('Input file contains no data', {
          theme: 'colored',
        });
        return;
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <Card className="mb-3">
        <FalconCardHeader
          title={props.workflow ? 'Edit Workflow' : 'Add Workflow'}
          light={false}
        >
          <Button
            color="falcon-secondary"
            size="sm"
            className="mr-2"
            onClick={handleCancel}
            disabled={working}
          >
            Cancel
          </Button>
          <Button
            color="falcon-primary"
            size="sm"
            onClick={handleSave}
            disabled={working}
          >
            {working ? 'Working' : 'Save'}
          </Button>
        </FalconCardHeader>

        <CardBody tag={Form} onSubmit={handleSave} className="bg-light">
          <Card className="mb-3" light={true}>
            <CardBody>
              <h5>1. Workflow Name</h5>
              <br />
              <p>Enter a descriptive name for this workflow.</p>
              <FormGroup>
                <InputGroup>
                  <Input
                    id="name"
                    placeholder="Name"
                    defaultValue={name}
                    onChange={({ target }) => setName(target.value)}
                  />
                </InputGroup>
              </FormGroup>
              <p>Choose a workflow type.</p>
              <FormGroup>
                <InputGroup>
                  <CustomInput
                    type="radio"
                    name="workfolw-type"
                    id="workfolw-type-product"
                    value={WorkflowType.Product}
                    checked={workflowType == WorkflowType.Product}
                    onChange={({ target }) => setWorkflowType(target.value)}
                    label="Product"
                    className="mr-3"
                  />
                  <CustomInput
                    type="radio"
                    name="workfolw-type"
                    id="workfolw-type-pages"
                    value={WorkflowType.Page}
                    checked={workflowType === WorkflowType.Page}
                    onChange={({ target }) => setWorkflowType(target.value)}
                    label="Pages"
                    className="mr-3"
                  />
                  <CustomInput
                    type="radio"
                    name="workfolw-type"
                    id="workfolw-type-ideas"
                    value={WorkflowType.Idea}
                    checked={workflowType === WorkflowType.Idea}
                    onChange={({ target }) => setWorkflowType(target.value)}
                    label="Ideas"
                    className="mr-3"
                  />
                  <CustomInput
                    type="radio"
                    name="workfolw-type"
                    id="workfolw-type-file"
                    value={WorkflowType.File}
                    checked={workflowType === WorkflowType.File}
                    onChange={({ target }) => setWorkflowType(target.value)}
                    label="File"
                    className="mr-3"
                  />
                </InputGroup>
              </FormGroup>
            </CardBody>
          </Card>
          {workflowType == WorkflowType.Product && (
            <>
              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>2. Product Collection</h5>
                  <br />
                  <p>
                    Define the set of products you want to annotate in this
                    workflow.
                  </p>
                  <FormGroup>
                    <FilterSelect
                      label="Product Categories"
                      placeholder="Select categories..."
                      value={categories}
                      onChange={(value) => {
                        setCategories(value);
                      }}
                      loadOptions={loadCategoriesOptions}
                      isMulti
                    />
                  </FormGroup>

                  <FormGroup>
                    <FilterSelect
                      id="includedattributes"
                      label="Product Attributes"
                      placeholder="Select attribute..."
                      onChange={handleAttributeChange}
                      loadOptions={loadAttributesOptions}
                      value={[activeIncludeAttribute]}
                      defaultOptions={true}
                    />
                    {activeIncludeAttribute &&
                      activeIncludeAttribute.dataType === 2 && (
                        <>
                          <Row form>
                            <Col md={8}>
                              <FilterSelect
                                id="includedattributevalues"
                                placeholder="Select values..."
                                label=""
                                onChange={handleSelectIncludedAttributeValue}
                                value={activeIncludeAttributeValues}
                                defaultOptions={true}
                                isMulti={true}
                                options={activeIncludeAttribute.valueOptions.map(
                                  (val) => {
                                    return { value: val, label: val };
                                  },
                                )}
                              />
                            </Col>
                            <Col>
                              <Button onClick={handleAddStringAttribute}>
                                Add
                              </Button>
                            </Col>
                          </Row>
                        </>
                      )}
                    {includedFilters && includedFilters.length > 0 && (
                      <>
                        <FilterSelect
                          id="selectedincludedattributes"
                          label=""
                          onChange={handleChangeIncludedFilters}
                          value={includedFilters}
                          isMulti={true}
                          isCreatable={true}
                        />
                      </>
                    )}
                  </FormGroup>

                  <Row className="align-items-center">
                    <Col md={8}>
                      <FormGroup>
                        <FilterSelect
                          label="Labels"
                          placeholder="Select labels..."
                          value={filterLabels}
                          onChange={(value) => {
                            setFilterLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadProductLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup className="m-0">
                        <div className="input-group">
                          <FormGroup check inline>
                            <CustomInput
                              type="radio"
                              name="matchtype"
                              id="match-type-all"
                              value="all"
                              checked={matchType == 'all'}
                              onChange={({ target }) =>
                                setMatchType(target.value)
                              }
                              label="Match All"
                            />
                          </FormGroup>
                          <FormGroup check inline>
                            <CustomInput
                              type="radio"
                              name="matchtype"
                              id="match-type-any"
                              value="any"
                              checked={matchType == 'any'}
                              onChange={({ target }) =>
                                setMatchType(target.value)
                              }
                              label="Match Any"
                            />
                          </FormGroup>
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>

                  <FormGroup>
                    <Label>Only products missing content</Label>
                    <CustomInput
                      type="select"
                      id="missingcontent"
                      onChange={({ target }) => setMissingContent(target.value)}
                    >
                      <option value="">Select a content type...</option>
                      <option
                        value="description"
                        selected={missingContent === 'description'}
                      >
                        Description (from catalog)
                      </option>
                      {contentTypeOptions.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          selected={missingContent === opt.value}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </CustomInput>
                  </FormGroup>
                </CardBody>
              </Card>
              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>3. Content Type</h5>
                  <br />
                  <p>
                    Select the content types to be annotated on the products in
                    this workflow.
                  </p>
                  <FormGroup>
                    <FilterSelect
                      placeholder="Select content type(s)..."
                      value={contentTypes}
                      options={contentTypeOptions}
                      onChange={(value) => {
                        setContentTypes(value);
                      }}
                      isMulti
                    />
                  </FormGroup>
                </CardBody>
              </Card>
              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>4. Assignment</h5>
                  <br />
                  <p>
                    Select the accounts to assign to this annotation workflow.
                  </p>
                  <FormGroup>
                    <AccountPicker
                      label="Accounts"
                      orgId={orgId}
                      accounts={assignees}
                      onChange={(value) => {
                        setAssignees(value);
                      }}
                      isMulti
                    />
                  </FormGroup>
                </CardBody>
              </Card>
            </>
          )}
          {workflowType === WorkflowType.File && (
            <>
              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>2. Upload file</h5>
                  <br />
                  <Media body>
                    <FalconDropzone
                      files={file}
                      onChange={(files) => {
                        handleUploadedFile(files[0]);
                      }}
                      multiple={false}
                      accept=".csv, .xlsx"
                      placeholder={
                        <>
                          <Media className=" fs-0 mx-auto d-inline-flex align-items-center">
                            <img
                              src={cloudUpload}
                              alt=""
                              width={25}
                              className="mr-2"
                            />
                            <Media>
                              <p className="fs-0 mb-0 text-700">
                                Upload your content file
                              </p>
                            </Media>
                          </Media>
                          <p className="mb-0 w-75 mx-auto text-500">
                            Upload a file of type txt, dat, csv, tsv, or xlsx
                          </p>
                        </>
                      }
                    />
                  </Media>
                  <Row className="mt-4">
                    <Col>
                      {inputContent?.contents &&
                        `
                        Your file contains ${
                          inputContent.count
                        } rows. Verify the
                        first ${inputContent.contents.slice(0, 3).length} 
                        records below to ensure correct data parsing.
                      `}
                    </Col>
                  </Row>
                  {inputContent?.contents &&
                    inputContent.contents.length > 0 && (
                      <Table className="table table-dashboard table-sm fs--1 border-bottom border-200 mt-3 mb-0">
                        <thead className="thead-light">
                          <tr>
                            {Object.keys(inputContent.contents[0]).map(
                              (key) => (
                                <th key={key}>{key}</th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {inputContent.contents.slice(0, 3).map((row) => (
                            <tr key={row.order}>
                              {Object.keys(row).map((key) => (
                                <td key={key}>{row[key]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                </CardBody>
              </Card>
              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>3. Components</h5>
                  <br />
                  <p>Select a component to use in this workflow.</p>
                  <FormGroup>
                    <FilterSelect
                      placeholder="Select a componont"
                      value={component}
                      options={componentOptions}
                      onChange={(value) => {
                        setComponent(value);
                      }}
                    />
                  </FormGroup>
                </CardBody>
              </Card>
              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>4. Assignment</h5>
                  <br />
                  <p>
                    Select the accounts to assign to this annotation workflow.
                  </p>
                  <FormGroup>
                    <AccountPicker
                      label="Accounts"
                      orgId={orgId}
                      accounts={assignees}
                      onChange={(value) => {
                        setAssignees(value);
                      }}
                      isMulti
                    />
                  </FormGroup>
                </CardBody>
              </Card>
            </>
          )}
          {workflowType == WorkflowType.Idea && (
            <>
              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>2. Filter Options</h5>
                  <br />
                  <p>
                    Select the set of Ideas to be processed in this workflow.
                  </p>
                  <Row className="align-items-center">
                    <Col md={4}>
                      <FormGroup>
                        <FilterSelect
                          label="Labels"
                          placeholder="Select idea labels to match..."
                          value={filterLabels}
                          onChange={(value) => {
                            setFilterLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <div className="input-group">
                          <FormGroup check inline>
                            <CustomInput
                              type="radio"
                              name="matchtype"
                              id="match-type-all"
                              value="all"
                              checked={matchType == 'all'}
                              onChange={({ target }) =>
                                setMatchType(target.value)
                              }
                              label="Match All"
                            />
                          </FormGroup>
                          <FormGroup check inline>
                            <CustomInput
                              type="radio"
                              name="matchtype"
                              id="match-type-any"
                              value="any"
                              checked={matchType == 'any'}
                              onChange={({ target }) =>
                                setMatchType(target.value)
                              }
                              label="Match Any"
                            />
                          </FormGroup>
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>

                  <FormGroup className="form-check">
                    <Input
                      type="checkbox"
                      name="check"
                      id="importedOnly"
                      checked={importedOnly}
                      onChange={({ target }) => setImportedOnly(target.checked)}
                    />
                    <Label for="importedOnly" check>
                      Imported keywords only
                    </Label>
                  </FormGroup>
                </CardBody>
              </Card>

              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>3. Page Type</h5>
                  <br />
                  <p>
                    Select the type of Page to create from each Idea in the
                    workflow.
                  </p>
                  <FormGroup>
                    <FilterSelect
                      label="Page Type"
                      placeholder="Select a page type..."
                      value={contentTemplate}
                      onChange={(value) => {
                        setContentTemplate(value);
                      }}
                      defaultOptions
                      loadOptions={loadContentTemplateOptions}
                      isClearable={true}
                    />
                  </FormGroup>
                </CardBody>
              </Card>

              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>4. Assignment</h5>
                  <br />
                  <p>
                    Select the accounts to assign to this annotation workflow.
                  </p>
                  <FormGroup>
                    <AccountPicker
                      label="Accounts"
                      orgId={orgId}
                      accounts={assignees}
                      onChange={(value) => {
                        setAssignees(value);
                      }}
                      isMulti
                    />
                  </FormGroup>
                </CardBody>
              </Card>

              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>5. Actions</h5>
                  <br />
                  <p>
                    Select the actions to be taken after approving or rejecting
                    an Idea.
                  </p>
                  <Row>
                    <Col md={6}>
                      <p>On Approval:</p>
                      <FormGroup>
                        <FilterSelect
                          label="Apply Labels"
                          placeholder="Select label..."
                          value={approvalApplyLabels}
                          onChange={(value) => {
                            setApprovalApplyLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                      {workflowType == WorkflowType.Page && (
                        <FormGroup>
                          <FilterSelect
                            label="Remove Labels"
                            placeholder="Select label..."
                            value={approvalRemoveLabels}
                            onChange={(value) => {
                              setApprovalRemoveLabels(value);
                            }}
                            defaultOptions
                            loadOptions={loadLabelsOptions}
                            isClearable={true}
                            isMulti
                          />
                        </FormGroup>
                      )}
                      <FormGroup className="form-check">
                        <Input
                          type="checkbox"
                          name="check"
                          id="publishPage"
                          checked={approvalPublishPage}
                          onChange={({ target }) =>
                            setApprovalPublishPage(target.checked)
                          }
                        />
                        <Label for="publishPage" check>
                          Publish Page
                        </Label>
                      </FormGroup>
                    </Col>
                    <Col md={6} style={{ borderLeft: 'dashed 1px #ccc' }}>
                      <p>On Rejection:</p>
                      <FormGroup>
                        <FilterSelect
                          label="Apply Labels"
                          placeholder="Select label..."
                          value={rejectionApplyLabels}
                          onChange={(value) => {
                            setRejectionApplyLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                      <FormGroup>
                        <FilterSelect
                          label="Remove Labels"
                          placeholder="Select label..."
                          value={rejectionRemoveLabels}
                          onChange={(value) => {
                            setRejectionRemoveLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                      <FormGroup className="form-check">
                        <Input
                          type="checkbox"
                          name="check"
                          id="deleteIdea"
                          checked={rejectionDeleteIdea}
                          onChange={({ target }) =>
                            setRejectionDeleteIdea(target.checked)
                          }
                        />
                        <Label for="deleteIdea" check>
                          Delete Idea
                        </Label>
                      </FormGroup>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </>
          )}
          {workflowType === WorkflowType.Page && (
            <>
              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>2. Filter Options</h5>
                  <br />
                  <p>
                    Select the set of Pages to be processed in this workflow.
                  </p>
                  <Row className="align-items-center">
                    <Col md={8}>
                      <FormGroup>
                        <FilterSelect
                          label="Labels"
                          placeholder="Select the labels..."
                          value={filterLabels}
                          onChange={(value) => {
                            setFilterLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <div className="input-group">
                          <FormGroup check inline>
                            <CustomInput
                              type="radio"
                              name="matchtype"
                              id="match-type-all"
                              value="all"
                              checked={matchType == 'all'}
                              onChange={({ target }) =>
                                setMatchType(target.value)
                              }
                              label="Match All"
                            />
                          </FormGroup>
                          <FormGroup check inline>
                            <CustomInput
                              type="radio"
                              name="matchtype"
                              id="match-type-any"
                              value="any"
                              checked={matchType == 'any'}
                              onChange={({ target }) =>
                                setMatchType(target.value)
                              }
                              label="Match Any"
                            />
                          </FormGroup>
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>
                  <FormGroup>
                    <Label for="statuses">Status</Label>
                    <CustomInput
                      type="select"
                      id="status"
                      value={pageStatus}
                      onChange={({ target }) => setPageStatus(target.value)}
                    >
                      <option value="">Any Status</option>
                      <option value="0">Draft</option>
                      <option value="1">Published</option>
                      <option value="1">Deleted</option>
                    </CustomInput>
                  </FormGroup>
                  <FormGroup>
                    <FilterSelect
                      label="Page Type"
                      placeholder="Select a page type..."
                      value={contentTemplate}
                      onChange={(value) => {
                        setContentTemplate(value);
                      }}
                      defaultOptions
                      loadOptions={loadContentTemplateOptions}
                      isClearable={true}
                    />
                  </FormGroup>

                  <FormGroup>
                    <AccountPicker
                      label="Edited By"
                      orgId={orgId}
                      accounts={editors}
                      onChange={(value) => {
                        setEditors(value);
                      }}
                      isMulti
                    />
                  </FormGroup>
                </CardBody>
              </Card>

              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>3. Assignment</h5>
                  <br />
                  <p>
                    Select the accounts to assign to this annotation workflow.
                  </p>
                  <FormGroup>
                    <AccountPicker
                      label="Accounts"
                      orgId={orgId}
                      accounts={assignees}
                      onChange={(value) => {
                        setAssignees(value);
                      }}
                      isMulti
                    />
                    {/* <FilterSelect
                      label="Accounts"
                      placeholder="Select accounts..."
                      value={assignees}
                      onChange={(value) => {
                        setAssignees(value);
                      }}
                      loadOptions={loadAccountsOptions}
                      isMulti
                      defaultOptions={true}
                    /> */}
                  </FormGroup>
                </CardBody>
              </Card>

              <Card className="mb-3" light={true}>
                <CardBody>
                  <h5>4. Actions</h5>
                  <br />
                  <p>
                    Select the actions to be taken after approving or rejecting
                    a Page.
                  </p>
                  <Row>
                    <Col md={6}>
                      <p>On Approval:</p>
                      <FormGroup>
                        <FilterSelect
                          label="Apply Labels"
                          placeholder="Select label..."
                          value={approvalApplyLabels}
                          onChange={(value) => {
                            setApprovalApplyLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                      <FormGroup>
                        <FilterSelect
                          label="Remove Labels"
                          placeholder="Select label..."
                          value={approvalRemoveLabels}
                          onChange={(value) => {
                            setApprovalRemoveLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label for="statuses">Change Status</Label>
                        <CustomInput
                          type="select"
                          id="approvalChangeStatus"
                          value={approvalChanageStatus}
                          onChange={({ target }) =>
                            setApprovalChangeStatus(target.value)
                          }
                        >
                          <option value="">No Change</option>
                          <option value="0">Draft</option>
                          <option value="1">Published</option>
                        </CustomInput>
                      </FormGroup>
                    </Col>
                    <Col md={6} style={{ borderLeft: 'dashed 1px #ccc' }}>
                      <p>On Rejection:</p>
                      <FormGroup>
                        <FilterSelect
                          label="Apply Labels"
                          placeholder="Select label..."
                          value={rejectionApplyLabels}
                          onChange={(value) => {
                            setRejectionApplyLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                      <FormGroup>
                        <FilterSelect
                          label="Remove Labels"
                          placeholder="Select label..."
                          value={rejectionRemoveLabels}
                          onChange={(value) => {
                            setRejectionRemoveLabels(value);
                          }}
                          defaultOptions
                          loadOptions={loadLabelsOptions}
                          isClearable={true}
                          isMulti
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label for="statuses">Change Status</Label>
                        <CustomInput
                          type="select"
                          id="rejectionChanageStatus"
                          value={rejectionChanageStatus}
                          onChange={({ target }) =>
                            setRejectionChangeStatus(target.value)
                          }
                        >
                          <option value="">No Change</option>
                          <option value="0">Draft</option>
                          <option value="1">Published</option>
                          <option value="3">Deleted</option>
                        </CustomInput>
                      </FormGroup>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default WorkflowSettings;
