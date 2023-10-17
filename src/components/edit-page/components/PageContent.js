import React, {
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import Link from 'next/link';
import {
  Card,
  CardBody,
  FormGroup,
  Input,
  Label,
  Form,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  InputGroup,
  InputGroupButtonDropdown,
  Button,
  UncontrolledAlert,
  Spinner,
} from 'reactstrap';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FalconCardHeader from '@components/common/FalconCardHeader';
import PageLocationsModal from '@components/PageLocationsModal';
import {
  getTopicSuggestions,
  useGetLanguagesOption,
  useGetContentTemplate,
  useGetOrgGeoLocations,
  checkSerp,
  findPagesByTitle,
} from '@util/api';
import {
  faMagic,
  faLocationDot,
  faEllipsisH,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { Constants } from '@util/global';
import { Languages } from '@util/enum';
import { useEditPageContext } from '@context/EditPageContext';
import { debounce } from 'lodash';
import { getPageLink } from '@helpers/page';

const PageContent = ({
  title,
  setTitle,
  onChangeLanguage,
  onClickLocation,
  onSavePageLocations,
  onSearch,
  onCopy,
  onExportDocx,
  showComposeButton,
  contentTemplateId,
  isComposed,
  removeTitleTrans,
}) => {
  const {
    page,
    language,
    location,
    locationPages,
    isWorking,
    setEnableAutoMeta,
    orgSettings,
    keyword,
  } = useEditPageContext();

  const titleRef = useRef();

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const { status, data: langsData } = useGetLanguagesOption();
  const [pageTitle, setPageTitle] = useState(title.trim());
  const [modalOpen, setModalOpen] = useState(false);
  const [enabledLocation, setEnabledLocation] = useState(false);
  const [matchPages, setMatchPages] = useState([]);
  const [ranked, setRanked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const { data: ctData } = useGetContentTemplate(contentTemplateId);
  const { isLoading: isOrgLocationsLoading, data: orgLocations } =
    useGetOrgGeoLocations();

  const menuItems = useMemo(() => {
    if (status && langsData?.languages?.length > 0) {
      return ['en', ...langsData.languages];
    }
    return [];
  }, [langsData?.languages]);

  useEffect(() => {
    setPageTitle(title);
  }, [title]);

  useEffect(() => {
    if (!keyword || keyword.length <= 0) return;
    const checkPage = async () => {
      await doCheckPage(title);
    };

    checkPage();
  }, [keyword]);

  useEffect(() => {
    if (
      ctData &&
      ctData?.contentTemplate?.settings?.useLocations &&
      orgLocations?.locations?.length > 0 &&
      (page || isComposed)
    )
      setEnabledLocation(true);
  }, [ctData, orgLocations, page, isComposed]);

  const debouncedTitle = useCallback(
    debounce((title) => {
      setTitle(title);
      removeTitleTrans();
    }, 250),
    [],
  );

  const onChangeTitle = (value) => {
    setPageTitle(value);
    debouncedTitle(value);
  };

  const showSuggestionButton =
    !!contentTemplateId &&
    contentTemplateId !== Constants.ProductAssortmentContentTemplateId;

  const toggleSuggestions = async () => {
    setIsFetchingSuggestions(true);
    if (!suggestionsOpen) {
      const suggRes = await getTopicSuggestions(contentTemplateId, title);
      if (suggRes.success) {
        setTopicSuggestions(suggRes.topics);
        setSuggestionsOpen(true);
      } else {
        toast.error('Unable to suggest topics: ' + suggRes.message);
      }
    } else {
      setSuggestionsOpen(false);
    }
    setIsFetchingSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    doCheckPage(titleRef.current.value);
    onSearch(titleRef.current.value);
    setEnableAutoMeta(true);
  };

  useEffect(() => {
    if (!location) return;

    const selected = locationPages.find(
      (loc) => loc.locationId === location.id,
    );
    setTitle(selected.content.title);
  }, [location]);

  const doCheckPage = useCallback(
    async (query) => {
      let res = null;
      setIsChecking(true);
      try {
        res = await checkSerp(query);
        if (res.success && res.ranked) {
          setRanked(true);
        }
        res = await findPagesByTitle(query);
        if (res.success && res.pages?.length > 0) {
          setMatchPages(res.pages);
        }
      } catch (e) {
        console.log('error', e);
      }
      setIsChecking(false);
    },
    [title, keyword],
  );
  return (
    <Card className="mb-3">
      <FalconCardHeader title="Page Content" light={false}>
        {enabledLocation && (
          <PageLocationsModal
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            orgLocations={orgLocations}
            onClickLocation={onClickLocation}
            onSave={onSavePageLocations}
          />
        )}
        <InputGroup className="align-items-center">
          <UncontrolledDropdown className="text-sans-serif btn-reveal-trigger">
            <DropdownToggle
              color="link"
              size="sm"
              className="btn-reveal text-600"
              disabled={isWorking}
            >
              <FontAwesomeIcon icon={faEllipsisH} className="fs--2" />
            </DropdownToggle>
            <DropdownMenu right className="border py-0">
              <div className="bg-white py-2">
                <DropdownItem onClick={onCopy}>Copy to Clipboard</DropdownItem>
                <DropdownItem onClick={onExportDocx}>
                  Export as .doc
                </DropdownItem>
              </div>
            </DropdownMenu>
          </UncontrolledDropdown>
          {menuItems.length > 0 && (
            <UncontrolledDropdown className="text-sans-serif btn-reveal-trigger btn-trans-page">
              <DropdownToggle
                color="link"
                size="sm"
                className="btn-reveal text-600"
                disabled={isWorking}
              >
                {Languages[language]}
              </DropdownToggle>
              <DropdownMenu>
                {menuItems.map((l) => (
                  <DropdownItem key={l} onClick={() => onChangeLanguage(l)}>
                    {Languages[l]}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledDropdown>
          )}
          {enabledLocation && (
            <UncontrolledDropdown className="text-sans-serif btn-reveal-trigger btn-trans-page">
              <DropdownToggle
                id="pageLocation"
                color="link"
                size="sm"
                className="btn-reveal text-600"
                onClick={() => setModalOpen(!modalOpen)}
                disabled={isWorking}
              >
                <FontAwesomeIcon icon={faLocationDot} className="fs--2" />
              </DropdownToggle>
            </UncontrolledDropdown>
          )}
          {page && (
            <Button
              tag="a"
              href={getPageLink(page, orgSettings?.settings)}
              target="_blank"
              color="link"
              size="sm"
              className="btn-reveal p-1 ml-2"
            >
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="fs--1 sm"
              />
            </Button>
          )}
        </InputGroup>
      </FalconCardHeader>
      <CardBody tag={Form} className="bg-light" onSubmit={handleSubmit}>
        <FormGroup>
          <Label for="title">Page Title</Label>
          <div className="input-group">
            <Input
              innerRef={titleRef}
              id="title"
              type="text"
              placeholder="Page Title"
              value={pageTitle}
              onChange={({ target }) => onChangeTitle(target.value)}
            />
            {showSuggestionButton && (
              <InputGroupButtonDropdown
                addonType="append"
                isOpen={suggestionsOpen}
                toggle={toggleSuggestions}
                disabled={isFetchingSuggestions}
              >
                <DropdownToggle caret>
                  <FontAwesomeIcon icon={faMagic} />{' '}
                  {isFetchingSuggestions ? 'Thinking...' : 'Get Suggestions'}
                </DropdownToggle>
                <DropdownMenu>
                  {topicSuggestions.map((topic) => (
                    <DropdownItem
                      key={topic}
                      onClick={() => onChangeTitle(topic.trim())}
                    >
                      {topic.trim()}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </InputGroupButtonDropdown>
            )}
            {showComposeButton && (
              <button
                className="btn btn-primary shadow-none ml-2"
                type="submit"
                aria-haspopup="true"
                aria-expanded="false"
                //  disabled={!title}
              >
                Compose
              </button>
            )}
          </div>
        </FormGroup>
        {isChecking && <Spinner size="sm" variant="primary" />}
        {!isChecking && ranked && (
          <UncontrolledAlert color="warning" className="mb-0">
            This organization already
            <Link
              href={`https://www.google.com/search?q=${pageTitle}`}
              legacyBehavior
            >
              <a target="_blank"> ranks well </a>
            </Link>
            for this keyword.
          </UncontrolledAlert>
        )}
        {!isChecking && matchPages?.length > 0 && (
          <UncontrolledAlert color="warning" className="mb-0">
            <span>There is an </span>
            <Link href={`/page/${matchPages[0]?.slug}`} legacyBehavior>
              <a target="_blank">existing page</a>
            </Link>
            <span> with this title.</span>
          </UncontrolledAlert>
        )}
      </CardBody>
    </Card>
  );
};

export default PageContent;
