import React, { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import { updatePageTranslation } from '@util/api.js';
import { toast } from 'react-toastify';
import {
  EditorState,
  convertFromRaw,
  ContentState,
  convertToRaw,
} from 'draft-js';
import Editor from '@components/common/Editor';
import htmlToDraft from 'html-to-draftjs';
import draftToHtml from 'draftjs-to-html';

const PageTranslationEditor = (props) => {
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

  const [editorRef, setEditorRef] = useState();
  const blocks = convertFromRaw(startingContent);
  const [editorState, setEditorState] = useState(
    EditorState.createWithContent(blocks, null),
  );
  const [currentHtml, setCurrentHtml] = useState();
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setCurrentHtml(props.translation.translation);
    let nextState = EditorState.push(
      editorState,
      ContentState.createFromBlockArray(
        htmlToDraft(props.translation.translation),
      ),
      'insert-fragment',
    );
    nextState = EditorState.moveFocusToEnd(nextState);
    setEditorState(nextState);
  }, []);

  const handleChange = (e) => {
    setEditorState(e);
    const contentState = e
      ? e.getCurrentContent()
      : editorState.getCurrentContent();
    const html = draftToHtml(convertToRaw(contentState));
    setCurrentHtml(html);
  };

  const handleUpdate = async () => {
    setWorking(true);
    const newTranslation = props.translation;
    newTranslation.translation = currentHtml;
    newTranslation.status = 'Edited';
    newTranslation.dateEdited = new Date().toISOString();
    const res = await updatePageTranslation(props.pageId, newTranslation);
    if (res.success) {
      toast.success('Translation saved');
    } else {
      toast.error('There was a problem saving the translation: ' + res.message);
    }
    setWorking(false);
  };

  return (
    <>
      <div className="RichEditor-root">
        <div className="RichEditor-editor">
          <Editor
            editorState={editorState}
            onEditorStateChange={handleChange}
            editorStyle={{ overflow: 'hidden' }}
            editorRef={setEditorRef}
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
            toolbarCustomButtons={[<>&nbsp; &nbsp; &nbsp;</>]}
          />
        </div>
      </div>
      <Button color="primary" onClick={handleUpdate} disabled={working}>
        {working ? 'Saving...' : 'Save Translation'}
      </Button>
    </>
  );
};

export default PageTranslationEditor;
