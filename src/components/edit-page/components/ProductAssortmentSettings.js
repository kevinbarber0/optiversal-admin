import { useState, useCallback, useEffect } from 'react';
import { Button, Col, Input, Label, Row, FormGroup } from 'reactstrap';
import { toast } from 'react-toastify';

import FormGroupInput from '@components/common/FormGroupInput';
import FormGroupSelect from '@components/common/FormGroupSelect';
import FilterSelect from '@components/FilterSelect';
import { useEditPageContext } from '@context/EditPageContext';

import {
  getConcepts,
  getCategories,
  getSkus,
  getCustomAttributes,
} from '@util/api.js';
import useDebouncedCallback from 'hooks/useDebouncedCallback';
import { differenceWith, isEqual } from 'lodash';

const ProductAssortmentSettings = ({ settings, onChangeParameters }) => {
  const { location, locationPages } = useEditPageContext();

  const [isSaveAvailable, setSaveAvailable] = useState(false);
  const [contentSettings, setContentSettings] = useState(
    settings?.contentSettings || {},
  );

  const [searchType, setSearchType] = useState(settings?.searchType || '');

  const [concepts, setConcepts] = useState(
    settings?.searchParameters ? settings.searchParameters.concepts : [],
  );

  const [categories, setCategories] = useState(
    settings?.searchParameters ? settings.searchParameters.categories : [],
  );

  const [excludedCategories, setExcludedCategories] = useState(
    settings?.searchParameters
      ? settings.searchParameters.excludedCategories
      : [],
  );

  const [keywords, setKeywords] = useState(
    settings?.searchParameters ? settings.searchParameters.keywords : null,
  );

  const [excludedKeywords, setExcludedKeywords] = useState(
    settings?.searchParameters
      ? settings.searchParameters.excludedKeywords
      : null,
  );

  const [pinnedSkus, setPinnedSkus] = useState(
    settings?.searchParameters?.pinnedSkus || [],
  );

  const [excludedSkus, setExcludedSkus] = useState(
    settings?.searchParameters
      ? settings.searchParameters.excludedSkus || []
      : [],
  );

  const [maxResults, setMaxResults] = useState(
    settings?.searchParameters?.maxResults,
  );

  const [collapseBrands, setCollapseBrands] = useState(
    settings?.searchParameters?.collapseBrands || false,
  );

  const [includedFilters, setIncludedFilters] = useState(
    settings?.searchParameters
      ? [...(settings.searchParameters.includedFilters || [])]
      : [],
  );

  const [excludedFilters, setExcludedFilters] = useState(
    settings?.searchParameters
      ? [...(settings.searchParameters.excludedFilters || [])]
      : [],
  );

  const [searchLocation, setSearchLocation] = useState(location);

  const [activeIncludeAttribute, setActiveIncludeAttribute] = useState();
  const [activeIncludeAttributeValues, setActiveIncludeAttributeValues] =
    useState([]);
  const [activeIncludeAttributeMinValue, setActiveIncludeAttributeMinValue] =
    useState();
  const [activeIncludeAttributeMaxValue, setActiveIncludeAttributeMaxValue] =
    useState();
  const [activeExcludeAttribute, setActiveExcludeAttribute] = useState();
  const [activeExcludeAttributeValues, setActiveExcludeAttributeValues] =
    useState([]);
  const [activeExcludeAttributeMinValue, setActiveExcludeAttributeMinValue] =
    useState();
  const [activeExcludeAttributeMaxValue, setActiveExcludeAttributeMaxValue] =
    useState();

  const handleAddExStringAttribute = () => {
    if (
      !activeExcludeAttributeValues ||
      activeExcludeAttributeValues.length < 1
    ) {
      toast.error('You must select at least one attribute value', {
        theme: 'colored',
      });
      return;
    }
    setExcludedFilters([
      ...excludedFilters,
      {
        name: activeExcludeAttribute.name,
        dataType: activeExcludeAttribute.dataType,
        value:
          activeExcludeAttribute.value +
          ':' +
          activeExcludeAttributeValues.map((v) => v.value).join('|'),
        label:
          activeExcludeAttribute.value +
          ':' +
          activeExcludeAttributeValues.map((v) => v.value).join(','),
      },
    ]);
    setActiveExcludeAttribute(null);
    setActiveExcludeAttributeMinValue(null);
    setActiveExcludeAttributeMaxValue(null);
    setActiveExcludeAttributeValues([]);
  };

  const handleAddExNumberAttribute = () => {
    if (
      (!activeExcludeAttributeMinValue ||
        activeExcludeAttributeMinValue.length === 0) &&
      (!activeExcludeAttributeMaxValue ||
        activeExcludeAttributeMaxValue.length === 0)
    ) {
      toast.error('You must enter a minimum value, maximum value, or both', {
        theme: 'colored',
      });
      return;
    }
    setExcludedFilters([
      ...excludedFilters,
      {
        name: activeExcludeAttribute.name,
        dataType: activeExcludeAttribute.dataType,
        value:
          activeExcludeAttribute.value +
          ':' +
          (activeExcludeAttributeMinValue || '') +
          '|' +
          (activeExcludeAttributeMaxValue || ''),
        label:
          activeExcludeAttribute.value +
          ':' +
          (activeExcludeAttributeMinValue || '') +
          '->' +
          (activeExcludeAttributeMaxValue || ''),
      },
    ]);
    setActiveExcludeAttribute(null);
    setActiveExcludeAttributeMinValue(null);
    setActiveExcludeAttributeMaxValue(null);
    setActiveExcludeAttributeValues([]);
  };

  const handleAttributeChange = (attribute) => {
    setActiveIncludeAttribute(attribute);
    setActiveIncludeAttributeValues([]);
  };

  const handleChangeIncludedFilters = (val) => {
    setIncludedFilters(val || []);
  };

  const handleExAttributeChange = (attribute) => {
    setActiveExcludeAttribute(attribute);
    setActiveExcludeAttributeValues([]);
  };

  const handleAddStringAttribute = () => {
    if (
      !activeIncludeAttributeValues ||
      activeIncludeAttributeValues.length < 1
    ) {
      toast.error('You must select at least one attribute value', {
        theme: 'colored',
      });
      return;
    }
    setIncludedFilters([
      ...includedFilters,
      {
        name: activeIncludeAttribute.name,
        dataType: activeIncludeAttribute.dataType,
        value:
          activeIncludeAttribute.value +
          ':' +
          activeIncludeAttributeValues.map((v) => v.value).join('|'),
        label:
          activeIncludeAttribute.value +
          ':' +
          activeIncludeAttributeValues.map((v) => v.value).join(','),
      },
    ]);
    setActiveIncludeAttribute(null);
    setActiveIncludeAttributeMinValue(null);
    setActiveIncludeAttributeMaxValue(null);
    setActiveIncludeAttributeValues([]);
  };

  const handleChangeExcludedFilters = (val) => {
    setExcludedFilters(val || []);
  };

  const loadConceptsOptions = useCallback(
    (inputValue) =>
      new Promise((resolve) => {
        resolve(
          getConcepts(inputValue).then((res) =>
            res.concepts.map((c) => {
              return { value: c.conceptId, label: c.name };
            }),
          ),
        );
      }),
    [],
  );

  const loadCategoriesOptions = useCallback(
    (inputValue) =>
      new Promise((resolve) => {
        resolve(
          getCategories(inputValue).then((res) =>
            res.categories.map((c) => {
              return {
                value: c.categoryId,
                label: c.name + ' (' + c.categoryId + ')',
              };
            }),
          ),
        );
      }),
    [],
  );

  const loadSkusOptions = useCallback(
    (inputValue) =>
      new Promise((resolve) => {
        resolve(
          getSkus(inputValue).then((res) =>
            res.products.map((p) => {
              return { value: p.sku, label: p.sku };
            }),
          ),
        );
      }),
    [],
  );

  const loadAttributesOptions = useCallback(
    (inputValue) =>
      new Promise((resolve) => {
        resolve(
          getCustomAttributes(inputValue).then((res) =>
            res.attributes.map((p) => {
              return {
                value: p.name,
                label: p.name,
                dataType: p.dataType,
                valueOptions: p.values,
              };
            }),
          ),
        );
      }),
    [],
  );

  const handleAddNumberAttribute = () => {
    if (
      (!activeIncludeAttributeMinValue ||
        activeIncludeAttributeMinValue.length === 0) &&
      (!activeIncludeAttributeMaxValue ||
        activeIncludeAttributeMaxValue.length === 0)
    ) {
      toast.error('You must enter a minimum value, maximum value, or both', {
        theme: 'colored',
      });
      return;
    }
    setIncludedFilters([
      ...includedFilters,
      {
        name: activeIncludeAttribute.name,
        dataType: activeIncludeAttribute.dataType,
        value:
          activeIncludeAttribute.value +
          ':' +
          (activeIncludeAttributeMinValue || '') +
          '|' +
          (activeIncludeAttributeMaxValue || ''),
        label:
          activeIncludeAttribute.value +
          ':' +
          (activeIncludeAttributeMinValue || '') +
          '->' +
          (activeIncludeAttributeMaxValue || ''),
      },
    ]);
    setActiveIncludeAttribute(null);
    setActiveIncludeAttributeMinValue(null);
    setActiveIncludeAttributeMaxValue(null);
    setActiveIncludeAttributeValues([]);
  };

  const handleOnSave = useDebouncedCallback(() => {
    onChangeParameters({
      searchParameters: {
        ...settings.searchParameters,
        concepts:
          concepts?.map((c) => {
            return { value: c.value, label: c.label };
          }) || [],
        pinnedSkus: pinnedSkus || [],
        excludedSkus: excludedSkus || [],
        categories: categories || [],
        excludedCategories: excludedCategories || [],
        categoryIds: categories || [],
        excludedCategoryIds: excludedCategories || [],
        includedFilters: includedFilters || [],
        excludedFilters: excludedFilters || [],
        keywords: keywords,
        excludedKeywords: excludedKeywords || null,
        maxResults: maxResults,
        collapseBrands: collapseBrands || false,
        searchLocation: searchLocation?.id || null,
      },
      searchType,
      contentSettings,
    });
  }, 1000);

  const handleContentSettingsChange = useCallback((key, value) => {
    setContentSettings((oldValue) => ({
      ...oldValue,
      [key]: value,
    }));
  }, []);

  useEffect(() => {
    if (!isSaveAvailable) {
      setSaveAvailable(true);
    } else {
      handleOnSave();
    }
  }, [
    contentSettings,
    searchType,
    concepts,
    pinnedSkus,
    excludedSkus,
    categories,
    excludedCategories,
    includedFilters,
    excludedFilters,
    keywords,
    excludedKeywords,
    maxResults,
    collapseBrands,
    searchLocation,
  ]);

  useEffect(() => {
    if (!settings) return;
    const { searchParameters, contentSettings, searchType } = settings;
    setContentSettings(contentSettings || {});
    setSearchType(searchType || '');
    if (searchParameters && Object.keys(searchParameters).length > 0) {
      setConcepts(searchParameters.concepts || []);
      setCategories(searchParameters.categories || []);
      setExcludedCategories(searchParameters.excludedCategories || []);
      setKeywords(searchParameters.keywords || null);
      setExcludedKeywords(searchParameters.excludedKeywords || null);
      setPinnedSkus(searchParameters?.pinnedSkus || []);
      setExcludedSkus(searchParameters.excludedSkus || []);
      setMaxResults(searchParameters?.maxResults || 10);
      setCollapseBrands(searchParameters?.collapseBrands || false);

      setIncludedFilters([...(searchParameters.includedFilters || [])]);
      setExcludedFilters([...(searchParameters.excludedFilters || [])]);
    }
    setSaveAvailable(false);
  }, [settings]);

  useEffect(() => {
    if (location && locationPages.length > 0) {
      setSearchLocation(location);

      const locationPage = locationPages.find(
        (page) => page.locationId === location.id,
      ).content;

      if (!locationPage) return;

      if (locationPage.searchSettings) {
        setCategories(
          locationPage.searchSettings.categories ||
            locationPage.searchSettings.categoryIds,
        );
        setConcepts(locationPage.searchSettings.concepts);
        setExcludedCategories(
          locationPage.searchSettings.excludedCategories ||
            locationPage.searchSettings.excludedCategoryIds,
        );
        setExcludedFilters(locationPage.searchSettings.excludedFilters);
        setExcludedKeywords(locationPage.searchSettings.excludedKeywords);
        setExcludedSkus(locationPage.searchSettings.excludedSkus);
        setIncludedFilters(locationPage.searchSettings.includedFilters);
        setKeywords(locationPage.searchSettings.keywords);
        setMaxResults(locationPage.searchSettings.maxResults);
        setCollapseBrands(locationPage.searchSettings.collapseBrands);
      }
    }
  }, [location]);

  return (
    <div>
      <Label>Product Content</Label>
      <FormGroup className="form-check">
        <Input
          type="checkbox"
          name="reviewexcerpts"
          id="reviewexcerpts"
          checked={contentSettings.includeReviewExcerpts}
          onChange={({ target }) =>
            handleContentSettingsChange('includeReviewExcerpts', target.checked)
          }
        />
        <Label for="reviewexcerpts" check>
          Include Review Excerpts
        </Label>
        <br />
        <Input
          type="checkbox"
          name="pros"
          id="pros"
          checked={contentSettings.includePros}
          onChange={({ target }) =>
            handleContentSettingsChange('includePros', target.checked)
          }
        />
        <Label for="pros" check>
          Include Review Pros
        </Label>
        <br />
        <Input
          type="checkbox"
          name="cons"
          id="cons"
          checked={contentSettings.includeCons}
          onChange={({ target }) =>
            handleContentSettingsChange('includeCons', target.checked)
          }
        />
        <Label for="cons" check>
          Include Review Cons
        </Label>
        <br />
        <Input
          type="checkbox"
          name="blurbs"
          id="blurbs"
          checked={contentSettings.includeBlurbs}
          onChange={({ target }) =>
            handleContentSettingsChange('includeBlurbs', target.checked)
          }
        />
        <Label for="blurbs" check>
          Include Product Blurbs
        </Label>
        <br />
        <Input
          type="checkbox"
          name="paragraphs"
          id="paragraphs"
          checked={contentSettings.includeParagraphs}
          onChange={({ target }) =>
            handleContentSettingsChange('includeParagraphs', target.checked)
          }
        />
        <Label for="paragraphs" check>
          Include Product Paragraphs
        </Label>
      </FormGroup>
      <hr className="border-dashed border-bottom-0" />
      <FormGroupSelect
        loading={false}
        id="searchType"
        label="Search Type"
        value={searchType || ''}
        options={[
          { value: '', label: 'Default' },
          { value: 'review', label: 'Review' },
        ]}
        onChange={({ target }) => setSearchType(target.value)}
      />
      <hr className="border-dashed border-bottom-0" />
      <Label>Search Parameters</Label>
      {searchType !== 'semanitc' && (
        <>
          <FilterSelect
            label="Filter by Product Type"
            placeholder="Select types..."
            value={concepts}
            onChange={(value) => {
              setConcepts(value);
            }}
            loadOptions={loadConceptsOptions}
            isMulti
          />
          <FormGroupInput
            id="keywords"
            label="Match Keywords"
            value={keywords || ''}
            onChange={({ target }) => setKeywords(target.value)}
          />
        </>
      )}
      <FormGroupInput
        id="exkeywords"
        label="Exclude Keywords"
        defaultValue={excludedKeywords || ''}
        onChange={({ target }) => setExcludedKeywords(target.value)}
      />
      <hr className="border-dashed border-bottom-0" />
      {searchType !== 'review' && (
        <FilterSelect
          id="includedattributes"
          label="Included Attributes"
          placeholder="Select attribute..."
          onChange={handleAttributeChange}
          loadOptions={loadAttributesOptions}
          value={[activeIncludeAttribute]}
          defaultOptions={true}
        />
      )}
      {searchType !== 'review' &&
        activeIncludeAttribute &&
        (activeIncludeAttribute.dataType === 1 ||
          activeIncludeAttribute.dataType === 3) && (
          <>
            <Row form>
              <Col md={4}>
                <Input
                  type="number"
                  placeholder="Min"
                  min="0"
                  onChange={({ target }) =>
                    setActiveIncludeAttributeMinValue(target.value)
                  }
                ></Input>
              </Col>
              <Col md={4}>
                <Input
                  type="number"
                  placeholder="Max"
                  min="0"
                  onChange={({ target }) =>
                    setActiveIncludeAttributeMaxValue(target.value)
                  }
                ></Input>
              </Col>
              <Col>
                <Button onClick={handleAddNumberAttribute}>Add</Button>
              </Col>
            </Row>
          </>
        )}
      {searchType !== 'review' &&
        activeIncludeAttribute &&
        activeIncludeAttribute.dataType === 2 && (
          <>
            <Row form>
              <Col md={8}>
                <FilterSelect
                  id="includedattributevalues"
                  placeholder="Select values..."
                  label=""
                  onChange={(v) => setActiveIncludeAttributeValues(v)}
                  value={activeIncludeAttributeValues}
                  defaultOptions={true}
                  isMulti={true}
                  options={activeIncludeAttribute.valueOptions.map((val) => {
                    return { value: val, label: val };
                  })}
                />
              </Col>
              <Col>
                <Button onClick={handleAddStringAttribute}>Add</Button>
              </Col>
            </Row>
          </>
        )}
      {searchType !== 'review' &&
        includedFilters &&
        includedFilters.length > 0 && (
          <>
            <FilterSelect
              id="selectedincludedattributes"
              label=""
              onChange={handleChangeIncludedFilters}
              value={includedFilters}
              isMulti={true}
              isCreatable={true}
            />
          </>
        )}
      {searchType !== 'review' && (
        <FilterSelect
          id="excludedattributes"
          label="Excluded Attributes"
          placeholder="Select attribute..."
          onChange={handleExAttributeChange}
          loadOptions={loadAttributesOptions}
          value={[activeExcludeAttribute]}
          defaultOptions={true}
        />
      )}
      {searchType !== 'review' &&
        activeExcludeAttribute &&
        (activeExcludeAttribute.dataType === 1 ||
          activeExcludeAttribute.dataType === 3) && (
          <>
            <Row form>
              <Col md={4}>
                <Input
                  type="number"
                  placeholder="Min"
                  min="0"
                  onChange={({ target }) =>
                    setActiveExcludeAttributeMinValue(target.value)
                  }
                ></Input>
              </Col>
              <Col md={4}>
                <Input
                  type="number"
                  placeholder="Max"
                  min="0"
                  onChange={({ target }) =>
                    setActiveExcludeAttributeMaxValue(target.value)
                  }
                ></Input>
              </Col>
              <Col>
                <Button onClick={handleAddExNumberAttribute}>Add</Button>
              </Col>
            </Row>
          </>
        )}
      {searchType !== 'review' &&
        activeExcludeAttribute &&
        activeExcludeAttribute.dataType === 2 && (
          <>
            <Row form>
              <Col md={8}>
                <FilterSelect
                  id="excludedattributevalues"
                  placeholder="Select values..."
                  label=""
                  onChange={(v) => setActiveExcludeAttributeValues(v)}
                  value={activeExcludeAttributeValues}
                  defaultOptions={true}
                  isMulti={true}
                  options={activeExcludeAttribute.valueOptions.map((val) => {
                    return { value: val, label: val };
                  })}
                />
              </Col>
              <Col>
                <Button onClick={handleAddExStringAttribute}>Add</Button>
              </Col>
            </Row>
          </>
        )}
      {searchType !== 'review' &&
        excludedFilters &&
        excludedFilters.length > 0 && (
          <>
            <FilterSelect
              id="selectedexcludedattributes"
              label=""
              onChange={handleChangeExcludedFilters}
              value={excludedFilters}
              isMulti={true}
              isCreatable={true}
            />
          </>
        )}
      <hr className="border-dashed border-bottom-0" />
      <FilterSelect
        label="Included Categories"
        placeholder="Select categories..."
        value={categories}
        onChange={(value) => {
          const temp = differenceWith(value, excludedCategories, isEqual);
          if (temp.length === value.length) setCategories(value);
          else
            toast.error('Excluded category cannot be included.', {
              theme: 'colored',
            });
        }}
        loadOptions={loadCategoriesOptions}
        isMulti
      />
      <FilterSelect
        label="Excluded Categories"
        placeholder="Select categories..."
        value={excludedCategories}
        onChange={(value) => {
          const temp = differenceWith(value, categories, isEqual);
          if (temp.length === value.length) setExcludedCategories(value);
          else
            toast.error('Included category cannot be excluded.', {
              theme: 'colored',
            });
        }}
        loadOptions={loadCategoriesOptions}
        isMulti
      />
      <hr className="border-dashed border-bottom-0" />
      <FilterSelect
        label="Pinned Products"
        placeholder="Select products to pin to page..."
        value={pinnedSkus}
        onChange={(value) => {
          const temp = differenceWith(value, excludedSkus, isEqual);
          if (temp.length === value.length) setPinnedSkus(value);
          else
            toast.error('Excluded products cannot be pinned.', {
              theme: 'colored',
            });
        }}
        loadOptions={loadSkusOptions}
        isMulti
        isSortable
      />
      <FilterSelect
        label="Excluded Products"
        placeholder="Select products to exclude..."
        value={excludedSkus}
        onChange={(value) => {
          const temp = differenceWith(value, pinnedSkus, isEqual);
          if (temp.length === value.length) setExcludedSkus(value);
          else
            toast.error('Pinned products cannot be excluded.', {
              theme: 'colored',
            });
        }}
        loadOptions={loadSkusOptions}
        isMulti
      />
      <hr className="border-dashed border-bottom-0" />
      <FormGroupInput
        id="maxresults"
        label="Maximum Results"
        value={maxResults}
        type="number"
        min={1}
        max={100}
        onChange={({ target }) => {
          if (parseInt(target.value) > 100) setMaxResults(100);
          else setMaxResults(parseInt(target.value));
        }}
      />
      <FormGroup className="form-check mt-4">
        <Input
          type="checkbox"
          name="collapseBrands"
          id="collapseBrands"
          checked={collapseBrands}
          onChange={({ target }) => setCollapseBrands(target.checked)}
        />
        <Label for="collapseBrands" check>
          Collapse Brands
        </Label>
      </FormGroup>
    </div>
  );
};

export default ProductAssortmentSettings;
