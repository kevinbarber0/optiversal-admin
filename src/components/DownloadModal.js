import React, { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
} from 'reactstrap';

const DownloadModal = (props) => {
  const { isOpen, toggle, title, downloadURL, ...rest } = props;
  const [progressValue, setProgressValue] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (downloadURL) {
      setProgressValue(100);
      clearInterval(timer);
    }
  }, [downloadURL, timer]);

  useEffect(() => {
    if (!isOpen) return;
    if (downloadURL) return;

    setProgressValue(0);
    let timerID = setInterval(() => {
      setProgressValue((progressValue) => {
        const random = Math.floor(Math.random() * 15);
        return progressValue + random >= 99 ? 99 : progressValue + random;
      });
    }, 300);

    setTimer(timerID);

    return () => clearInterval(timerID);
  }, [isOpen, downloadURL]);

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>{title}</ModalHeader>
      <ModalBody>
        <Progress animated className="mb-3" value={progressValue}>
          {progressValue}%
        </Progress>
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          onClick={toggle}
          href={downloadURL}
          download
          disabled={!downloadURL}
        >
          Download
        </Button>
        &nbsp;
        <Button color="secondary" onClick={toggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DownloadModal;
