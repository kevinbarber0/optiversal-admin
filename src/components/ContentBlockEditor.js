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
import EditorCustomToolbarOption from '@components/common/EditorCustomToolbarOption';
import {
  Input,
  Card,
  CardBody,
  Row,
  Col,
  Button,
  InputGroup,
  InputGroupButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrashAlt,
  faParagraph,
  faMagic,
  faListOl,
} from '@fortawesome/free-solid-svg-icons';
import ReactTooltip from 'react-tooltip';
import Loader from '@components/common/Loader';
import ContentSection from '@components/ContentSection';
import htmlToDraft from 'html-to-draftjs';
import draftToHtml from 'draftjs-to-html';
import { inspect } from 'util';
import { Constants } from '@util/global';
import { toast } from 'react-toastify';
import { getTranslatedContent } from '@util/api';
import { Placeholder } from '@util/enum';
import { useEditPageContext } from '@context/EditPageContext';
import AutoLink from '@components/AutoLink';
import RelatedProductsList from '@components/edit-page/components/RelatedProductList';

const ContentBlockEditor = (props) => {
  const { location, locationPages } = useEditPageContext();
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
  const { title } = props;
  const [header, setHeader] = useState(props.contentBlock?.header || null);
  const [editorRef, setEditorRef] = useState();
  const blocks = convertFromRaw(startingContent);
  const [editorState, setEditorState] = useState(
    EditorState.createWithContent(blocks, null),
  );

  const [hasFocus, setHasFocus] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [prepopulated, setPrepopulated] = useState(false);
  const [dataStr, setDataStr] = useState();
  const [isExpanded, setIsExpanded] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [language, setLanguage] = useState('en');
  const toggleVersions = () => setVersionsOpen(!versionsOpen);

  const focusEditor = useCallback(() => {
    if (editorRef && editorRef.current) {
      editorRef.current.focus();
    }
    setHasFocus(true);
  }, [editorRef]);

  const blurEditor = useCallback(() => {
    if (editorRef && editorRef.current) {
      editorRef.current.blur();
    }
    setHasFocus(false);
  }, [editorRef]);

  const insertAtEnd = useCallback(
    (text, noFocus) => {
      const focusState = EditorState.moveFocusToEnd(editorState);
      setEditorState(focusState);
      const selection = focusState.getSelection();
      let { contentBlocks, entityMap } = htmlToDraft(text);
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
      if (!noFocus) {
        focusEditor();
      } else {
        blurEditor();
      }
    },
    [blurEditor, editorState, focusEditor],
  );

  const replaceAllContent = (text, noFocus) => {
    let nextState = EditorState.push(
      editorState,
      ContentState.createFromBlockArray(htmlToDraft(text)),
      'insert-fragment',
    );
    nextState = EditorState.moveFocusToEnd(nextState);
    setEditorState(nextState);
    if (!noFocus) {
      focusEditor();
    } else {
      blurEditor();
    }
  };

  useEffect(() => {
    if (!props.contentBlock && !prepopulated) return;

    if (props.pageLang !== language) {
      handleLang(props.pageLang);
    }
  }, [props.contentBlock, props.pageLang, prepopulated]);

  useEffect(() => {
    if (props.contentBlock && props.contentBlock.content && !prepopulated) {
      if (
        props.contentBlock.content.hasOwnProperty('text') ||
        props.contentBlock.content.hasOwnProperty('html')
      ) {
        if (
          (props.contentBlock.content.text &&
            props.contentBlock.content.text.trim() !== '') ||
          (props.contentBlock.content.html &&
            props.contentBlock.content.html.trim() !== '')
        ) {
          let text =
            props.contentBlock.content.text || props.contentBlock.content.html;
          let html =
            props.contentBlock.content.html || props.contentBlock.content.text;
          if (props.contentBlock.drafts) {
            setDrafts(props.contentBlock.drafts);
          } else if (text !== '[BLANK]') {
            //no current draft found, add new
            drafts.push({
              isCurrent: true,
              version: 1,
              lastEdited: new Date(),
              text: text,
              html: html,
            });
            setDrafts(drafts);
          }

          const contentBlocks = convertFromHTML(html);
          const initContent = ContentState.createFromBlockArray(contentBlocks);

          setEditorState(
            EditorState.push(editorState, initContent, 'insert-characters'),
          );
        }
        setPrepopulated(true);
      }
      //backward compatibility before text/html were split out
      else if (
        !props.contentBlock.content.hasOwnProperty('text') &&
        !props.contentBlock.content.hasOwnProperty('html')
      ) {
        if (props.contentBlock.content.trim() !== '') {
          if (props.contentBlock.drafts) {
            setDrafts(props.contentBlock.drafts);
          } else if (props.contentBlock.content !== '[BLANK]') {
            //no current draft found, add new
            drafts.push({
              isCurrent: true,
              version: 1,
              lastEdited: new Date(),
              text: props.contentBlock.content,
              html: props.contentBlock.content,
            });
            setDrafts(drafts);
          }

          const contentBlocks = convertFromHTML(props.contentBlock.content);
          const initContent = ContentState.createFromBlockArray(contentBlocks);

          setEditorState(
            EditorState.push(editorState, initContent, 'insert-characters'),
          );
        }
        setPrepopulated(true);
      }
    }
  }, [props.contentBlock, prepopulated]);

  useEffect(() => {
    if (location && locationPages.length > 0) {
      clearEditor();

      const contentBlocks = locationPages.find(
        (page) => page.locationId === location.id,
      ).content;

      if (!contentBlocks) return;
      const { html, text } =
        contentBlocks[props.contentBlock.contentBlockId].content;

      if ((text && text.trim() !== '') || (html && html.trim() !== '')) {
        let locText = text || html;
        let locHtml = html || text;

        replaceAllContent(
          locText === '[BLANK]' ? '' : locHtml,
          locText !== '[BLANK]',
        );
      }
    }
  }, [location]);

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
    if (isComposing) {
      return;
    }
    setIsComposing(true);
    const completion = await props.onCompose({
      contentBlockId: props.contentBlock.contentBlockId,
      header: header,
      content: getCurrentContent().text,
    });
    if (completion && completion.composition) {
      insertAtEnd('<span>' + completion.composition + '</span>');
    }
    setIsComposing(false);
  };

  const handleRewrite = async () => {
    if (
      (props.contentBlock.component.componentId ===
        Constants.TopicParagraphComponentId ||
        props.contentBlock.component.componentId ===
          Constants.TopicKeyPointsComponentId ||
        props.contentBlock.component.componentId ===
          Constants.TopicHtmlComponentId) &&
      (!header || header.trim().length === 0)
    ) {
      toast.error('You must enter a topic heading to author a paragraph');
      return;
    }
    if (isComposing) {
      return;
    }
    //focusEditor();
    clearEditor();
    setIsComposing(true);
    const completion = await props.onCompose({
      contentBlockId: props.contentBlock.contentBlockId,
      header: header,
      component: props.contentBlock.component,
    });
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
        lang: 'en',
        translations: {
          en: {
            html: completion.composition,
            text: completion.composition,
          },
        },
      });
      setDrafts(drafts);
      replaceAllContent(completion.composition);
      setLanguage('en');
      if (completion.data) {
        props.contentBlock.data = completion.data;
        setDataStr(props.contentBlock.data.join('|'));
      }
    }
    setIsComposing(false);
  };

  const handleLang = async (lang) => {
    if (isComposing) return;

    const currContent = getCurrentContent();
    if (!drafts) {
      drafts.push({
        isCurrent: true,
        version: 1,
        lastEdited: new Date(),
        text: currContent.text,
        html: currContent.html,
        lang: 'en',
        translations: {
          en: {
            html: currContent.html,
            text: currContent.text,
          },
        },
      });
      setDrafts(drafts);
    }

    const updatedDrafts = await drafts.map((d) => {
      if (d.isCurrent) {
        d.translations = {
          en: {
            html: d.html,
            text: d.text,
          },
          ...d.translations,
        };
        d.lastEdited = new Date();
      }
      return d;
    });
    setDrafts(updatedDrafts);

    const currDraft = await drafts.find((d) => d.isCurrent);

    if (!currDraft) return;

    if (
      currDraft.hasOwnProperty('translations') &&
      currDraft.translations[lang]
    ) {
      currDraft.text = currDraft.translations[lang].text;
      currDraft.html = currDraft.translations[lang].html;
      currDraft.lang = lang;
      currDraft.translations[language].html = currContent.html;
      currDraft.translations[language].text = currContent.text;

      currDraft.lastEdited = new Date();
      setDrafts(drafts);
      replaceAllContent(currDraft.translations[lang].html);
      setLanguage(lang);
    } else {
      setIsComposing(true);

      const res = await getTranslatedContent(lang, currContent.text);

      if (res.success) {
        currDraft.text = res.translation;
        currDraft.html = res.translation;
        currDraft.lang = lang;
        currDraft.translations[language].html = currContent.html;
        currDraft.translations[language].text = currContent.text;
        currDraft.translations[lang] = {
          html: res.translation,
          text: res.translation,
        };

        currDraft.lastEdited = new Date();
        setDrafts(drafts);

        replaceAllContent(res.translation);
        setLanguage(lang);
      } else {
        toast.error('Unable to translate at this time: ' + res.message);
      }
      setIsComposing(false);
    }
  };

  const handleAnswerQuestions = async () => {
    if (!title || title.trim().length === 0) {
      toast.error('You must enter a page title to author FAQ answers');
      return;
    }
    if (isComposing) {
      return;
    }
    setIsComposing(true);
    for (let i = 0; i < props.contentBlock.data.length; i++) {
      const question = props.contentBlock.data[i];
      const res = await handleAnswerQuestion(i, question);
      if (!res) {
        break;
      }
    }
    setIsComposing(false);
  };

  const handleAnswerQuestion = async (ix, question) => {
    if (!question || question.trim().length === 0) {
      toast.error('You must enter a question to answer');
      return false;
    }
    const completion = await props.onCompose({
      contentBlockId: props.contentBlock.contentBlockId,
      header: question,
      component: { componentId: Constants.FaqAnswerComponentId },
    });
    if (completion && completion.composition) {
      props.contentBlock.data[ix] =
        '<strong>' +
        props.contentBlock.data[ix] +
        '</strong> ' +
        completion.composition;
      setDataStr(props.contentBlock.data.join('|'));
    }
    return true;
  };

  const handleDefineTerms = async () => {
    if (!title || title.trim().length === 0) {
      toast.error('You must enter a page title to author term definitions');
      return;
    }
    if (isComposing) {
      return;
    }
    setIsComposing(true);
    for (let i = 0; i < props.contentBlock.data.length; i++) {
      const term = props.contentBlock.data[i];
      const res = await handleDefineTerm(i, term);
      if (!res) {
        break;
      }
    }
    setIsComposing(false);
  };

  const handleDefineTerm = async (ix, term) => {
    if (!term || term.trim().length === 0) {
      toast.error('You must enter a term to define');
      return false;
    }
    const completion = await props.onCompose({
      contentBlockId: props.contentBlock.contentBlockId,
      header: term,
      component: { componentId: Constants.GlossaryTermDefinitionComponentId },
    });
    if (completion && completion.composition) {
      props.contentBlock.data[ix] =
        '<strong>' +
        props.contentBlock.data[ix] +
        '</strong> ' +
        completion.composition;
      setDataStr(props.contentBlock.data.join('|'));
    }
    return true;
  };

  const handleBlur = (e) => {
    const content = inspect(e.relatedTarget);
    if (
      e.relatedTarget &&
      (e.relatedTarget.type === 'text' ||
        e.relatedTarget.type === 'svg' ||
        content.indexOf('svg') > 0)
    ) {
      return;
    }
    setHasFocus(false);
  };

  const handleTab = async (e) => {
    e.preventDefault();
    focusEditor();
    await composeSentence();
    focusEditor();
  };

  const handleChange = (e) => {
    setEditorState(e);
    if (props.onContentChange && props.contentBlock) {
      const currContent = getCurrentContent(e);
      if (
        !props.contentBlock.content ||
        currContent.html !== props.contentBlock.content.html
      ) {
        //update current draft
        const currDraft = drafts.find((d) => d.isCurrent);
        if (currDraft) {
          currDraft.text = currContent.text;
          currDraft.html = currContent.html;
          currDraft.lang = language;
          currDraft.lastEdited = new Date();
          currDraft.translations = {
            ...currDraft.translations,
            [language]: {
              html: currContent.html,
              text: currContent.text,
            },
          };
          setDrafts(drafts);
        } else if (currContent.text && currContent.text.length > 0) {
          //no current draft found, add new
          drafts.push({
            isCurrent: true,
            version: 1,
            lang: language,
            lastEdited: new Date(),
            text: currContent.text,
            html: currContent.html,
            translations: {
              en: {
                html: currContent.html,
                text: currContent.text,
              },
            },
          });
          setDrafts(drafts);
        }
        props.onContentChange(
          props.contentBlock.contentBlockId,
          currContent,
          drafts,
        );
      }
    }
  };

  const handleChangeHeader = (head) => {
    setHeader(head);
    props.contentBlock.header = head;
  };

  const handleChangeData = (index, content) => {
    props.contentBlock.data[index] = content === '[BLANK]' ? '' : content;
    setDataStr(props.contentBlock.data.join('|'));
  };

  const handleDeleteData = (index) => {
    props.contentBlock.data.splice(index, 1);
    setDataStr(props.contentBlock.data.join('|'));
  };

  const handleAddDataItem = () => {
    props.contentBlock.data.push('[BLANK]');
    setDataStr(props.contentBlock.data.join('|'));
  };

  const handleSelectVersion = (versionNum) => {
    if (drafts) {
      for (let i = 0; i < drafts.length; i++) {
        if (drafts[i].version === versionNum) {
          drafts[i].isCurrent = true;
          if (drafts[i]?.translations?.en?.html) {
            replaceAllContent(drafts[i].translations.en.html);
          } else replaceAllContent(drafts[i].html);
          setLanguage('en');
        } else {
          drafts[i].isCurrent = false;
        }
      }
      setDrafts(drafts);
    }
  };

  const insertPlaceholder = (type) => {
    let contentState;

    if (type === Placeholder.Title) {
      contentState = Modifier.replaceText(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        `{{${Placeholder.Title}}}`,
        editorState.getCurrentInlineStyle(),
      );
    } else if (type === Placeholder.City) {
      contentState = Modifier.replaceText(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        `{{${Placeholder.City}}}`,
        editorState.getCurrentInlineStyle(),
      );
    } else if (type === Placeholder.State) {
      contentState = Modifier.replaceText(
        editorState.getCurrentContent(),
        editorState.getSelection(),
        `{{${Placeholder.State}}}`,
        editorState.getCurrentInlineStyle(),
      );
    }

    setEditorState(
      EditorState.push(editorState, contentState, 'insert-characters'),
    );
  };

  return (
    <>
      <Card className={hasFocus ? '' : ' noshadow'}>
        <CardBody>
          <Row className="text-left">
            <Col>
              <h5 id="modalLabel" className="contentHeader">
                {hasFocus ? (
                  <Input
                    type="text"
                    placeholder="Heading"
                    value={header || props.contentBlock?.header}
                    onChange={({ target }) => handleChangeHeader(target.value)}
                    onFocus={() => {
                      setHasFocus(true);
                    }}
                    onBlur={() => {
                      setHasFocus(false);
                    }}
                  ></Input>
                ) : (
                  <>{header || props.contentBlock?.header}</>
                )}
              </h5>
            </Col>

            <Col xs="auto">
              <p className="fs--1 text-600">
                {props.onRemove && (
                  <FontAwesomeIcon
                    icon={faTrashAlt}
                    tabIndex="3"
                    focusable={true}
                    className="cursor-pointer"
                    onClick={() => {
                      props.onRemove(props.id);
                    }}
                  ></FontAwesomeIcon>
                )}
              </p>
            </Col>
          </Row>

          {props.contentBlock?.component?.settings?.hasExpansion &&
            props.contentBlock?.data && (
              <>
                <ol>
                  {props.contentBlock.data.map((item, ix) => (
                    <li key={ix}>
                      <ContentSection
                        index={ix}
                        copy={item}
                        setData={handleChangeData}
                        deleteData={handleDeleteData}
                      ></ContentSection>
                    </li>
                  ))}
                  <li>
                    <Button
                      size="sm"
                      color="primary"
                      outline
                      onClick={handleAddDataItem}
                    >
                      <FontAwesomeIcon
                        size="xs"
                        icon={faPlus}
                      ></FontAwesomeIcon>
                    </Button>
                  </li>
                </ol>
                {!isExpanded && props.onExpandSections && (
                  <>
                    <Button
                      onClick={() => {
                        props.onExpandSections(
                          props.contentBlock.data,
                          props.contentBlock.component.settings
                            ?.expansionComponentId,
                        );
                        setIsExpanded(true);
                      }}
                      color="primary"
                      disabled={isComposing}
                    >
                      <FontAwesomeIcon icon={faParagraph}></FontAwesomeIcon>{' '}
                      Author Section Content
                    </Button>{' '}
                    <Button onClick={handleRewrite} disabled={isComposing}>
                      <FontAwesomeIcon icon={faMagic}></FontAwesomeIcon> Rewrite
                    </Button>
                  </>
                )}
              </>
            )}

          {props.contentBlock?.component?.componentId ===
            Constants.FaqListComponentId &&
            props.contentBlock?.data && (
              <>
                <ol>
                  {props.contentBlock.data.map((item, ix) => (
                    <li key={ix}>
                      <ContentSection
                        index={ix}
                        copy={item}
                        setData={handleChangeData}
                        deleteData={handleDeleteData}
                      ></ContentSection>
                    </li>
                  ))}
                  <li>
                    <Button
                      size="sm"
                      color="primary"
                      outline
                      onClick={handleAddDataItem}
                    >
                      <FontAwesomeIcon
                        size="xs"
                        icon={faPlus}
                      ></FontAwesomeIcon>
                    </Button>
                  </li>
                </ol>
                {!isExpanded && (
                  <>
                    <Button
                      onClick={() => {
                        handleAnswerQuestions();
                        setIsExpanded(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faListOl}></FontAwesomeIcon> Author
                      Answers
                    </Button>{' '}
                  </>
                )}
              </>
            )}

          {props.contentBlock?.component?.componentId ===
            Constants.GlossaryTermComponentId &&
            props.contentBlock?.data && (
              <>
                <ol>
                  {props.contentBlock.data.map((item, ix) => (
                    <li key={ix}>
                      <ContentSection
                        index={ix}
                        copy={item}
                        setData={handleChangeData}
                        deleteData={handleDeleteData}
                      ></ContentSection>
                    </li>
                  ))}
                  <li>
                    <Button
                      size="sm"
                      color="primary"
                      outline
                      onClick={handleAddDataItem}
                    >
                      <FontAwesomeIcon
                        size="xs"
                        icon={faPlus}
                      ></FontAwesomeIcon>
                    </Button>
                  </li>
                </ol>
                {!isExpanded && (
                  <>
                    <Button
                      onClick={() => {
                        handleDefineTerms();
                        setIsExpanded(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faListOl}></FontAwesomeIcon> Author
                      Definitions
                    </Button>{' '}
                  </>
                )}
              </>
            )}

          {props.contentBlock?.component?.componentId ===
            Constants.RelatedProductsListComponentId &&
            props.contentBlock.data && (
              <RelatedProductsList
                contentBlock={props.contentBlock}
                onSettingsChange={props.onSettingsChange}
              ></RelatedProductsList>
            )}

          {props.contentBlock &&
            props.contentBlock.component &&
            !props.contentBlock.component.settings?.hasExpansion &&
            props.contentBlock.component.componentId !==
              Constants.RelatedProductsListComponentId &&
            props.contentBlock.component.componentId !==
              Constants.FaqListComponentId &&
            props.contentBlock.component.componentId !==
              Constants.GlossaryTermComponentId && (
              <div className="RichEditor-root">
                <div className="overlaycontainer">
                  <div
                    className="RichEditor-editor overlayunder"
                    onClick={() => focusEditor()}
                  >
                    <Editor
                      editorState={editorState}
                      onEditorStateChange={handleChange}
                      size={props.size}
                      onFocus={() => {
                        setHasFocus(true);
                      }}
                      onBlur={handleBlur}
                      editorRef={setEditorRef}
                      onTab={handleTab}
                      editorStyle={{ overflow: 'hidden' }}
                      toolbarStyle={{ display: hasFocus ? '' : 'none' }}
                      toolbar={{
                        options: [
                          'inline',
                          'blockType',
                          'list',
                          'textAlign',
                          'link',
                          'image',
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
                        image: {
                          className: undefined,
                          component: undefined,
                          popupClassName: undefined,
                          urlEnabled: true,
                          uploadEnabled: true,
                          alignmentEnabled: true,
                          uploadCallback: undefined,
                          previewImage: false,
                          inputAccept:
                            'image/gif,image/jpeg,image/jpg,image/png,image/svg',
                          alt: { present: false, mandatory: false },
                          defaultSize: {
                            height: 'auto',
                            width: 'auto',
                          },
                        },
                        history: {
                          inDropdown: false,
                          className: undefined,
                          component: undefined,
                          dropdownClassName: undefined,
                          options: ['undo', 'redo'],
                        },
                      }}
                      stripPastedStyles={true}
                      insertPlaceholder={insertPlaceholder}
                      handleLang={handleLang}
                      toolbarCustomButtons={[
                        <EditorCustomToolbarOption key="0"><>&nbsp; &nbsp; &nbsp;</></EditorCustomToolbarOption>,
                        <EditorCustomToolbarOption key="1">
                          <div style={{ flex: 1 }}>
                            {props.contentBlock.component.componentId !==
                              Constants.BlankComponentId && (
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
                                      disabled={isComposing}
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
                                          <span>
                                            Rewrite entire content block.
                                          </span>
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
                            )}

                            <div style={{ float: 'right' }}>
                              <Button
                                color="secondary"
                                size="sm"
                                outline
                                onClick={composeSentence}
                                disabled={isComposing}
                              >
                                <>
                                  <a data-tip data-for="append">
                                    <FontAwesomeIcon icon={faPlus} />
                                    {props.size === 'small' ? (
                                      <></>
                                    ) : (
                                      <> Sentence</>
                                    )}
                                  </a>
                                  <ReactTooltip
                                    id="append"
                                    className="tooltip"
                                    type="info"
                                    multiline={true}
                                    effect="solid"
                                  >
                                    <span>
                                      Complete sentence or author a new sentence
                                      at the end.
                                      <br />
                                      Hint: hit Tab while in the editor
                                    </span>
                                  </ReactTooltip>
                                </>
                              </Button>
                            </div>
                          </div>
                        </EditorCustomToolbarOption>,
                      ]}
                    />
                  </div>
                  {isComposing && (
                    <div className="overlayover">
                      <Loader></Loader>
                    </div>
                  )}
                </div>
                <hr />
                <AutoLink
                  content={props.contentBlock.content}
                  contentBlockId={props.contentBlock.contentBlockId}
                  isComposing={isComposing}
                  setIsComposing={setIsComposing}
                  handleCompose={props.onCompose}
                  getCurrentContent={getCurrentContent}
                  replaceAllContent={replaceAllContent}
                />
              </div>
            )}
        </CardBody>
      </Card>
    </>
  );
};

export default ContentBlockEditor;
