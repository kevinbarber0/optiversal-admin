import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { requireRoles } from '@util/auth.js';
import {
  useOrgSettings,
  updateOrgSettings,
  getCategories,
  getSkus,
  updateOrgGeoLocations,
  useGetContentTemplates,
} from '@util/api.js';
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
  CustomInput,
} from 'reactstrap';
import { Languages } from '@util/enum';
import FalconCardHeader from '@components/common/FalconCardHeader';
import renderConfirmDialog from '@components/ConfirmDialog';
import classNames from 'classnames';
import { toast } from 'react-toastify';
import FilterSelect from '@components/FilterSelect';
import { getRouteRoles } from 'routes';
import BootstrapTable from 'react-bootstrap-table-next';
import ButtonIcon from '@components/common/ButtonIcon';
import GeoLocationsTable from '@components/settings/GeoLocationsTable';
import { getExtension, isNumeric } from '@helpers/utils';
import { Constants } from '@util/global';
import * as XLSX from 'xlsx';

import {
  CustomGoogleSignIn,
  CustomGoogleSignOut,
} from '@components/CustomGoogleLogin';

const SettingsPage = () => {
  const { status, data: settingsResult } = useOrgSettings();
  const { data: ctResult } = useGetContentTemplates(0, 1000);
  const [orgName, setOrgName] = useState();
  const [productType, setProductType] = useState();
  const [minimumQualityScore, setMinimumQualityScore] = useState();
  const [includeBlurbs, setIncludeBlurbs] = useState();
  const [includeParagraphs, setIncludeParagraphs] = useState();
  const [includePros, setIncludePros] = useState();
  const [includeCons, setIncludeCons] = useState();
  const [includeReviewExcerpts, setIncludeReviewExcerpts] = useState();
  const [homeUrl, setHomeUrl] = useState();
  const [urlFormat, setUrlFormat] = useState();
  const [excludedCategories, setExcludedCategories] = useState();
  const [excludedSkus, setExcludedSkus] = useState();
  const [maxResults, setMaxResults] = useState();
  const [suppressedWords, setSuppressedWords] = useState([]);
  const [boostedWords, setBoostedWords] = useState([]);
  const [prepopulated, setPrepopulated] = useState(false);
  const [locals, setLocals] = useState([]);
  const [locationPageTitle, setLocationPageTitle] = useState();
  const [geoFile, setGeoFile] = useState();
  const [geoLocations, setGeoLocations] = useState(null);
  const [working, setWorking] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState(
    Constants.ProductAssortmentContentTemplateId,
  );

  const newPhraseRef = useRef();
  const newURLRef = useRef();
  const [newPhraseError, setNewPhraseError] = useState(null);

  const [dictionary, setDictionary] = useState([]);
  const [integrations, setIntegrations] = useState({});

  const submitNewPhrase = useCallback(() => {
    const newPhrase = newPhraseRef.current.value;
    const newURL = newURLRef.current.value;

    if (!newPhrase) {
      setNewPhraseError({
        phraseError: newPhrase ? null : 'Please input a phrase',
      });
    } else if (dictionary.some((phrase) => phrase.phrase === newPhrase)) {
      setNewPhraseError({
        phraseError: 'Duplicated phrase',
      });
    } else {
      setNewPhraseError({
        phraseError: null,
      });
      setDictionary([
        ...dictionary,
        {
          phrase: newPhrase,
          url: newURL,
        },
      ]);
    }
  }, [dictionary]);

  const deletePhrase = useCallback(
    (selectedPhrase) => {
      renderConfirmDialog(
        'Delete Phrase',
        'Do you really want to delete this phrase?',
      ).then(() => {
        setDictionary((oldDictionary) =>
          oldDictionary.filter((phrase) => phrase.phrase !== selectedPhrase),
        );
      });
    },
    [dictionary],
  );

  const dictionaryColumns = useMemo(
    () => [
      {
        dataField: 'phrase',
        text: 'Phrase',
        classes: 'border-0',
        headerClasses: 'border-0',
        sort: false,
        width: 200,
        formatter: (value, row) => {
          return row.isNew ? (
            <>
              <Input innerRef={newPhraseRef} invalid={!!row?.phraseError} />
              {row?.phraseError && <span>{row?.phraseError}</span>}
            </>
          ) : (
            value
          );
        },
      },
      {
        dataField: 'url',
        text: 'URL',
        classes: 'border-0',
        headerClasses: 'border-0',
        sort: false,
        width: 400,
        formatter: (value, row) => {
          return row.isNew ? (
            <>
              <Input innerRef={newURLRef} />
            </>
          ) : (
            <a href={value}>{value}</a>
          );
        },
      },
      {
        dataField: 'action',
        text: '',
        classes: 'border-0',
        headerClasses: 'border-0',
        sort: false,
        width: 50,
        formatter: (_, row) => {
          return row.isNew ? (
            <ButtonIcon
              color={'outline-success'}
              size="sm"
              className="w-lg-30"
              icon="check"
              onClick={submitNewPhrase}
            ></ButtonIcon>
          ) : (
            <ButtonIcon
              color={'outline-danger'}
              size="sm"
              className="w-lg-30"
              icon="times"
              onClick={() => {
                deletePhrase(row.phrase);
              }}
            ></ButtonIcon>
          );
        },
      },
    ],
    [newPhraseError, deletePhrase, submitNewPhrase],
  );

  const handleSave = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setWorking(true);
    const settings = {
      name: orgName,
      productType: productType,
      homeUrl: homeUrl,
      urlFormat: urlFormat,
      includeBlurbs: includeBlurbs,
      includeParagraphs: includeParagraphs,
      includePros: includePros,
      includeCons: includeCons,
      includeReviewExcerpts: includeReviewExcerpts,
      minimumQualityScore: minimumQualityScore,
      excludedCategories: excludedCategories,
      excludedSkus: excludedSkus,
      maxResults: maxResults,
      suppressedWords: suppressedWords,
      boostedWords: boostedWords,
      dictionary: dictionary,
      locationPageTitle: locationPageTitle,
      geoLocations: geoLocations,
      localizations: locals,
      integrations: integrations,
      defaultTemplate: defaultTemplate,
    };

    const res = await updateOrgSettings(settings);
    if (res.success) {
      await updateOrgLocations();
      toast.success('Settings updated!', { theme: 'colored' });
    } else {
      toast.error('Settings could not be updated: ' + res.message, {
        theme: 'colored',
      });
    }
    setWorking(false);
  };

  useEffect(() => {
    if (
      !prepopulated &&
      status === 'success' &&
      settingsResult &&
      settingsResult.settings
    ) {
      setPrepopulated(true);
      setOrgName(settingsResult.settings.name);
      setProductType(settingsResult.settings.productType);
      setHomeUrl(settingsResult.settings.homeUrl);
      setUrlFormat(settingsResult.settings.urlFormat);
      setIncludeBlurbs(settingsResult.settings.includeBlurbs);
      setIncludeParagraphs(settingsResult.settings.includeParagraphs);
      setIncludePros(settingsResult.settings.includePros);
      setIncludeCons(settingsResult.settings.includeCons);
      setIncludeReviewExcerpts(settingsResult.settings.includeReviewExcerpts);
      setMinimumQualityScore(settingsResult.settings.minimumQualityScore || 5);
      setMaxResults(settingsResult.settings.maxResults || 10);
      setExcludedCategories(settingsResult.settings.excludedCategories || []);
      setExcludedSkus(settingsResult.settings.excludedSkus || []);
      setSuppressedWords(settingsResult.settings.suppressedWords || []);
      setBoostedWords(settingsResult.settings.boostedWords || []);
      setLocals(settingsResult.settings.localizations || []);
      setLocationPageTitle(
        settingsResult.settings.locationPageTitle || '{{title}} in {{city}}',
      );
      setDictionary(settingsResult.settings.dictionary || []);
      setIntegrations(settingsResult.settings.integrations || {});
      setDefaultTemplate(settingsResult.settings.defaultTemplate);
    }
  }, [status, settingsResult]);

  const handleCancel = () => {
    Router.push('/');
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

  const loadSkusOptions = (inputValue) =>
    new Promise((resolve) => {
      resolve(
        getSkus(inputValue).then((res) =>
          res.products.map((p) => {
            return { value: p.sku, label: p.sku };
          }),
        ),
      );
    });

  const handleLocalization = ({ target }) => {
    if (target.checked) setLocals([...locals, target.name]);
    else setLocals(locals.filter((l) => l != target.name));
  };

  const handleUploadedFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGeoFile(file);
    const ext = getExtension(file.name).toLowerCase();

    switch (ext) {
      case 'txt':
        handlePlainTextFile(file);
        break;
      case 'json':
        handleJsonFile(file);
        break;
      case 'csv':
        handleCSVFile(file);
        break;
      default:
        toast.error('Unkown file.', { theme: 'colored' });
    }
  };

  const handlePlainTextFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target.result) {
        setGeoFile(null);
        setGeoLocations(null);
        toast.error('Empty file.', { theme: 'colored' });
        return;
      }
      let content = e.target.result.split(/\r\n|\n/).filter((el) => el);

      const firstRow = content[0].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);

      if (firstRow.length === 1 || firstRow.length === 6) {
        if (firstRow.length === 1) parseOneColFileData(content);
        else parseSixColsFileData(content);
      } else {
        setGeoFile(null);
        setGeoLocations(null);
        toast.error('Invalid File.', { theme: 'colored' });
        return;
      }
    };
    reader.readAsText(file);
  };

  const handleJsonFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target.result) {
        setGeoFile(null);
        setGeoLocations(null);
        toast.error('Empty file.', { theme: 'colored' });
        return;
      }
      const content = JSON.parse(e.target.result);

      // const firstRow = content[0];

      const locations = content
        .map((location) => {
          if (!location.hasOwnProperty('id')) return null;
          const data = { location_id: location.id };

          if (location.hasOwnProperty('name')) data.name = location.name;
          else data.name = location.id;
          if (location.hasOwnProperty('city')) data.city = location.city;
          else data.city = data.name;
          if (location.hasOwnProperty('state')) data.state = location.state;
          else if (location.hasOwnProperty('province'))
            data.state = location.province;
          if (location.hasOwnProperty('latitude'))
            data.latitude = location.latitude;
          else if (location.hasOwnProperty('lat')) data.latitude = location.lat;
          if (location.hasOwnProperty('longitude'))
            data.longitude = location.longitude;
          else if (location.hasOwnProperty('long'))
            data.longitude = location.long;
          return data;
        })
        .filter((loc) => {
          return loc !== null;
        });

      if (locations.length > 0) {
        setGeoLocations(locations);
      } else {
        setGeoFile(null);
        setGeoLocations(null);
        toast.error('Invalid File.', { theme: 'colored' });
        return;
      }
    };
    reader.readAsText(file);
  };

  const handleCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      /* Parse data */
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_csv(ws, { header: 1 });

      let content = data.split(/\r\n|\n/);

      const headers = content[0].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/);

      if (headers.length === 1 || headers.length === 6) {
        content.shift();
        if (headers.length === 1) parseOneColFileData(content);
        else parseSixColsFileData(content);
      } else {
        setGeoFile(null);
        setGeoLocations(null);
        toast.error('Invalid File.', { theme: 'colored' });
        return;
      }
    };
    reader.readAsBinaryString(file);
  };

  const parseOneColFileData = (content) => {
    let headers = ['location_id'];

    const list = [];
    for (let i = 0; i < content.length; i++) {
      const row = content[i].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)|\t/);
      if (row && row.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            if (d[0] === '"') d = d.substring(1, d.length - 1);
            if (d[d.length - 1] == '"') d = d.substring(d.length - 2, 1);
          }
          if (headers[j]) {
            obj[headers[j]] = d;
          }
        }

        // remove the blank rows
        if (Object.values(obj).filter((x) => x).length > 0) {
          list.push({
            ...obj,
            name: obj.location_id,
            latitude: null,
            longitude: null,
          });
        }
      } else {
        setGeoFile(null);
        setGeoLocations(null);
        toast.error('Invalid File.', { theme: 'colored' });
        return;
      }
    }
    setGeoLocations(list);
  };

  const parseSixColsFileData = (content) => {
    let headers = [
      'location_id',
      'name',
      'city',
      'state',
      'latitude',
      'longitude',
    ];

    const list = [];
    for (let i = 0; i < content.length; i++) {
      const row = content[i].split(/,(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)|\t/);
      if (row && row.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          let d = row[j];
          if (d.length > 0) {
            if (d[0] === '"') d = d.substring(1, d.length - 1);
            if (d[d.length - 1] === '"') d = d.substring(d.length - 2, 1);
          }

          if ((j === 4 || j === 5) && !isNumeric(d)) {
            setGeoFile(null);
            setGeoLocations(null);
            toast.error('Invalid File.', { theme: 'colored' });
            return;
          }
          if (headers[j]) {
            obj[headers[j]] = d;
          }
        }

        // remove the blank rows
        if (Object.values(obj).filter((x) => x).length > 0) {
          list.push(obj);
        }
      } else {
        setGeoFile(null);
        setGeoLocations(null);
        toast.error('Invalid File.', { theme: 'colored' });
        return;
      }
    }
    setGeoLocations(list);
  };

  const updateOrgLocations = useCallback(async () => {
    if (!geoLocations) return;
    const res = await updateOrgGeoLocations(geoLocations);
    if (res.success) {
      setGeoLocations(null);
      setGeoFile(null);
    } else {
      toast.error(
        `Organization's locations could not be updated: ` + res.message,
        { theme: 'colored' },
      );
    }
  }, [geoLocations]);

  return (
    <>
      <Row noGutters>
        <Col lg="9" className={classNames('pr-lg-2', { 'mb-3': false })}>
          <Card className="mb-3">
            <FalconCardHeader title="Settings" light={true}>
              <Button
                color="falcon-secondary"
                size="sm"
                className="mr-2"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                color="falcon-primary"
                size="sm"
                onClick={handleSave}
                disabled={working}
              >
                {working ? 'Saving' : 'Save'}
              </Button>
            </FalconCardHeader>
            {status === 'success' && (
              <CardBody tag={Form} onSubmit={handleSave}>
                <h5>Basic Settings</h5>
                <FormGroup>
                  <Label for="orgName">Organization Name</Label>
                  <InputGroup>
                    <Input
                      id="orgName"
                      placeholder="Organization Name"
                      defaultValue={orgName}
                      onChange={({ target }) => setOrgName(target.value)}
                    />
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label for="productType">Primary product type</Label>
                  <InputGroup>
                    <Input
                      id="productType"
                      placeholder="e.g. sports apparel"
                      defaultValue={productType}
                      onChange={({ target }) => setProductType(target.value)}
                    />
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label for="homeUrl">Homepage URL</Label>
                  <InputGroup>
                    <Input
                      id="homeUrl"
                      placeholder="e.g. https://yoursite.com"
                      defaultValue={homeUrl}
                      onChange={({ target }) => setHomeUrl(target.value)}
                    />
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label for="urlFormat">Page URL format</Label>
                  <InputGroup>
                    <Input
                      id="urlFormat"
                      placeholder="e.g. https://yoursite.com/shop/{{slug}}"
                      defaultValue={urlFormat}
                      onChange={({ target }) => setUrlFormat(target.value)}
                    />
                  </InputGroup>
                </FormGroup>
                <FormGroup>
                  <Label>Default page template</Label>
                  <CustomInput
                    type="select"
                    id="defaultTemplate"
                    value={defaultTemplate}
                    onChange={({ target }) => setDefaultTemplate(target.value)}
                  >
                    {ctResult?.contentTemplates?.map((ct) => (
                      <option
                        key={ct.contentTemplateId}
                        value={ct.contentTemplateId}
                      >
                        {ct.name}
                      </option>
                    ))}
                  </CustomInput>
                </FormGroup>
                <FormGroup>
                  <Label for="boosts">Boosted words (one per line)</Label>
                  <div className="input-group">
                    <Input
                      id="boosts"
                      type="textarea"
                      multiple={true}
                      rows={2}
                      placeholder="Boosted word 1"
                      value={boostedWords.join('\n')}
                      onChange={({ target }) =>
                        setBoostedWords(target.value.split('\n'))
                      }
                    />
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label for="suppressions">
                    Suppressed words (one per line)
                  </Label>
                  <div className="input-group">
                    <Input
                      id="suppressions"
                      type="textarea"
                      multiple={true}
                      rows={2}
                      placeholder="Suppressed word 1"
                      value={suppressedWords.join('\n')}
                      onChange={({ target }) =>
                        setSuppressedWords(target.value.split('\n'))
                      }
                    />
                  </div>
                </FormGroup>
                <hr />
                <h5>Product Assortment Settings</h5>
                <FormGroup className="form-check">
                  <Input
                    type="checkbox"
                    name="autore"
                    id="autore"
                    checked={includeReviewExcerpts}
                    onChange={({ target }) =>
                      setIncludeReviewExcerpts(target.checked)
                    }
                  />
                  <Label for="autore" check>
                    Include review excerpts
                  </Label>
                </FormGroup>
                <FormGroup className="form-check">
                  <Input
                    type="checkbox"
                    name="autopros"
                    id="autopros"
                    checked={includePros}
                    onChange={({ target }) => setIncludePros(target.checked)}
                  />
                  <Label for="autopros" check>
                    Include review pros
                  </Label>
                </FormGroup>
                <FormGroup className="form-check">
                  <Input
                    type="checkbox"
                    name="autocons"
                    id="autocons"
                    checked={includeCons}
                    onChange={({ target }) => setIncludeCons(target.checked)}
                  />
                  <Label for="autocons" check>
                    Include review cons
                  </Label>
                </FormGroup>
                <FormGroup className="form-check">
                  <Input
                    type="checkbox"
                    name="autoblurbs"
                    id="autoblurbs"
                    checked={includeBlurbs}
                    onChange={({ target }) => setIncludeBlurbs(target.checked)}
                  />
                  <Label for="autoblurbs" check>
                    Include product blurbs
                  </Label>
                </FormGroup>
                <FormGroup className="form-check">
                  <Input
                    type="checkbox"
                    name="autoparagraphs"
                    id="autoparagraphs"
                    checked={includeParagraphs}
                    onChange={({ target }) =>
                      setIncludeParagraphs(target.checked)
                    }
                  />
                  <Label for="autoparagraphs" check>
                    Include product paragraphs
                  </Label>
                </FormGroup>
                <FilterSelect
                  label="Excluded categories"
                  placeholder="Select categories..."
                  value={excludedCategories}
                  onChange={(value) => {
                    setExcludedCategories(value);
                  }}
                  loadOptions={loadCategoriesOptions}
                  isMulti
                />

                <FilterSelect
                  label="Excluded products"
                  placeholder="Select products to exclude..."
                  value={excludedSkus}
                  onChange={(value) => {
                    setExcludedSkus(value);
                  }}
                  loadOptions={loadSkusOptions}
                  isMulti
                />

                <FormGroup>
                  <Label for="maxresult">Maximum Search Results</Label>
                  <div className="input-group">
                    <Input
                      id="maxresult"
                      type="number"
                      min="1"
                      max="100"
                      value={maxResults}
                      onChange={({ target }) => setMaxResults(target.value)}
                    />
                  </div>
                </FormGroup>

                <hr />
                <h5>Location Page Settings</h5>
                <FormGroup>
                  <Label for="orgName">Location page title</Label>
                  <InputGroup>
                    <Input
                      id="locationPageTitle"
                      value={locationPageTitle}
                      onChange={({ target }) =>
                        setLocationPageTitle(target.value)
                      }
                    />
                  </InputGroup>
                </FormGroup>
                <FormGroup className="form-geo">
                  <Label for="geo-location">Page Locations</Label>
                  <div className="input-group">
                    <input
                      type="file"
                      name="file"
                      accept=".txt, .csv, .json"
                      multiple={false}
                      onChange={handleUploadedFile}
                      className="sm"
                    />
                  </div>
                  <br />
                  <GeoLocationsTable inputContent={geoLocations} />
                </FormGroup>

                <hr />
                <h5>Dictionary Settings</h5>
                <div className="table-responsive">
                  <BootstrapTable
                    bootstrap4
                    keyField={'phrase'}
                    data={[
                      ...dictionary,
                      {
                        isNew: true,
                        ...newPhraseError,
                      },
                    ]}
                    columns={dictionaryColumns}
                    remote
                    bordered={false}
                    classes="table-dashboard table-sm fs--1 border-bottom border-200 mb-0 table-dashboard-th-nowrap"
                    rowClasses="btn-reveal-trigger border-top border-200"
                    headerClasses="bg-200 text-900 border-y border-200"
                    noDataIndication="No data available"
                  />
                </div>

                <hr />
                <h5>Translated language codes</h5>
                <Row xs="auto">
                  {Object.keys(Languages)
                    .slice(1)
                    .map((l) => (
                      // eslint-disable-next-line react/jsx-key
                      <Col md="auto">
                        <FormGroup className="form-check">
                          <Input
                            type="checkbox"
                            name={l}
                            id={l}
                            checked={locals.includes(l)}
                            onChange={handleLocalization}
                          />
                          <Label for={l} check>
                            {Languages[l]}
                          </Label>
                        </FormGroup>
                      </Col>
                    ))}
                </Row>

                <hr />
                <IntegrationsSection
                  integrations={integrations}
                  setIntegrations={setIntegrations}
                  handleSave={handleSave}
                />
              </CardBody>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

const IntegrationsSection = ({ integrations, setIntegrations, handleSave }) => {
  const connectGoogleSearchConsoleAPI = (response) => {
    integrations.googleSearchConsoleAPICode = response.code;
    setIntegrations(integrations);
    handleSave();
  };
  const revokeGoogleSearchConsoleAPI = () => {
    integrations.googleSearchConsoleAPICode = null;
    setIntegrations(integrations);
    handleSave();
  };

  return (
    <React.Fragment>
      <h5>Integrations</h5>
      <FormGroup>
        <Label for="google-search-console-integration">
          Google Search Console API
        </Label>
        &emsp;
        {integrations && integrations.googleSearchConsoleAPICode ? (
          <CustomGoogleSignOut onSingOut={revokeGoogleSearchConsoleAPI} />
        ) : (
          <CustomGoogleSignIn onSingInSuccess={connectGoogleSearchConsoleAPI} />
        )}
      </FormGroup>
    </React.Fragment>
  );
};

export default requireRoles(SettingsPage, getRouteRoles('/settings'));
