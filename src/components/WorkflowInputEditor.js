import React, { useState, useEffect, useCallback } from 'react';
import {
  EditorState,
  Modifier,
  convertFromRaw,
  convertFromHTML,
  ContentState,
  convertToRaw,
} from 'draft-js';
import Editor from '@components/common/Editor';
import {
  Card,
  CardBody,
  Button,
  InputGroup,
  InputGroupButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMagic } from '@fortawesome/free-solid-svg-icons';
import ReactTooltip from 'react-tooltip';
import Loader from '@components/common/Loader';
import draftToHtml from 'draftjs-to-html';
import { WorkflowType } from '@util/enum';
import AutoLink from '@components/AutoLink';

const WorkflowInputEditor = (props) => {
  const startingContent = {
    blocks: [
      {
        text: '',
        type: 'unstyled',
        entityRanges: [],
      },
    ],
    entityMap: {
      sentence: {
        type: 'TOKEN',
        mutability: 'MUTABLE',
      },
    },
  };
  const blocks = convertFromRaw(startingContent);
  const [editorState, setEditorState] = useState(
    EditorState.createWithContent(blocks, null),
  );

  const {
    workflowType,
    working,
    setWorking,
    content,
    contentType,
    onCompose,
    updateContent,
    isPopulated,
    setIsPopulated,
  } = props;

  const [versionsOpen, setVersionsOpen] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const toggleVersions = () => setVersionsOpen(!versionsOpen);

  useEffect(() => {
    if (content === '') {
      clearEditor();
    }
    if (content && !isPopulated) {
      drafts.length = 0;
      if (
        (content.text && content.text.trim() !== '') ||
        (content.html && content.html.trim() !== '')
      ) {
        let text = content.text || content.html;
        let html = content.html || content.text;

        drafts.push({
          isCurrent: true,
          version: 1,
          lastEdited: new Date(),
          text: text,
          html: html,
        });
        setDrafts(drafts);
        replaceAllContent(html || '');
      }
      //backward compatibility before text/html were split out
      else if (
        content &&
        !content.html &&
        !content.text &&
        content.trim() !== ''
      ) {
        drafts.push({
          isCurrent: true,
          version: 1,
          lastEdited: new Date(),
          text: content,
          html: content,
        });
        setDrafts(drafts);
        replaceAllContent(content || '');
      }

      setIsPopulated(true);
    }
  }, [content, isPopulated]);

  const insertAtEnd = useCallback(
    (text) => {
      const focusState = EditorState.moveFocusToEnd(editorState);
      setEditorState(focusState);
      const selection = focusState.getSelection();
      let { contentBlocks, entityMap } = convertFromHTML(text);
      let contentState = Modifier.replaceWithFragment(
        editorState.getCurrentContent(),
        selection,
        ContentState.createFromBlockArray(
          contentBlocks,
          entityMap,
        ).getBlockMap(),
      );

      let nextState = EditorState.push(
        editorState,
        contentState,
        'insert-fragment',
      );
      nextState = EditorState.moveFocusToEnd(nextState);
      setEditorState(nextState);
    },
    [editorState],
  );

  const replaceAllContent = (text) => {
    let nextState = EditorState.push(
      editorState,
      ContentState.createFromBlockArray(convertFromHTML(text)),
      'insert-fragment',
    );
    nextState = EditorState.moveFocusToEnd(nextState);
    setEditorState(nextState);
  };

  const clearEditor = () => {
    setEditorState(
      EditorState.push(
        editorState,
        ContentState.createFromText(''),
        'remove-range',
      ),
    );
  };

  const getCurrentContent = (e) => {
    const contentState = e
      ? e.getCurrentContent()
      : editorState.getCurrentContent();
    const content = {
      text: contentState.getPlainText().trim(),
      html: draftToHtml(convertToRaw(contentState)),
    };
    return content;
  };

  const composeSentence = async () => {
    if (working) {
      return;
    }
    setWorking(true);
    const settings = {};
    if (workflowType === WorkflowType.Product)
      settings.productCopyType = contentType;
    const completion = await onCompose(settings);
    if (completion && completion.composition) {
      insertAtEnd('<span> ' + completion.composition + '</span>');
    }
    setWorking(false);
  };

  const handleRewrite = async () => {
    if (working) {
      return;
    }
    //focusEditor();
    clearEditor();
    setWorking(true);
    const settings = {};
    if (workflowType === WorkflowType.Product)
      settings.productCopyType = contentType;
    const completion = await onCompose(settings);
    if (completion && completion.composition) {
      drafts.forEach((d) => {
        d.isCurrent = false;
      });
      drafts.push({
        isCurrent: true,
        version: drafts.length + 1,
        lastEdited: new Date(),
        text: completion.composition,
        html: completion.composition,
      });
      setDrafts(drafts);
      replaceAllContent(completion.composition);
    }
    setWorking(false);
  };

  const handleChange = (e) => {
    setEditorState(e);
    const currContent = getCurrentContent();
    //update current draft
    const currDraft = drafts.find((d) => d.isCurrent);
    if (currDraft) {
      currDraft.text = currContent.text;
      currDraft.html = currContent.html;
      currDraft.lastEdited = new Date();
      setDrafts(drafts);
    } else if (currContent.text && currContent.text.length > 0) {
      //no current draft found, add new
      drafts.push({
        isCurrent: true,
        version: 1,
        lastEdited: new Date(),
        text: currContent.text,
        html: currContent.html,
      });
      setDrafts(drafts);
    }
    if (workflowType === WorkflowType.Product)
      updateContent(contentType, currContent.html);
    else updateContent(currContent.html);
  };

  const handleSelectVersion = (versionNum) => {
    if (drafts) {
      for (let i = 0; i < drafts.length; i++) {
        if (drafts[i].version === versionNum) {
          drafts[i].isCurrent = true;
          replaceAllContent(drafts[i].html);
        } else {
          drafts[i].isCurrent = false;
        }
      }
      setDrafts(drafts);
    }
  };

  return (
    <Card className="noshadow mt-2">
      <CardBody>
        <div className="RichEditor-root">
          <div className="overlaycontainer">
            <div className="RichEditor-editor overlayunder">
              <Editor
                editorState={editorState}
                onEditorStateChange={handleChange}
                size={props.size}
                editorStyle={{ overflow: 'hidden' }}
                disableInsertMenu={true}
                disableLanguageMenu={true}
                toolbar={{
                  options: [
                    'inline',
                    'blockType',
                    'list',
                    'textAlign',
                    'link',
                    'history',
                  ],
                  inline: {
                    inDropdown: false,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ['bold', 'italic', 'underline'],
                  },
                  blockType: {
                    inDropdown: true,
                    options: [
                      'Normal',
                      'H1',
                      'H2',
                      'H3',
                      'H4',
                      'H5',
                      'H6',
                      'Blockquote',
                    ],
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                  },
                  list: {
                    inDropdown: true,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ['unordered', 'ordered'],
                  },
                  textAlign: {
                    inDropdown: true,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ['left', 'center', 'right'],
                  },
                  link: {
                    inDropdown: false,
                    className: undefined,
                    component: undefined,
                    popupClassName: undefined,
                    dropdownClassName: undefined,
                    showOpenOptionOnHover: true,
                    defaultTargetOption: '_self',
                    options: ['link', 'unlink'],
                    linkCallback: undefined,
                  },
                  history: {
                    inDropdown: false,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ['undo', 'redo'],
                  },
                }}
                toolbarCustomButtons={[
                  <>&nbsp; &nbsp; &nbsp;</>,
                  <div style={{ flex: 1 }} key="1">
                    <div style={{ float: 'right' }}>
                      <InputGroup>
                        <InputGroupButtonDropdown
                          addonType="append"
                          size="sm"
                          isOpen={versionsOpen}
                          toggle={toggleVersions}
                        >
                          <Button
                            className="ml-2"
                            color="secondary"
                            size="sm"
                            outline
                            disabled={working}
                            onClick={handleRewrite}
                          >
                            <>
                              <a data-tip data-for="rewrite">
                                <FontAwesomeIcon icon={faMagic} />
                                {props.size === 'small' ? (
                                  <></>
                                ) : (
                                  <> Auto-Write</>
                                )}
                              </a>
                              <ReactTooltip
                                id="rewrite"
                                className="tooltip"
                                type="info"
                                multiline={true}
                                effect="solid"
                              >
                                <span>Rewrite entire content block.</span>
                              </ReactTooltip>
                            </>
                          </Button>
                          {drafts && drafts.length > 1 && (
                            <>
                              <DropdownToggle split outline />
                              <DropdownMenu size="sm">
                                {drafts.map((d, i) => (
                                  <DropdownItem
                                    key={i}
                                    onClick={() => {
                                      handleSelectVersion(d.version);
                                    }}
                                  >
                                    Version{' '}
                                    {d.version +
                                      (d.isCurrent ? ' (current)' : '')}
                                  </DropdownItem>
                                ))}
                              </DropdownMenu>
                            </>
                          )}
                        </InputGroupButtonDropdown>
                      </InputGroup>
                    </div>

                    <div style={{ float: 'right' }}>
                      <Button
                        color="secondary"
                        size="sm"
                        outline
                        onClick={composeSentence}
                        disabled={working}
                      >
                        <>
                          <a data-tip data-for="append">
                            <FontAwesomeIcon icon={faPlus} />
                            {props.size === 'small' ? <></> : <> Sentence</>}
                          </a>
                          <ReactTooltip
                            id="append"
                            className="tooltip"
                            type="info"
                            multiline={true}
                            effect="solid"
                          >
                            <span>
                              Complete sentence or author a new sentence at the
                              end.
                              <br />
                              Hint: hit Tab while in the editor
                            </span>
                          </ReactTooltip>
                        </>
                      </Button>
                    </div>
                  </div>,
                ]}
              />
            </div>
            {working && (
              <div className="overlayover">
                <Loader></Loader>
              </div>
            )}
          </div>
          {workflowType === WorkflowType.File && (
            <>
              <hr />
              {getCurrentContent().text?.length > 0 && (
                <AutoLink
                  content={getCurrentContent()}
                  contentBlockId={0}
                  isComposing={working}
                  setIsComposing={setWorking}
                  handleCompose={onCompose}
                  getCurrentContent={getCurrentContent}
                  replaceAllContent={replaceAllContent}
                />
              )}
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default WorkflowInputEditor;
