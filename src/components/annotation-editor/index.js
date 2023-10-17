import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Slate, Editable, ReactEditor, withReact, useSlate } from 'slate-react';
import { Editor, Transforms, Text, createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Range } from 'slate';
import { ButtonGroup, Button } from 'reactstrap';

const AnnotationEditor = (props) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const {
    initValue,
    annotationTypes,
    source,
    removeAnnotation,
    handleAddAnnotation,
    handleRemoveAnnotation,
  } = props;
  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(true);
  const [value, setValue] = useState(initValue);

  useEffect(() => {
    setValue(initValue);
    editor.children = initValue;
  }, [initValue]);

  const handleChange = (v) => {
    setValue(v);
  };

  useEffect(() => {
    if (!ReactEditor.isFocused(editor)) {
      setIsComponentVisible(true);
    }
  });
  return (
    <div ref={ref}>
      <Slate
        editor={editor}
        value={value}
        onChange={(value) => handleChange(value)}
      >
        <div className="annotation-editor-container position-relative">
          {isComponentVisible && (
            <HoveringToolbar
              source={source}
              value={value}
              annotationTypes={annotationTypes}
              handleAddAnnotation={handleAddAnnotation}
              handleRemoveAnnotation={handleRemoveAnnotation}
            />
          )}
          <ButtonRemoveFormat
            value={value}
            removeAnnotation={removeAnnotation}
            handleRemoveAnnotation={handleRemoveAnnotation}
          />
          <Editable
            renderLeaf={(props) => (
              <Leaf {...props} annotationTypes={annotationTypes} />
            )}
          />
        </div>
      </Slate>
    </div>
  );
};

const isFormatActive = (editor, formatKey) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => n[formatKey] === true,
    mode: 'all',
  });

  return !!match;
};

const toggleFormat = (
  editor,
  value,
  source,
  format,
  addAnnotation,
  removeAnnotation,
) => {
  const { selection } = editor;
  const str = Editor.string(editor, selection);
  const { start, end } = getSelectionPosition(value, selection, str);
  const formatKey = `${format}_${start}_${end}_${source}`;
  const isActive = isFormatActive(editor, formatKey);
  Transforms.setNodes(
    editor,
    {
      [formatKey]: isActive ? null : true,
    },
    { match: Text.isText, split: true },
  );

  if (isActive) removeAnnotation(formatKey, str);
  else addAnnotation(formatKey, str);
};

const removeFormat = (editor, formatKey, str, removeAnnotation) => {
  const isActive = isFormatActive(editor, formatKey);
  if (isActive) {
    Transforms.setNodes(
      editor,
      {
        [formatKey]: isActive ? null : true,
      },
      { match: Text.isText, split: true },
    );
    removeAnnotation(formatKey, str);
  }
};

const Leaf = ({ attributes, children, leaf, annotationTypes }) => {
  const ch = children?.props?.parent?.children || [];
  const keysArray = ch
    .map((c) => Object.keys(c)?.filter((key) => key !== 'text'))
    .filter((c) => c.length > 0);

  Object.keys(leaf)
    ?.filter((key) => key !== 'text')
    .forEach((key) => {
      const maxIndex = getMaxIndex(keysArray, key) || 0;
      const annotationType = key.split('_')[0];
      children = (
        <span
          className={`annotation ${annotationType}`}
          style={{
            paddingBottom: `${maxIndex * 3}px`,
            borderColor: `#${
              annotationTypes?.find(
                (t) =>
                  t.name.toLowerCase().replaceAll(/\s/g, '') === annotationType,
              )?.color
            }`,
          }}
        >
          {children}
        </span>
      );
    });

  return <span {...attributes}>{children}</span>;
};

const ButtonRemoveFormat = (props) => {
  const { value, removeAnnotation, handleRemoveAnnotation } = props;
  const editor = useSlate();

  useEffect(() => {
    if (removeAnnotation) {
      const selectLocation = getSelectLocation(
        value,
        removeAnnotation.formatKey,
      );
      Transforms.select(editor, selectLocation);

      removeFormat(
        editor,
        removeAnnotation.formatKey,
        removeAnnotation.excerpt,
        handleRemoveAnnotation,
        value,
      );
    }
  }, [removeAnnotation]);

  return <></>;
};

const HoveringToolbar = (props) => {
  const {
    annotationTypes,
    value,
    source,
    handleAddAnnotation,
    handleRemoveAnnotation,
  } = props;
  const ref = useRef();
  const editor = useSlate();
  const { selection } = editor;

  useEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }
    if (
      !selection ||
      !ReactEditor.isFocused(editor) ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ''
    ) {
      el.removeAttribute('style');
      return;
    }

    const domSelection = window.getSelection();
    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    const containerRect = el.parentNode.getBoundingClientRect();

    el.style.opacity = '1';
    el.style.top = `${rect.top - containerRect.top - el.offsetHeight}px`;
    el.style.left = `${
      rect.left - containerRect.left - el.offsetWidth / 2 + rect.width / 2
    }px`;
  });

  return (
    <div ref={ref} className="annotation-toolbar">
      <ButtonGroup
        aria-label="annotation formatting"
        onClick={(e) => {
          const annotationType = e.target.value;
          toggleFormat(
            editor,
            value,
            source,
            annotationType,
            handleAddAnnotation,
            handleRemoveAnnotation,
          );
        }}
      >
        {annotationTypes?.map((annotationType) => (
          <Button
            key={annotationType.annotationTypeId}
            id={annotationType.annotationTypeId}
            color="custom"
            value={annotationType.name.toLowerCase().replaceAll(/\s/g, '')}
            aria-label={annotationType.name.toLowerCase().replaceAll(/\s/g, '')}
            style={{
              background: `#${annotationType.color}`,
              color: 'white',
              borderColor: '#dbdbdb',
            }}
          >
            {annotationType.name.charAt(0).toUpperCase()}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
};

const getSelectionPosition = (value, selection, str) => {
  let atStart = selection.anchor.offset || 0;
  value.forEach((c, index) => {
    if (index <= selection.anchor.path[0]) {
      c.children.forEach((t, index) => {
        if (index < selection.anchor.path[1]) {
          atStart += t.text.length;
        }
      });
    }
  });

  return {
    start: atStart,
    end: atStart + str.length,
  };
};

const getSelectLocation = (value, formatKey) => {
  const nodes = [];

  for (let i = 0; i < value.length; i++) {
    const children = value[i].children;
    for (let j = 0; j < children.length; j++) {
      // If keyString is found
      if (children[j][formatKey]) {
        nodes.push({ path: [i, j], text: children[j].text });
      }
    }
  }

  if (nodes.length === 0) return [];
  return {
    anchor: { path: nodes[0].path, offset: 0 },
    focus: {
      path: nodes[nodes.length - 1].path,
      offset: nodes[nodes.length - 1].text.length,
    },
  };
};

const getMaxIndex = (arr, value) => {
  if (arr.length === 0) {
    return -1;
  }

  var maxArr = [];
  var maxIndex = 0;

  for (var i = 0; i < arr.length; i++) {
    if (arr[i].indexOf(value) > maxIndex) {
      maxIndex = arr[i].indexOf(value);
      maxArr = arr[i];
    }
  }

  if (maxIndex === 0) {
    return maxIndex;
  }

  return 1 + getMaxIndex(arr, maxArr[maxIndex - 1]);
};

const useComponentVisible = (initialIsVisible) => {
  const [isComponentVisible, setIsComponentVisible] =
    useState(initialIsVisible);
  const ref = useRef(null);

  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setIsComponentVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  return { ref, isComponentVisible, setIsComponentVisible };
};

export default AnnotationEditor;
