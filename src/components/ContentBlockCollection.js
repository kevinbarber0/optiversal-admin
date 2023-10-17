import React, { useState, useEffect } from 'react';
import {
  ButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from 'reactstrap';
import {
  getCompletion,
  useGetComponents,
  semanticSearchProducts,
  getPageDirect,
} from '@util/api.js';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Constants } from '@util/global';
import { v4 as uuidv4 } from 'uuid';
const ContentBlockEditor = dynamic(
  () => import('@components/ContentBlockEditor'),
  {
    ssr: false,
  },
);

const ContentBlockCollection = (props) => {
  const [title, setTitle] = useState(
    props.page ? props.page.title || props.title : props.title,
  );
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

  useEffect(() => {
    /*if (!props.page) {
      setTitle('');
      setContentBlocks(new Map());
      setContentBlockOrder([]);
    }*/
  }, [props.contentTemplateId]);

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
    preface,
  ) => {
    return await fetchCompletion(
      contentBlockId,
      componentId,
      header,
      content,
      preface,
    );
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

  return (
    <>
      {contentBlockOrder.map((contentBlockId, ix) => (
        <ContentBlockEditor
          key={contentBlockId}
          id={contentBlockId}
          contentBlock={contentBlocks.get(contentBlockId)}
          onCompose={handleCompose}
          index={ix}
          size="small"
          totalCount={contentBlockOrder.length}
          onContentChange={handleContentChange}
          onRemove={handleRemove}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onExpandSections={
            props.contentTemplateId ? null : handleExpandSections
          }
          onSettingsChange={handleSettingsChange}
          title={title}
        ></ContentBlockEditor>
      ))}
      {isComposing && activeComponent && (
        <>
          <Spinner size="sm" color="primary" /> Authoring {activeComponent.name}
          ...
          <br />
        </>
      )}
      {!props.contentTemplateId && (
        <>
          {status === 'success' &&
            componentsResult &&
            componentsResult.success && (
              <>
                <ButtonDropdown isOpen={dropdownOpen} toggle={toggle}>
                  <DropdownToggle color="primary" size="lg">
                    Add Content Block <FontAwesomeIcon icon="plus" />
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
        </>
      )}
    </>
  );
};

export default ContentBlockCollection;
