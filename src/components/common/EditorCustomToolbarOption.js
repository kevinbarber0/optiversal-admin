// Wrapper for custom toolbar options, react-draft-wysiwyg will pass props to
// toolbar options, which warns for plain DOM elements.
// https://jpuri.github.io/react-draft-wysiwyg/#/docs

const EditorCustomToolbarOption = ({ children }) => {
  return (
    {...children}
  );
};

export default EditorCustomToolbarOption;
