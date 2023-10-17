import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Col,
  Row,
  Button,
  FormGroup,
  Label,
  Input,
  InputGroup,
  InputGroupButtonDropdown,
  ButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner,
  UncontrolledDropdown,
} from 'reactstrap';
import FalconCardHeader from '@components/common/FalconCardHeader';
import classNames from 'classnames';
import {
  getCompletion,
  useGetComponents,
  semanticSearchProducts,
  getTopicSuggestions,
  updatePage,
  useGetContentTemplate,
  getPageDirect,
} from '@util/api.js';
import Router from 'next/router';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagic, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { PageStatus } from '@util/enum';
import { Constants } from '@util/global';
import * as clipboard from 'clipboard-polyfill';
import { v4 as uuidv4 } from 'uuid';
const ContentBlockEditor = dynamic(
  () => import('@components/ContentBlockEditor'),
  {
    ssr: false,
  },
);
const PageTranslations = dynamic(() => import('@components/PageTranslations'), {
  ssr: false,
});

const ContentComposer = (props) => {
  const [title, setTitle] = useState(props.page ? props.page.title : null);
  const [contentBlocks, setContentBlocks] = useState(
    props.page
      ? new Map(props.page.content.map((c) => [c.contentBlockId, c])) ||
          new Map()
      : new Map(),
  );
  const [contentBlockOrder, setContentBlockOrder] = useState(
    props.page ? props.page.content?.map((ct) => ct.contentBlockId) || [] : [],
  );
  const [contentBlockStr, setContentBlockStr] = useState();
  const [relatedStr, setRelatedStr] = useState();
  const { status, data: componentsResult } = useGetComponents(0, 100);
  const [isComposing, setIsComposing] = useState(false);
  const [activeComponent, setActiveComponent] = useState();
  const [dropdownOpen, setOpen] = useState(false);
  const toggle = () => setOpen(!dropdownOpen);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [isTranslations, setIsTranslations] = useState(false);
  const { data: contentTemplateResult } = useGetContentTemplate(
    props.contentTemplateId,
  );

  useEffect(() => {
    if (!props.page) {
      setTitle('');
      setContentBlocks(new Map());
      setContentBlockOrder([]);
    }
  }, [props.contentTemplateId]);

  const savePage = async () => {
    const page = {
      pageId: props.page?.pageId,
      contentTemplateId: props.contentTemplateId,
      slug: props.page?.slug,
      title: title,
      content: contentBlockOrder.map((contentBlockId) =>
        contentBlocks.get(contentBlockId),
      ),
    };
    const res = await updatePage(page);
    if (res.success) {
      toast.success('Page saved!');
    } else {
      toast.error('There was a problem saving this page: ' + res.message);
    }
    return res;
  };

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    } else {
      Router.push('/pages');
    }
  };

  const handleSave = async () => {
    if (!title || title.trim() === '') {
      toast.error('You must enter a page title');
      return;
    }
    const res = await savePage();
    if (res.success && props.onSave) {
      props.onSave(res.slug);
    }
  };

  const handleSaveTemplate = async () => {
    //const res = await saveContent();
    //if (res.success && props.onSave) {
    //  props.onSave(res.slug);
    //}
  };

  const getAllHtml = () => {
    let content = '<h2>' + title + '</h2>';
    for (let i = 0; i < contentBlockOrder.length; i++) {
      if (
        contentBlocks.get(contentBlockOrder[i]) &&
        contentBlocks.get(contentBlockOrder[i]).content &&
        contentBlocks.get(contentBlockOrder[i]).content.html?.trim() !== ''
      ) {
        if (
          contentBlocks.get(contentBlockOrder[i]).header &&
          contentBlocks.get(contentBlockOrder[i]).header.trim().length > 0
        ) {
          content +=
            '<h4>' +
            contentBlocks.get(contentBlockOrder[i]).header.trim() +
            '</h4>';
        }
        content += contentBlocks.get(contentBlockOrder[i]).content.html.trim();
      }
    }
    return content;
  };

  const getAllText = () => {
    let content = title + '\n\n';
    for (let i = 0; i < contentBlockOrder.length; i++) {
      if (
        contentBlocks.get(contentBlockOrder[i]) &&
        contentBlocks.get(contentBlockOrder[i]).content &&
        contentBlocks.get(contentBlockOrder[i]).content.text?.trim() !== ''
      ) {
        if (
          contentBlocks.get(contentBlockOrder[i]).header &&
          contentBlocks.get(contentBlockOrder[i]).header.trim().length > 0
        ) {
          content +=
            '\n\n' +
            contentBlocks.get(contentBlockOrder[i]).header.trim() +
            '\n\n';
        }
        content += contentBlocks.get(contentBlockOrder[i]).content.text.trim();
      }
    }
    return content;
  };

  const getPreface = (contentBlockId) => {
    let preface = '';
    for (let i = 0; i < contentBlockOrder.length; i++) {
      if (contentBlockOrder[i] === contentBlockId) {
        break;
      }
      if (
        contentBlocks.get(contentBlockOrder[i]) &&
        contentBlocks.get(contentBlockOrder[i]).content &&
        contentBlocks.get(contentBlockOrder[i]).content.text?.trim() !== ''
      ) {
        preface +=
          contentBlocks.get(contentBlockOrder[i]).content.text + '\n\n';
      }
    }
    return preface;
  };

  const fetchCompletion = async (
    contentBlockId,
    componentId,
    header,
    content,
    preface,
  ) => {
    if (
      componentId === Constants.BlankComponentId ||
      ((componentId === Constants.TopicParagraphComponentId ||
        componentId === Constants.TopicKeyPointsComponentId) &&
        (!header || header.trim().length === 0))
    ) {
      return { composition: '[BLANK]' };
    }
    let p = preface || getPreface(contentBlockId);
    const settings = {
      topic: title,
      componentId: componentId,
      header: header ? header.trim() + '\n' : null,
      preface: p,
      content: content,
    };
    const res = await getCompletion(settings);
    if (res.success) {
      return res;
    } else {
      toast.error('Unable to compose: ' + res.message);
      return null;
    }
  };

  const handleMoveUp = async (contentBlockId) => {
    const currentIndex = contentBlockOrder.indexOf(contentBlockId);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      contentBlockOrder.splice(
        newIndex,
        0,
        contentBlockOrder.splice(currentIndex, 1)[0],
      );
      setContentBlockOrder(contentBlockOrder);
      setContentBlockStr(contentBlockOrder.join('|'));
    }
  };

  const handleMoveDown = async (contentBlockId) => {
    const currentIndex = contentBlockOrder.indexOf(contentBlockId);
    if (currentIndex >= 0 && currentIndex < contentBlockOrder.length - 1) {
      const newIndex = currentIndex + 1;
      contentBlockOrder.splice(
        newIndex,
        0,
        contentBlockOrder.splice(currentIndex, 1)[0],
      );
      setContentBlockOrder(contentBlockOrder);
      setContentBlockStr(contentBlockOrder.join('|'));
    }
  };

  const handleRemove = async (contentBlockId) => {
    const ix = contentBlockOrder.indexOf(contentBlockId);
    if (ix >= 0) {
      contentBlockOrder.splice(ix, 1);
      setContentBlockOrder(contentBlockOrder);
      setContentBlockStr(contentBlockOrder.join('|'));
    }
  };

  const handleCompose = async (
    contentBlockId,
    componentId,
    header,
    content,
  ) => {
    return await fetchCompletion(contentBlockId, componentId, header, content);
  };

  //related product list change
  const handleSettingsChange = async (contentBlockId, settings) => {
    const cb = contentBlocks.get(contentBlockId);
    if (cb) {
      //refresh search results
      if (
        settings.searchType === 'query' &&
        settings.searchQuery &&
        settings.searchQuery.trim().length > 0
      ) {
        const searchSettings = {
          topic: settings.searchQuery,
          componentId: Constants.RelatedProductsListComponentId,
        };
        const searchRes = await semanticSearchProducts(searchSettings);
        if (searchRes.success) {
          cb.data = searchRes.products;
          cb.header = searchRes.header;
          setRelatedStr(cb.data.join('|'));
        }
      } else if (settings.searchType === 'assortment' && settings.assortment) {
        //get page results by assortment ID
        const slug = settings.assortment.value;
        const pageRes = await getPageDirect(slug);
        if (pageRes && pageRes.success && pageRes.page) {
          cb.data = pageRes.page.results.slice(0, 5);
          setRelatedStr(cb.data.join('|'));
        }
      }

      cb.settings = settings;
      setContentBlocks(contentBlocks.set(contentBlockId, cb));
    }
  };

  const handleContentChange = (contentBlockId, content, drafts) => {
    const cb = contentBlocks.get(contentBlockId);
    if (cb) {
      cb.content = content;
      cb.drafts = drafts;
      setContentBlocks(contentBlocks.set(contentBlockId, cb));
    }
  };

  const handleAddContent = async (componentId, header) => {
    if (!title || title.trim() === '') {
      toast.error('You must enter a title before content can be authored');
      return;
    }
    const component = componentsResult.components.find(
      (c) => c.componentId === componentId,
    );
    if (component) {
      setActiveComponent(component);
      //show placeholder
      setIsComposing(true);
      //fetch content
      const contentBlockId = uuidv4();
      const contentBlock = {
        contentBlockId: contentBlockId,
        component: component,
        lastUpdated: new Date(),
      };
      if (component.settings.componentType === 'search') {
        const settings = {
          topic: title,
          componentId: componentId,
        };
        const searchRes = await semanticSearchProducts(settings);
        if (searchRes.success) {
          contentBlock.data = searchRes.products;
          contentBlock.header = searchRes.header;
          contentBlockOrder.push(contentBlockId);
          setContentBlockOrder(contentBlockOrder);
          setContentBlocks(contentBlocks.set(contentBlockId, contentBlock));
        } else {
          setActiveComponent(null);
        }
      } else {
        const completion = await fetchCompletion(
          contentBlockId,
          componentId,
          header,
        );
        if (completion) {
          contentBlock.content = {
            text: completion.composition,
            html: completion.composition,
          };
          contentBlock.data = completion.data;
          if (header) {
            contentBlock.header = header;
            return contentBlock;
          } else {
            contentBlock.header = component.settings.header;
          }
          const addedBlockIds = [contentBlockId];
          const addedBlocks = [contentBlock];

          if (component.name === 'Automatic Topic Paragraphs') {
            //auto expand one Topic Paragraph component for each bullet
            const blockComponent = componentsResult.components.find(
              (c) => c.name === 'Topic Paragraph',
            );
            if (blockComponent) {
              const bulletRegex = /<li>(?<bullet>.+?)<\/li>/g;
              const bulletMatches = completion.composition.match(bulletRegex);
              for (let i = 0; i < bulletMatches.length; i++) {
                const bullet = bulletMatches[i]
                  .replace('<li>', '')
                  .replace('</li>', '');
                const subBlock = await handleAddContent(
                  blockComponent.componentId,
                  bullet,
                );
                addedBlockIds.push(subBlock.contentBlockId);
                addedBlocks.push(subBlock);
              }
            }
          } else if (component.name === 'Automatic Topic Key Points') {
            //auto expand one Topic Paragraph component for each bullet
            const blockComponent = componentsResult.components.find(
              (c) => c.name === 'Topic Key Points',
            );
            if (blockComponent) {
              const bulletRegex = /<li>(?<bullet>.+?)<\/li>/g;
              const bulletMatches = completion.composition.match(bulletRegex);
              for (let i = 0; i < bulletMatches.length; i++) {
                const bullet = bulletMatches[i]
                  .replace('<li>', '')
                  .replace('</li>', '');
                const subBlock = await handleAddContent(
                  blockComponent.componentId,
                  bullet,
                );
                addedBlockIds.push(subBlock.contentBlockId);
                addedBlocks.push(subBlock);
              }
            }
          }

          addedBlockIds.forEach((blockId) => contentBlockOrder.push(blockId));
          setContentBlockOrder(contentBlockOrder);
          addedBlocks.forEach((block) =>
            contentBlocks.set(block.contentBlockId, block),
          );
          setContentBlocks(contentBlocks);
          setContentBlockStr(contentBlockOrder.join('|'));
        } else {
          setActiveComponent(null);
        }
      }
      setIsComposing(false);
    }
  };

  const handleExpandSections = async (sections, componentId) => {
    if (!title || title.trim() === '') {
      toast.error('You must enter a title before content can be authored');
      return;
    }
    if (!sections || sections.length === 0) {
      toast.error('You must enter one or more sections to expand on');
      return;
    }

    //show placeholder
    setIsComposing(true);

    const blockComponent = componentsResult.components.find(
      (c) => c.componentId === componentId,
    );
    if (blockComponent) {
      for (let i = 0; i < sections.length; i++) {
        //fetch content
        const contentBlockId = uuidv4();
        const contentBlock = {
          contentBlockId: contentBlockId,
          component: blockComponent,
          lastUpdated: new Date(),
        };

        const completion = await fetchCompletion(
          contentBlockId,
          blockComponent.componentId,
          sections[i],
        );
        if (completion) {
          contentBlock.content = {
            text: completion.composition,
            html: completion.composition,
          };
          contentBlock.data = completion.data;
          contentBlock.header = sections[i];

          contentBlockOrder.push(contentBlockId);
          setContentBlockOrder(contentBlockOrder);
          contentBlocks.set(contentBlockId, contentBlock);
          setContentBlocks(contentBlocks);
          setContentBlockStr(contentBlockOrder.join('|'));
        } else {
          setActiveComponent(null);
        }
      }
    }

    setIsComposing(false);
  };

  const toggleSuggestions = async () => {
    setIsFetchingSuggestions(true);
    if (!suggestionsOpen) {
      const suggRes = await getTopicSuggestions(props.contentTemplateId, title);
      if (suggRes.success) {
        setTopicSuggestions(suggRes.topics);
        setSuggestionsOpen(true);
      } else {
        toast.error('Unable to suggest topics: ' + suggRes.message);
      }
    } else {
      setSuggestionsOpen(false);
    }
    setIsFetchingSuggestions(false);
  };

  const handleComposeArticle = async () => {
    if (!title || title.trim().length === 0) {
      toast.error('You must enter a title for the article before composing');
      return;
    }
    if (
      props.contentTemplateId &&
      (!contentTemplateResult || !contentTemplateResult.contentTemplate)
    ) {
      toast.error('Invalid content template selected');
      return;
    }

    setContentBlocks(new Map());
    setContentBlockOrder([]);
    //add content blocks to page iteratively
    for (
      let i = 0;
      i < contentTemplateResult.contentTemplate.content.length;
      i++
    ) {
      const cb = contentTemplateResult.contentTemplate.content[i];
      await handleAddContent(cb.component.componentId);
    }
  };

  const handleCopy = async () => {
    const item = new clipboard.ClipboardItem({
      'text/html': new Blob([getAllHtml()], { type: 'text/html' }),
      'text/plain': new Blob([getAllText()], { type: 'text/plain' }),
    });
    await clipboard.write([item]);
    toast.success('Article copied to clipboard!');
  };

  return (
    <>
      <Row noGutters>
        <Col lg="9" className={classNames('pr-lg-2', { 'mb-3': false })}>
          <Card className="mb-3">
            <FalconCardHeader
              title={
                isTranslations
                  ? 'Article Translations'
                  : contentTemplateResult &&
                    contentTemplateResult.contentTemplate
                  ? (props.page ? 'Edit ' : 'Create ') +
                    contentTemplateResult.contentTemplate.name
                  : 'Create Page'
              }
              light={true}
            >
              <div className="d-flex">
                {isTranslations && (
                  <>
                    <Button
                      color="falcon-secondary"
                      size="sm"
                      className="mr-2"
                      onClick={() => setIsTranslations(false)}
                    >
                      Back to Composer
                    </Button>
                  </>
                )}
                {!isTranslations && (
                  <>
                    <Button
                      color="falcon-secondary"
                      size="sm"
                      className="mr-2"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="falcon-default"
                      size="sm"
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                    &nbsp; &nbsp;
                    {props.page && props.page.status === PageStatus.DRAFT && (
                      <Button
                        color="falcon-primary"
                        size="sm"
                        onClick={props.onPublish}
                      >
                        Publish
                      </Button>
                    )}
                    {props.page && props.page.status === PageStatus.PUBLISHED && (
                      <Button
                        color="falcon-primary"
                        size="sm"
                        onClick={props.onUnpublish}
                      >
                        Unpublish
                      </Button>
                    )}
                    {props.page && (
                      <UncontrolledDropdown className="text-sans-serif btn-reveal-trigger">
                        <DropdownToggle
                          color="link"
                          size="sm"
                          className="btn-reveal text-600"
                        >
                          <FontAwesomeIcon
                            icon="ellipsis-h"
                            className="fs--2"
                          />
                        </DropdownToggle>
                        <DropdownMenu right className="border py-0">
                          <div className="bg-white py-2">
                            <DropdownItem
                              onClick={() => setIsTranslations(true)}
                            >
                              Translations
                            </DropdownItem>
                            <DropdownItem onClick={handleCopy}>
                              Copy to Clipboard
                            </DropdownItem>
                          </div>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    )}
                  </>
                )}
              </div>
            </FalconCardHeader>
            <CardBody>
              {isTranslations && (
                <>
                  <PageTranslations
                    page={props.page}
                    getContent={getAllHtml}
                  ></PageTranslations>
                </>
              )}
              {!isTranslations && (
                <>
                  <FormGroup>
                    <Label for="composetitle">Title</Label>
                    <InputGroup>
                      <Input
                        id="composetitle"
                        placeholder="Page Title"
                        value={title}
                        onChange={({ target }) => setTitle(target.value)}
                      />
                      {!props.page && (
                        <>
                          {props.contentTemplateId &&
                            props.contentTemplateId.trim().length > 0 && (
                              <InputGroupButtonDropdown
                                addonType="append"
                                isOpen={suggestionsOpen}
                                toggle={toggleSuggestions}
                                disabled={isFetchingSuggestions}
                              >
                                <DropdownToggle caret>
                                  <FontAwesomeIcon icon={faMagic} />{' '}
                                  {isFetchingSuggestions
                                    ? 'Thinking...'
                                    : 'Get Suggestions'}
                                </DropdownToggle>
                                <DropdownMenu>
                                  {topicSuggestions.map((topic) => (
                                    <DropdownItem
                                      key={topic}
                                      onClick={() => setTitle(topic.trim())}
                                    >
                                      {topic.trim()}
                                    </DropdownItem>
                                  ))}
                                </DropdownMenu>
                              </InputGroupButtonDropdown>
                            )}
                          {props.contentTemplateId &&
                            props.contentTemplateId.trim().length > 0 && (
                              <>
                                {' '}
                                &nbsp;
                                <Button
                                  color="primary"
                                  onClick={handleComposeArticle}
                                >
                                  Compose Article
                                </Button>
                              </>
                            )}
                        </>
                      )}
                    </InputGroup>
                  </FormGroup>
                  {/*<FormGroup>
                <Label for="template">Template</Label>
                <div className="input-group">
                  <Input type="select" name="template" id="template" onChange={({ target }) => setTemplate(target.value)}>
                    <option value="">New/No Template</option>
                    <option>Template 1</option>
                  </Input>
                </div>
              </FormGroup>*/}
                  {title && title.trim().length > 0 && (
                    <>
                      <hr />
                      <h1
                        className="fs-3"
                        style={{
                          paddingLeft: 15,
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {title}
                      </h1>
                      {contentBlockOrder.map((contentBlockId, ix) => (
                        <ContentBlockEditor
                          key={contentBlockId}
                          id={contentBlockId}
                          contentBlock={contentBlocks.get(contentBlockId)}
                          onCompose={handleCompose}
                          index={ix}
                          totalCount={contentBlockOrder.length}
                          onContentChange={handleContentChange}
                          onRemove={handleRemove}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          onExpandSections={
                            props.contentTemplateId
                              ? null
                              : handleExpandSections
                          }
                          onSettingsChange={handleSettingsChange}
                          title={title}
                        ></ContentBlockEditor>
                      ))}
                      {isComposing && activeComponent && (
                        <>
                          <Spinner size="sm" color="primary" /> Authoring{' '}
                          {activeComponent.name}...
                        </>
                      )}
                      {!props.contentTemplateId && (
                        <center>
                          {status === 'success' &&
                            componentsResult &&
                            componentsResult.success && (
                              <>
                                <ButtonDropdown
                                  isOpen={dropdownOpen}
                                  toggle={toggle}
                                >
                                  <DropdownToggle color="primary" size="lg">
                                    Add Content Block{' '}
                                    <FontAwesomeIcon icon="plus" />
                                  </DropdownToggle>
                                  <DropdownMenu>
                                    {componentsResult.components.map((comp) => (
                                      <DropdownItem
                                        key={comp.componentId}
                                        value={comp.componentId}
                                        onClick={(e) => {
                                          handleAddContent(e.target.value);
                                        }}
                                      >
                                        {comp.name}
                                      </DropdownItem>
                                    ))}
                                  </DropdownMenu>
                                </ButtonDropdown>
                              </>
                            )}
                        </center>
                      )}
                    </>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ContentComposer;
