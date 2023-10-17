import { useEffect, useState, useMemo } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import draftToHtml from 'draftjs-to-html';
import CodeEditor from 'react-simple-code-editor';
import {
  convertFromHTML,
  convertToRaw,
  ContentState,
  EditorState,
} from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import { html2json, json2html } from 'html2json';
import { Button } from 'reactstrap';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css'; //Example style, you can use another
import EditorCustomToolbarOption from '@components/common/EditorCustomToolbarOption';
import { useGetLanguagesOption } from '@util/api';
import { Languages, Placeholder } from '@util/enum';

import FlyoutButton from '@components/edit-page/components/flyoutmenu';

export default function EditorWithConversion({ toggleHTML = true, ...props }) {
  const [isHTMLEditorVisible, setHTMLEditorVisible] = useState(false);
  const [toolbarCustomButtons, setToolbarCustomButtons] = useState();
  const [code, setCode] = useState();
  const { status, isLoading, data: langsData } = useGetLanguagesOption();
  const disableInsertMenu = props?.disableInsertMenu || false;
  const disableLanguageMenu = props?.disableLanguageMenu || false;

  const flyoutMenuItems = useMemo(() => {
    let menuItems = {
      submenu: [
        {
          title: 'Show HTML',
          callback: () => {
            setHTMLEditorVisible(true);
          },
        },
      ],
    };

    if (!disableInsertMenu) {
      const placeMenuItems = {
        title: 'Insert Placeholder',
        submenu: [
          {
            title: 'Page Title',
            callback: () => {
              props.insertPlaceholder(Placeholder.Title);
            },
          },
          {
            title: 'Location',
            submenu: [
              {
                title: 'City',
                callback: () => {
                  props.insertPlaceholder(Placeholder.City);
                },
              },
              {
                title: 'State',
                callback: () => {
                  props.insertPlaceholder(Placeholder.State);
                },
              },
            ],
          },
        ],
      };
      menuItems.submenu.push(placeMenuItems);
    }
    if (!disableLanguageMenu) {
      if (status == 'success' && langsData?.languages?.length > 0) {
        const initItem = {
          title: 'EN',
          callback: () => {
            props.handleLang('en');
          },
        };
        const localsMenuItems = {
          title: 'Languages',
          submenu: [
            initItem,
            ...langsData.languages?.map((l) => ({
              title: Languages[l],
              callback: () => {
                props.handleLang(l);
              },
            })),
          ],
        };
        menuItems.submenu.push(localsMenuItems);
      }
    }

    return menuItems;
  }, [langsData, props.editorState]);

  useEffect(() => {
    const newToolbarCustomButtons = props.toolbarCustomButtons;
    if (toggleHTML && newToolbarCustomButtons) {
      newToolbarCustomButtons.push(
        <EditorCustomToolbarOption>
          <div className="ml-2">
            <FlyoutButton items={flyoutMenuItems} />
          </div>
        </EditorCustomToolbarOption>
      );
    }
    setToolbarCustomButtons(newToolbarCustomButtons);
  }, [flyoutMenuItems, props.editorState, props.toolbarCustomButtons]);

  useEffect(() => {
    setCode(draftToHtml(convertToRaw(props.editorState.getCurrentContent())));
  }, [isHTMLEditorVisible, props.editorState]);

  const onClickSave = () => {
    const html = htmlFormat(code);
    const contentBlock = htmlToDraft(html, (nodeName, node) => {
      if (nodeName === 'img' && node instanceof HTMLImageElement) {
        const entityConfig = {};
        entityConfig.src = node.getAttribute
          ? node.getAttribute('src') || node.src
          : node.src;
        entityConfig.alt = node.alt;
        entityConfig.height = node.style.height;
        entityConfig.width = node.style.width;
        if (node.style.float) {
          entityConfig.alignment = node.style.float;
        } else {
          if (node.style.textAlign) {
            entityConfig.alignment = node.style.textAlign;
          }
        }

        return {
          type: 'IMAGE',
          mutability: 'MUTABLE',
          data: entityConfig,
        };
      }
    });

    props.onEditorStateChange(
      EditorState.createWithContent(
        ContentState.createFromBlockArray(contentBlock),
      ),
    );
    setHTMLEditorVisible(false);
  };
  return isHTMLEditorVisible ? (
    <>
      <CodeEditor
        className="border"
        value={code}
        onValueChange={setCode}
        highlight={(code) => highlight(code, languages.markup)}
        padding={10}
      />
      <div className="mt-2 d-flex justify-content-end">
        <Button color="secondary" onClick={() => setHTMLEditorVisible(false)}>
          Cancel
        </Button>
        &nbsp;&nbsp;
        <Button color="primary" onClick={onClickSave}>
          Save
        </Button>
      </div>
    </>
  ) : (
    <Editor {...props} toolbarCustomButtons={toolbarCustomButtons} />
  );
}

const htmlFormat = (data) => {
  const json = html2json(data);
  Array.isArray(json.child) &&
    json.child.forEach((item) => {
      if (item.tag === 'div') {
        item.tag = 'img';
        if (
          item.attr &&
          Array.isArray(item.child) &&
          item.child.length === 1 &&
          item.child[0].attr &&
          Array.isArray(item.child[0].attr.style)
        ) {
          const style = item.attr.style + item.child[0].attr.style.join('');
          item.attr = {
            ...item.child[0].attr,
          };
          item.attr.style = style;
        }
      }
    });

  const html = json2html(json);
  return html;
};
