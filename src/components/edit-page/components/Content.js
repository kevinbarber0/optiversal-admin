import { Fragment } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Card, CardBody } from 'reactstrap';
import { DropZone, ContentBlock } from '.';

function Content({
  page,
  title,
  pageLang,
  componentsResult,
  contentBlocks,
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
  insertComponent,
}) {
  return (
    <Card>
      <CardBody>
        <Droppable droppableId="CONTENT_BLOCK" isDropDisabled>
          {(provided) => (
            <div
              className="row"
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
            >
              <div className="col col-12">
                <DropZone
                  key="DROPPABLE_TOP"
                  droppableId="DROPPABLE_TOP"
                  components={componentsResult?.components}
                  insertComponent={insertComponent}
                />
              </div>
              {contentBlocks.map((contentBlock, index) => (
                <Fragment key={index}>
                  <div className="col col-12">
                    <div className="d-flex -mx-2">
                      {contentBlock[0] && (
                        <ContentBlock
                          key={contentBlock[0].contentBlockId}
                          page={page}
                          title={title}
                          pageLang={pageLang}
                          componentsResult={componentsResult}
                          content={contentBlock[0]}
                          draggableId={contentBlock[0].contentBlockId}
                          index={index * 2}
                          onCompose={onCompose}
                          onUpdateContentData={onUpdateContentData}
                          onSettingsChange={onSettingsChange}
                          onRemove={onRemove}
                          doSearch={doSearch}
                          doUpdatePage={doUpdatePage}
                          fetchCompletion={fetchCompletion}
                          addContentBlockToNextRow={addContentBlockToNextRow}
                          activeComponent={activeComponent}
                          setActiveComponent={setActiveComponent}
                        />
                      )}
                      {contentBlock[1] ? (
                        <ContentBlock
                          key={contentBlock[1].contentBlockId}
                          page={page}
                          title={title}
                          pageLang={pageLang}
                          componentsResult={componentsResult}
                          content={contentBlock[1]}
                          draggableId={contentBlock[1].contentBlockId}
                          index={index * 2 + 1}
                          onCompose={onCompose}
                          onUpdateContentData={onUpdateContentData}
                          onSettingsChange={onSettingsChange}
                          onRemove={onRemove}
                          doSearch={doSearch}
                          doUpdatePage={doUpdatePage}
                          fetchCompletion={fetchCompletion}
                          addContentBlockToNextRow={addContentBlockToNextRow}
                          activeComponent={activeComponent}
                          setActiveComponent={setActiveComponent}
                        />
                      ) : (
                        <div className="m-2">
                          <DropZone
                            key={`DROPPABLE_LEFT_${index}`}
                            droppableId={`DROPPABLE_LEFT_${index}`}
                            direction="vertical"
                            components={componentsResult?.components}
                            insertComponent={insertComponent}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col col-12">
                    <DropZone
                      key={`DROPPABLE_BOTTOM_${index}`}
                      droppableId={`DROPPABLE_BOTTOM_${index}`}
                      components={componentsResult?.components}
                      insertComponent={insertComponent}
                    />
                  </div>
                </Fragment>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardBody>
    </Card>
  );
}

export default Content;
