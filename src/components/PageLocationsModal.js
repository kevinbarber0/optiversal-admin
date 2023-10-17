import React, { useState, useEffect, useMemo } from 'react';
import {
  Input,
  Label,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import Loader from '@components/common/Loader';
import { useEditPageContext } from '@context/EditPageContext';
import { PresentationMode } from '@util/enum';

function PageLocationsModal(props) {
  const {
    modalOpen,
    orgLocations,
    setModalOpen,
    onClickLocation,
    onSave,
    ...otherProps
  } = props;

  const { page, locationPages, setLocation, setPresentationMode } =
    useEditPageContext();

  const [working, setWorking] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [seletedLocations, setSeletedLocations] = useState([]);

  const locationOptions = useMemo(() => {
    return orgLocations?.locations.map((location) => {
      return {
        id: location.locationId,
        state: location.state,
        city: location.city,
        label: (({ state, city }) => `${city}, ${state}`)(location),
      };
    });
  }, [orgLocations]);

  useEffect(() => {
    if (!orgLocations?.locations?.length > 0 || !locationPages?.length > 0)
      return;

    if (orgLocations.locations.length === locationPages.length)
      setSelectAll(true);

    if (!page) setSeletedLocations(null);
    else {
      const selectedLocations = locationPages.map((loc) => {
        const location = orgLocations.locations.find(
          (l) => l.locationId === loc.locationId,
        );
        return {
          id: location.locationId,
          state: location.state,
          city: location.city,
          label: (({ state, city }) => `${city}, ${state}`)(location),
        };
      });

      setSeletedLocations(selectedLocations);
    }
  }, [orgLocations, locationPages]);

  const handleSave = async () => {
    setWorking(true);
    await onSave(seletedLocations);
    setWorking(false);
    setModalOpen(!modalOpen);
  };

  const handleClickLocation = async (location) => {
    setWorking(true);
    await onClickLocation(location);
    setPresentationMode(PresentationMode.Location);
    setLocation(location);
    setWorking(false);
    setModalOpen(!modalOpen);
  };

  const handleClickAllLocations = (e) => {
    e.preventDefault();
    setSelectAll(e.target.checked);
    if (e.target.checked)
      setSeletedLocations(
        orgLocations.locations.map((loc) => ({
          id: loc.locationId,
          state: loc.state,
          city: loc.city,
          label: (({ state, city }) => `${city}, ${state}`)(loc),
        })),
      );
    else setSeletedLocations([]);
  };

  const handleChange = (selected) => {
    if (selected.length === orgLocations.locations.length) setSelectAll(true);
    else setSelectAll(false);
    setSeletedLocations(selected);
  };

  const LocationsMultiSelectList = ({
    options,
    columns = 1,
    name,
    selected,
    handleChange,
  }) => {
    return (
      <div className="multiselect">
        <div className="multiselect-control">
          <div className="form-check">
            <Input
              type="checkbox"
              name="select_all"
              id="select_all"
              defaultChecked={selectAll}
              onChange={(e) => handleClickAllLocations(e)}
            />
            <Label for="select_all" check>
              Select All
            </Label>
          </div>
        </div>
        <div
          className={`multiselect-list ${name}`}
          style={{ columnCount: columns }}
        >
          {options.map((option) => (
            <div className="multiselect-control" key={option.id}>
              <div className="form-check">
                <Input
                  type="checkbox"
                  name={option.label}
                  id={option.id}
                  defaultChecked={selected?.some((sel) => sel.id === option.id)}
                  onChange={({ target }) => {
                    if (target.checked) {
                      handleChange([...selected, option]);
                    } else {
                      handleChange(selected.filter((s) => s.id !== option.id));
                    }
                  }}
                />
                <Label>
                  <a
                    href="#"
                    style={{ 'text-decoration': 'underline' }}
                    onClick={() => handleClickLocation(option)}
                  >
                    {option.label}
                  </a>
                </Label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <Modal
      size="lg"
      centered={true}
      isOpen={modalOpen}
      toggle={() => setModalOpen(!modalOpen)}
      onOpened={() => {
        setSeletedLocations(
          locationPages.map((loc) => {
            const location = orgLocations.locations.find(
              (l) => l.locationId === loc.locationId,
            );

            return {
              id: location.locationId,
              state: location.state,
              city: location.city,
              label: (({ state, city }) => `${city}, ${state}`)(location),
            };
          }),
        );
        if (orgLocations?.locations?.length === locationPages?.length)
          setSelectAll(true);
      }}
      backdrop="static"
      scrollable
    >
      <ModalHeader>Please select the locations</ModalHeader>
      <ModalBody>
        {working && (
          <>
            <p>Applying changes...</p>
            <Loader />
          </>
        )}
        {!working && locationOptions && (
          <LocationsMultiSelectList
            options={locationOptions.sort((a, b) =>
              a.label > b.last_nom ? 1 : b.label > a.label ? -1 : 0,
            )}
            columns={2}
            selected={seletedLocations}
            handleChange={handleChange}
            name="page-locations"
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button onClick={() => setModalOpen(!modalOpen)} disabled={working}>
          Close
        </Button>
        <Button color="primary" onClick={() => handleSave()} disabled={working}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default PageLocationsModal;
