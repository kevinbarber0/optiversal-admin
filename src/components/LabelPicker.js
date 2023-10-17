import React, { useState } from 'react';
import Link from 'next/link';
import { Badge, Tooltip } from 'reactstrap';
import ButtonIcon from '@components/common/ButtonIcon';
import FilterSelect from '@components/FilterSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import {
  loadLabelsOptions,
  loadProductLabelsOptions,
} from '@util/load-options';

function LabelPicker(props) {
  const { uId, labelContext } = props;
  const [labels, setLabels] = useState(
    props.labels
      ? props.labels.map((l) => {
          return { value: l, label: l };
        })
      : [],
  );
  const [isEdit, setIsEdit] = useState(false);

  const updateLabels = () => {
    if (props.onLabelsChanged) {
      props.onLabelsChanged(
        props.itemId,
        labels ? labels.map((v) => v.value) : [],
      );
    }
    setIsEdit(false);
  };

  return (
    <>
      {!isEdit && (
        <>
          {props.labels &&
            props.labels.map((label) => (
              <LabelBadge
                key={`label-${label.replace(/\s+/g, '')}-${uId}`}
                uId={uId}
                label={label}
                labelContext={labelContext}
              />
            ))}
          {props.allowEdit !== false && (
            <FontAwesomeIcon
              icon={faEdit}
              size="sm"
              className="cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                setIsEdit(true);
              }}
            />
          )}
        </>
      )}
      {isEdit && (
        <>
          <div className="d-flex flex-row align-items-center">
            <div style={{ width: 200, marginRight: 5 }}>
              <FilterSelect
                label=""
                placeholder="Select labels..."
                value={labels}
                onChange={(value) => {
                  setLabels(value);
                }}
                defaultOptions
                loadOptions={
                  props.productLabel
                    ? loadProductLabelsOptions
                    : loadLabelsOptions
                }
                isMulti
                isCreatable={true}
              />
            </div>
            <ButtonIcon
              color="falcon-success"
              icon="check"
              iconAlign="right"
              transform="shrink-3"
              onClick={(e) => {
                e.preventDefault();
                updateLabels();
              }}
            ></ButtonIcon>
          </div>
        </>
      )}
    </>
  );
}

const LabelBadge = ({ uId, label, labelContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const textColor = labelContext?.[label]?.color ? '#fff' : '#7d899b';
  return (
    <>
      <Badge
        id={`label-${label.replace(/\s+/g, '')}-${uId}`}
        color="soft-secondary"
        className="rounded-capsule mr-1"
        style={{
          textDecoration: labelContext?.[label]?.linkUrl
            ? `underline ${textColor} dotted`
            : '',
          backgroundColor: labelContext?.[label]?.color
            ? labelContext[label].color
            : '',
        }}
        pill
      >
        {labelContext?.[label]?.linkUrl ? (
          <Link href={labelContext[label].linkUrl}>
            <a
              target={labelContext?.[label]?.linkNewWindow ? '_blank' : ''}
              style={{ color: textColor }}
            >
              {label}
            </a>
          </Link>
        ) : (
          <span style={{ color: textColor }}>{label}</span>
        )}
      </Badge>

      {labelContext?.[label]?.causes?.length > 0 && (
        <Tooltip
          placement="right"
          isOpen={isOpen}
          target={`label-${label.replace(/\s+/g, '')}-${uId}`}
          toggle={() => setIsOpen(!isOpen)}
        >
          <ul className="pl-3 text-left m-0">
            {labelContext[label].causes.map((cause) => (
              <li key={cause}>{cause}</li>
            ))}
          </ul>
        </Tooltip>
      )}
    </>
  );
};

export default LabelPicker;
