import React, { useState, useEffect } from 'react';
import { getNextGrammarSample, saveGrammarSample } from '@util/api';
import { FormGroup, Label, Input, Button } from 'reactstrap';
import { toast } from 'react-toastify';
const Diff = require("text-diff");

function GrammarReview() {

  const [sampleId, setSampleId] = useState();
  const [original, setOriginal] = useState();
  const [edited, setEdited] = useState();
  const [url, setUrl] = useState();
  const diff = new Diff();

  const getNextText = async () => {
    const res = await getNextGrammarSample();
    if (res.success) {
      setSampleId(res.sample.sampleId);
      setOriginal(res.sample.original);
      setEdited(res.sample.edited);
      setUrl(res.sample.url);
    }
    else {
      toast.error(res.message);
    }
  };

  useEffect(() => {
    getNextText();
  }, []);

  const saveEdit = () => {
    save(edited);
  };

  const saveOriginal = () => {
    save(original);
  };

  const save = async (ed) => {
    if (sampleId) {
      const res = await saveGrammarSample(sampleId, ed);
      if (res.success) {
        toast.success('Edit saved!');
        getNextText();
      }
      else {
        toast.error(res.message);
      }
    }
  };

  return (
    <>
      <FormGroup>
        <Label for="original">
          Original Text {url && (<a href={url} target="_blank">{url}</a>)}
        </Label>
        <div className="input-group">
          <Input
            id="original"
            type="textarea"
            multiple={true}
            rows={4}
            value={original}
            readOnly={true}
            spellCheck={true}
          />
        </div>
      </FormGroup>
      <FormGroup>
        <Label for="original">
          Diff
        </Label>
        <div className="input-group" style={{ backgroundColor: 'white' }} dangerouslySetInnerHTML={{ __html: original && edited ? diff.prettyHtml(diff.main(original, edited)) : '' }}>
        </div>
      </FormGroup>
      <FormGroup>
        <Label for="edited">
          Edited Text
        </Label>
        <div className="input-group">
          <Input
            id="edited"
            type="textarea"
            multiple={true}
            rows={4}
            value={edited}
            onChange={({ target }) =>
              setEdited(target.value)
            }
          />
        </div>
      </FormGroup>
      <Button onClick={saveEdit} color="success">Save Edit</Button> &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp; <Button onClick={saveOriginal}>Use Original (no changes)</Button>
    </>
  );
}

const Component = GrammarReview;

Component.showNav = false;

export default Component;
