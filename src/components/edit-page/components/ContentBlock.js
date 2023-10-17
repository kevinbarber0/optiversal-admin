import { Constants } from '@util/global';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Spinner } from 'reactstrap';
import { ProductList } from '.';
import ContentBlockTools from '@components/edit-page/components/ContentBlockTools';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

const ContentBlockEditor = dynamic(
  () => import('@components/ContentBlockEditor'),
  {
    ssr: false,
  },
);

const ContentBlock = ({
  draggableId,
  page,
  title,
  pageLang,
  componentsResult,
  content,
  onCompose,
  onUpdateContentData,
  onSettingsChange,
  onRemove,
  doSearch,
  doUpdatePage,
  fetchCompletion,
  addContentBlockToNextRow,
  activeComponent,
  setActiveComponent,
  ...props
}) => {
  const handleContentChange = useCallback((contentBlockId, content, drafts) => {
    onUpdateContentData(contentBlockId, {
      content,
      drafts,
    });
  }, []);

  const handleExpandSections = async (sections, componentId) => {
    if (!title || title.trim() === '') {
      toast.error('You must enter a title before content can be authored');
      return;
    }
    if (!sections || sections.length === 0) {
      toast.error('You must enter one or more sections to expand on');
      return;
    }

    const blockComponent = componentsResult.components.find(
      (c) => c.componentId === componentId,
    );

    if (blockComponent) {
      let lastContentBlockId = content.contentBlockId;
      let previousHeader = null;
      let previousContent = null;
      for (let i = 0; i < sections.length; i++) {
        //fetch content
        const contentBlockId = uuidv4();
        const contentBlock = {
          contentBlockId: contentBlockId,
          component: blockComponent,
          settings: {},
          lastUpdated: new Date(),
          isComposing: true,
        };
        addContentBlockToNextRow(lastContentBlockId, contentBlock);
        lastContentBlockId = contentBlock.contentBlockId;

        const completion = await fetchCompletion({
          contentBlockId,
          component: blockComponent,
          header: sections[i],
          content: null,
          sectionContext: {
            previousHeader: previousHeader,
            previousContent: previousContent,
            section: i + 1,
            sectionCount: sections.length,
          },
        });
        if (completion) {
          contentBlock.content = {
            text: completion.composition,
            html: completion.composition,
          };
          contentBlock.data = completion.data;
          contentBlock.header = sections[i];
          previousHeader = sections[i];
          previousContent = completion.composition;

          onUpdateContentData(contentBlock.contentBlockId, {
            content: contentBlock.content,
            data: contentBlock.data,
            header: contentBlock.header,
            isComposing: false,
          });
        } else {
        }
      }
    }
  };

  return (
    <Draggable draggableId={draggableId} {...props}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="content-block m-2"
        >
          <ContentBlockTools
            hasFocus={true}
            isActive={activeComponent === content.contentBlockId}
            contentBlock={content}
            onRemove={() => onRemove(content.contentBlockId)}
            onSettings={() => setActiveComponent(content.contentBlockId)}
            dragHandleProps={provided.dragHandleProps}
          />
          {content.isComposing ? (
            <>
              <Spinner size="sm" color="primary" /> Authoring{' '}
              {content.component.name}...
              <br />
            </>
          ) : content.component.componentId ===
            Constants.ProductAssortmentComponentId ? (
            <ProductList
              page={page}
              title={title}
              content={content}
              doSearch={doSearch}
              onSettingsChange={onSettingsChange}
              onUpdateContentData={onUpdateContentData}
              doUpdatePage={doUpdatePage}
            />
          ) : (
            <ContentBlockEditor
              key={content.contentBlockId}
              id={content.contentBlockId}
              contentBlock={content}
              onCompose={onCompose}
              size="small"
              onContentChange={handleContentChange}
              onSettingsChange={onSettingsChange}
              onExpandSections={handleExpandSections}
              title={title}
              pageLang={pageLang}
            />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default ContentBlock;
