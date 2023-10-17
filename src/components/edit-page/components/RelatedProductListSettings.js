import React, { useState, useEffect, useCallback } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';
import { Constants } from '@util/global';
import FilterSelect from '@components/FilterSelect';
import { getPagesSelect } from '@util/api';
import debounce from 'just-debounce-it';

export default function RelatedProductListSettings(props) {
  const [searchQuery, setSearchQuery] = useState(
    props.contentBlock?.settings?.searchQuery || props.title,
  );
  const [searchSettings, setSearchSettings] = useState(
    props.contentBlock?.settings || {},
  );
  const [isComposing, setIsComposing] = useState(false);

  const [searchType, setSearchType] = useState(
    props.contentBlock?.settings?.searchType || 'query',
  );
  const [searchQueryInput, setSearchQueryInput] = useState(
    props.contentBlock?.settings?.searchQuery || props.title,
  );
  const [searchAssortment, setSearchAssortment] = useState(
    props.contentBlock?.settings?.assortment || null,
  );

  const handleSearchSettingsChange = async (newValue) => {
    const newSettings = {
      ...searchSettings,
      ...newValue,
    };
    setSearchSettings(newSettings);
    if (props.onSettingsChange) {
      setIsComposing(true);
      await props.onSettingsChange(
        props.contentBlock.contentBlockId,
        newSettings,
      );
      setIsComposing(false);
    }
  };

  const debouncedSearchQueryUpdate = useCallback(
    debounce((q) => {
      if (typeof q !== 'undefined' && q !== null && searchQuery !== q) {
        setSearchQuery(q);
        handleSearchSettingsChange({ searchQuery: q, searchType: 'query' });
      }
    }, 1000),
    [],
  );

  useEffect(() => {
    debouncedSearchQueryUpdate(searchQueryInput);
  }, [searchQueryInput, debouncedSearchQueryUpdate]);

  const loadAssortmentsOptions = (inputValue) =>
    new Promise((resolve) => {
      resolve(
        getPagesSelect(
          0,
          50,
          inputValue,
          Constants.ProductAssortmentContentTemplateId,
        ).then((res) =>
          res.pages.map((p) => {
            return { value: p.slug, label: p.title };
          }),
        ),
      );
    });

  return (
    <FormGroup tag="fieldset">
      <Label>Search Type</Label>
      <FormGroup check>
        <Label check>
          <Input
            type="radio"
            name="searchtype"
            value="query"
            defaultChecked={searchType === 'query'}
            onChange={() => {
              setSearchType('query');
              handleSearchSettingsChange({ searchType: 'query' });
            }}
          />{' '}
          Specify a search phrase
        </Label>
        <br />
        <Input
          placeholder="Enter search phrase"
          defaultValue={searchQuery}
          style={{ maxWidth: 500 }}
          disabled={searchType !== 'query'}
          onChange={({ target }) => setSearchQueryInput(target.value)}
        ></Input>
      </FormGroup>
      <FormGroup check>
        <Label check>
          <Input
            type="radio"
            name="searchtype"
            value="assortment"
            defaultChecked={searchType === 'assortment'}
            onChange={() => {
              setSearchType('assortment');
              handleSearchSettingsChange({ searchType: 'assortment' });
            }}
          />{' '}
          Or select a product assortment
        </Label>
        <br />
        {searchType === 'assortment' && (
          <FilterSelect
            placeholder="Select a product assortment"
            value={searchAssortment}
            onChange={(value) => {
              setSearchAssortment(value);
              handleSearchSettingsChange({ assortment: value });
            }}
            loadOptions={loadAssortmentsOptions}
          />
        )}
      </FormGroup>
    </FormGroup>
  );
}
