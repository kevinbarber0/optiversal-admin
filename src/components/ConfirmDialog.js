import { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

export default function renderConfirmDialog(
  title,
  subTitle,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
) {
  const wrapper = document.body.appendChild(document.createElement('div'));
  const promise = new Promise((resolve, reject) => {
    try {
      ReactDOM.render(
        <ConfirmDialog
          reject={reject}
          resolve={resolve}
          title={title}
          subText={subTitle}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
        />,
        wrapper,
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
  function dispose() {
    setTimeout(() => {
      ReactDOM.unmountComponentAtNode(wrapper);
      setTimeout(() => wrapper.remove());
    }, 1000);
  }
  return promise.then(
    () => {
      dispose();
      return true;
    },
    () => {
      dispose();
      return Promise.reject(false);
    },
  );
}

function ConfirmDialog({
  reject,
  resolve,
  title,
  subText,
  confirmLabel,
  cancelLabel,
}) {
  const [isOpen, setOpen] = useState(true);

  const toggle = useCallback((cb) => {
    setOpen(false);
    cb();
  });

  return (
    <Modal isOpen={isOpen} toggle={() => toggle(reject)}>
      <ModalHeader toggle={() => toggle(reject)}>{title}</ModalHeader>
      <ModalBody>{subText}</ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={() => toggle(resolve)}>
          {confirmLabel}
        </Button>{' '}
        <Button color="secondary" onClick={() => toggle(reject)}>
          {cancelLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
