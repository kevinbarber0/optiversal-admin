import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardFooter,
  Col,
  Row,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  InputGroup,
  InputGroupAddon,
  CustomInput,
} from 'reactstrap';
import Loader from '@components/common/Loader';
import FalconCardHeader from '@components/common/FalconCardHeader';
import classNames from 'classnames';
import {
  updateComponent,
  getCompletion,
  semanticSearchProducts,
  getSample,
} from '@util/api.js';
import Router from 'next/router';
import { toast } from 'react-toastify';
import Flex from '@components/common/Flex';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift } from '@fortawesome/free-solid-svg-icons';
//import kohls from '@data/kohls1';

const EditComponent = (props) => {
  const loremSuffix =
    ' sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
  const loremLines = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Mauris ultrices mauris sit amet lectus pharetra vestibulum ac ligula non leo eleifend mollis et sed nulla.',
    'Phasellus placerat massa suscipit diam faucibus ullamcorper vitae et lorem, cras posuere lectus a velit suscipit ultrices.',
    'Suspendisse at turpis vitae sapien placerat tincidunt ac at magna, vivamus sit amet sapien a erat feugiat fringilla et non ante.',
    'Integer iaculis dolor non dui volutpat, pharetra tristique nisl hendrerit.',
    'Aenean ac nisi sed justo dignissim varius quis eget nisl, quisque sit amet urna id quam mollis hendrerit ut id sem.',
    'Tellus in metus vulputate eu scelerisque felis imperdiet proin fermentum.',
    'Elementum tempus egestas sed sed risus pretium quam vulputate, suspendisse potenti nullam ac tortor vitae purus faucibus.',
    'Egestas diam in arcu cursus. Lobortis mattis aliquam faucibus purus in.',
    'Vitae congue eu consequat ac felis donec et odio.',
  ];

  const [name, setName] = useState(props.component ? props.component.name : '');
  const [componentType, setComponentType] = useState(
    props.component
      ? props.component.settings.componentType || 'block'
      : 'block',
  );
  const [prompt, setPrompt] = useState(
    props.component ? props.component.settings.prompt : '',
  );
  const [header, setHeader] = useState(
    props.component ? props.component.settings.header : '',
  );
  const [intros, setIntros] = useState(
    props.component ? props.component.settings.intros : [],
  );
  const [contentType, setContentType] = useState(
    props.component
      ? props.component.settings.contentType || 'paragraph'
      : 'paragraph',
  );
  const [numSentences, setNumSentences] = useState(
    props.component ? props.component.settings.numSentences : 5,
  );
  const [boostedKeywords, setBoostedKeywords] = useState(
    props.component ? props.component.settings.boostedKeywords : [],
  );
  const [suppressedKeywords, setSuppressedKeywords] = useState(
    props.component ? props.component.settings.suppressedKeywords : [],
  );
  const [sampleTopic, setSampleTopic] = useState(
    props.component ? props.component.settings.sampleTopic : '',
  );
  const [sampleText, setSampleText] = useState(
    props.component ? props.component.settings.sampleText : '',
  );
  const [sampleData, setSampleData] = useState(
    props.component ? props.component.sampleData : null,
  );
  const [engine, setEngine] = useState(
    props.component
      ? props.component.settings.engine || 'text-davinci-002'
      : 'text-davinci-002',
  );
  const [temperature, setTemperature] = useState(
    props.component ? props.component.settings.temperature : 0.7,
  );
  const [stops, setStops] = useState(
    props.component ? props.component.settings?.stops || [] : [],
  );
  const [working, setWorking] = useState(false);

  const saveComponent = async () => {
    const component = {
      componentId: props.component?.componentId,
      name: name,
      settings: {
        prompt: prompt,
        componentType: componentType,
        header: header,
        intros: intros,
        contentType: contentType,
        numSentences: numSentences,
        boostedKeywords: boostedKeywords,
        suppressedKeywords: suppressedKeywords,
        engine: engine,
        temperature: parseFloat(temperature),
        stops: stops,
        sampleTopic: sampleTopic,
        sampleText: sampleText,
        sampleData: sampleData,
      },
    };
    const res = await updateComponent(component);
    if (res.success) {
      toast.success('Component saved!');
    } else {
      toast.error('There was a problem saving this component: ' + res.message);
    }
    return res;
  };

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    } else {
      Router.push('/components');
    }
  };

  const handleSave = async () => {
    const res = await saveComponent();
    if (res.success && props.onSave) {
      props.onSave(res.componentId);
    }
  };

  const handleSample = async (e) => {
    if (e) {
      e.preventDefault();
    }
    if (!sampleTopic || sampleTopic.trim() === '') {
      toast.error('Please enter a sample title to generate on-topic content');
      return;
    }

    setWorking(true);
    const settings = {
      topic: sampleTopic,
      componentType: componentType,
      prompt: prompt,
      header: header,
      intros: intros,
      contentType: contentType,
      numSentences: numSentences,
      boostedKeywords: boostedKeywords,
      suppressedKeywords: suppressedKeywords,
      engine: engine,
      temperature: parseFloat(temperature),
      stops: stops,
    };
    const res = await getCompletion(settings);
    if (res && res.success) {
      setSampleText(res.composition);
    }
    setWorking(false);
  };

  const getProductList = (products) => {
    if (!products) {
      return null;
    }
    return (
      <Row>
        {products.map((product) => (
          <Col
            key={product.id}
            style={{ maxWidth: '20%' }}
            className="justify-content-between align-items-center"
          >
            {product.image ? (
              <img src={product.image} style={{ maxWidth: 100 }} />
            ) : (
              <FontAwesomeIcon icon={faGift} size="5x"></FontAwesomeIcon>
            )}
            <div style={{ fontSize: 'small', textAlign: 'center' }}>
              {product.name}
            </div>
          </Col>
        ))}
      </Row>
    );
  };

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
    }
    if (!sampleTopic || sampleTopic.trim() === '') {
      toast.error(
        'Please enter a sample title to generate an on-topic product assortment',
      );
      return;
    }

    setWorking(true);
    const settings = {
      topic: sampleTopic,
      componentType: componentType,
      prompt: prompt,
      header: header,
      maxResults: numSentences,
      engine: engine,
      temperature: parseFloat(temperature),
    };
    const res = await semanticSearchProducts(settings);
    if (res && res.success) {
      setSampleData(res.products);
    }
    setWorking(false);
  };

  const getLorem = () => {
    if (intros && intros.length > 0 && intros[0].trim().length > 0) {
      const lastChar = intros[0].trim().slice(-1);
      if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
        return intros[0] + ' ' + loremLines.slice(1, numSentences).join(' ');
      } else {
        return (
          intros[0] +
          loremSuffix +
          ' ' +
          loremLines.slice(1, numSentences).join(' ')
        );
      }
    } else {
      if (componentType === 'search') {
        const sampleData = Array.from({ length: numSentences }, (_, id) => ({
          id,
        }));
        return (
          <Row>
            {sampleData.map((obj) => (
              <Col
                key={obj.id}
                className="justify-content-between align-items-center"
              >
                <FontAwesomeIcon icon={faGift} size="5x"></FontAwesomeIcon>
                <br />
                Product {obj.id + 1}
              </Col>
            ))}
          </Row>
        );
      } else {
        if (contentType === 'paragraph') {
          return loremLines.slice(0, numSentences).join(' ');
        } else if (contentType === 'ul') {
          return (
            <ul>
              {loremLines.slice(0, numSentences).map((sentence, index) => (
                <li key={index}>{sentence}</li>
              ))}
            </ul>
          );
        } else if (contentType === 'ol') {
          return (
            <ol>
              {loremLines.slice(0, numSentences).map((sentence, index) => (
                <li key={index}>{sentence}</li>
              ))}
            </ol>
          );
        }
      }
    }
  };

  let textFile = null;
  const makeTextFile = (text) => {
    var data = new Blob([text], { type: 'text/plain' });

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    return textFile;
  };

  /*const handleSampleKohls = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!sampleTopic || sampleTopic.trim() === '') {
      toast.error('Please enter a sample title to generate on-topic content');
      return;
    }

    setWorking(true);
    const exportData = [];
    for (let i = 0; i < kohls.length; i++) {
      let finalPrompt = prompt;
      finalPrompt = finalPrompt.replace('{name}', kohls[i].name);
      finalPrompt = finalPrompt.replace('{original}', kohls[i].original);
      finalPrompt = finalPrompt.replace('{features}', kohls[i].features);

      const settings = {
        topic: sampleTopic,
        componentType: componentType,
        prompt: finalPrompt,
        header: header,
        intros: intros,
        contentType: contentType,
        maxSentences: numSentences,
        boostedKeywords: boostedKeywords,
        suppressedKeywords: suppressedKeywords
      };
      const res = await getSample(settings);
      if (res && res.success) {
        setSampleText(res.composition);
        exportData.push({ url: kohls[i].url, name: kohls[i].name, original: kohls[i].original, features: kohls[i].features, description: res.composition });
      }
    }
    setWorking(false);
    var link = document.createElement('a');
    link.setAttribute('download', 'kohlsfinal2.json');
    link.href = makeTextFile(JSON.stringify(exportData));
    document.body.appendChild(link);

    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      link.dispatchEvent(event);
      document.body.removeChild(link);
    });
  };*/

  return (
    <>
      <Card>
        <CardBody>
          <Row className="justify-content-between align-items-center">
            <Col md>
              <h5 className="mb-2 mb-md-0">
                {props.component ? 'Edit' : 'Create'} Component
              </h5>
            </Col>
            <Col xs="auto">
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
                size="md"
                className="mr-2"
                onClick={handleSave}
              >
                Save
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>
      <br />
      <Row noGutters>
        <Col lg="6" className={classNames('pr-lg-2', { 'mb-3': false })}>
          <Card className="mb-3">
            <FalconCardHeader title="Settings" light={false} />
            <CardBody tag={Form} className="bg-light">
              <FormGroup>
                <Label for="name">Component Name</Label>
                <div className="input-group">
                  <Input
                    id="name"
                    placeholder="Name"
                    value={name}
                    onChange={({ target }) => setName(target.value)}
                  />
                </div>
              </FormGroup>
              <FormGroup>
                <Label for="numsentences">Component type</Label>
                <div className="input-group">
                  <FormGroup check inline>
                    <Label check>
                      <Input
                        type="radio"
                        name="componenttype"
                        value="block"
                        checked={componentType === 'block'}
                        onChange={({ target }) =>
                          setComponentType(target.value)
                        }
                      />{' '}
                      Content Block
                    </Label>
                  </FormGroup>
                  <FormGroup check inline>
                    <Label check>
                      <Input
                        type="radio"
                        name="componenttype"
                        value="search"
                        checked={componentType === 'search'}
                        onChange={({ target }) =>
                          setComponentType(target.value)
                        }
                      />{' '}
                      Product List
                    </Label>
                  </FormGroup>
                </div>
              </FormGroup>
              <FormGroup>
                <Label for="prompt">
                  {componentType === 'search' ? 'Query' : 'Prompt'}
                </Label>
                <div className="input-group">
                  <Input
                    id="prompt"
                    type="textarea"
                    rows={5}
                    value={prompt}
                    onChange={({ target }) => setPrompt(target.value)}
                  />
                </div>
              </FormGroup>
              <hr />
              <FormGroup>
                <Label for="header">Header</Label>
                <div className="input-group">
                  <Input
                    id="header"
                    placeholder="Header"
                    value={header}
                    onChange={({ target }) => setHeader(target.value)}
                  />
                </div>
              </FormGroup>
              {componentType === 'block' && (
                <>
                  <FormGroup>
                    <Label for="intros">Content intros (one per line)</Label>
                    <div className="input-group">
                      <Input
                        id="intros"
                        type="textarea"
                        multiple={true}
                        rows={2}
                        placeholder="Four score and"
                        value={intros.join('\n')}
                        onChange={({ target }) =>
                          setIntros(target.value.split('\n'))
                        }
                      />
                    </div>
                  </FormGroup>
                  <FormGroup>
                    <Label for="numsentences">Content type</Label>
                    <div className="input-group">
                      <FormGroup check inline>
                        <Label check>
                          <Input
                            type="radio"
                            name="outputtype"
                            value="paragraph"
                            checked={contentType === 'paragraph'}
                            onChange={({ target }) =>
                              setContentType(target.value)
                            }
                          />{' '}
                          Paragraph
                        </Label>
                      </FormGroup>
                      <FormGroup check inline>
                        <Label check>
                          <Input
                            type="radio"
                            name="outputtype"
                            value="ul"
                            checked={contentType === 'ul'}
                            onChange={({ target }) =>
                              setContentType(target.value)
                            }
                          />{' '}
                          Bullets
                        </Label>
                      </FormGroup>
                      <FormGroup check inline>
                        <Label check>
                          <Input
                            type="radio"
                            name="outputtype"
                            value="ol"
                            checked={contentType === 'ol'}
                            onChange={({ target }) =>
                              setContentType(target.value)
                            }
                          />{' '}
                          Numbered bullets
                        </Label>
                      </FormGroup>
                    </div>
                  </FormGroup>
                </>
              )}
              <FormGroup>
                <Label for="numsentences">
                  {componentType === 'search'
                    ? 'Product'
                    : contentType === 'paragraph'
                    ? 'Sentence'
                    : 'Bullet'}{' '}
                  Count
                </Label>
                <div className="input-group">
                  <Input
                    id="numsentences"
                    type="number"
                    value={numSentences}
                    min={1}
                    max={20}
                    onChange={({ target }) => setNumSentences(target.value)}
                  />
                </div>
              </FormGroup>
              {componentType === 'block' && (
                <>
                  <FormGroup>
                    <Label for="boosts">Boosted words (one per line)</Label>
                    <div className="input-group">
                      <Input
                        id="boosts"
                        type="textarea"
                        multiple={true}
                        rows={2}
                        placeholder="Boosted keyword 1"
                        value={boostedKeywords.join('\n')}
                        onChange={({ target }) =>
                          setBoostedKeywords(target.value.split('\n'))
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
                        placeholder="Suppressed keyword 1"
                        value={suppressedKeywords.join('\n')}
                        onChange={({ target }) =>
                          setSuppressedKeywords(target.value.split('\n'))
                        }
                      />
                    </div>
                  </FormGroup>
                  <FormGroup>
                    <Label for="engine">Engine</Label>
                    <div className="input-group">
                      <Input
                        id="engine"
                        type="text"
                        value={engine}
                        onChange={({ target }) => setEngine(target.value)}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup>
                    <Label for="temperature">Temperature</Label>
                    <div className="input-group">
                      <Input
                        id="temperature"
                        type="number"
                        value={temperature}
                        min={0.0}
                        max={1.0}
                        step={0.1}
                        onChange={({ target }) => setTemperature(target.value)}
                      />
                    </div>
                  </FormGroup>
                  <FormGroup>
                    <Label for="stops">Stops</Label>
                    <div className="input-group">
                      <Input
                        id="stops"
                        type="textarea"
                        multiple={true}
                        rows={2}
                        placeholder="Stop 1"
                        value={stops.join('\n')}
                        onChange={({ target }) =>
                          setStops(target.value.split('\n'))
                        }
                      />
                    </div>
                  </FormGroup>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
        <Col lg="6" className={classNames('pr-lg-2', { 'mb-3': false })}>
          <Card className="mb-3">
            <FalconCardHeader title="Preview" light={false} />
            {(!name || name.trim() === '') &&
              (!header || header.trim() === '') && (
                <>
                  <CardBody className="bg-light">
                    Enter settings to see a preview of this component&apos;s
                    appearance.
                  </CardBody>
                </>
              )}
            {((name && name.trim() !== '') ||
              (header && header.trim() !== '')) && (
              <>
                <CardBody className="bg-light">
                  <Row className="text-left">
                    <Col>
                      <h5 id="modalLabel">{header}</h5>
                    </Col>
                    <Col xs="auto">
                      <p className="fs--1 text-600">{name}</p>
                    </Col>
                  </Row>
                  {componentType === 'search'
                    ? getProductList(sampleData) || getLorem()
                    : (
                        <div dangerouslySetInnerHTML={{ __html: sampleText }} />
                      ) || getLorem()}
                </CardBody>
                <CardFooter tag={Flex} justify="center" className="bg-light">
                  <Form
                    className="mr-3"
                    onSubmit={
                      componentType === 'search' ? handleSearch : handleSample
                    }
                  >
                    <InputGroup size="sm">
                      <Input
                        placeholder="How to ride a bike"
                        value={sampleTopic}
                        onChange={({ target }) => setSampleTopic(target.value)}
                      />
                      <InputGroupAddon addonType="append">
                        <Button
                          color="primary"
                          size="sm"
                          className="border-300"
                          type="submit"
                          disabled={working}
                        >
                          {working ? 'Generating...' : 'Generate Sample'}
                        </Button>
                      </InputGroupAddon>
                    </InputGroup>
                  </Form>
                </CardFooter>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default EditComponent;
