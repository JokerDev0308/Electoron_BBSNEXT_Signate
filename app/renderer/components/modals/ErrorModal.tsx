import React from 'react';
import Modal, { Styles } from 'react-modal';
import './Modal.css';

type Props = {
  onConfirm: () => void;
};

const customStyles: Styles = {
  overlay: {
    background: 'rgb(166, 166, 166)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'relative',
    background: 'none',
    border: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'block',
  },
};

export default function ErrorModal(props: Props) {
  const { onConfirm } = props;

  return (
    <Modal
      isOpen
      onRequestClose={onConfirm}
      ariaHideApp={false}
      style={customStyles}
    >
      <div className="dialog-content">
        <span className="dialog-message">認証エラー</span>
        <div className="dialog-actions">
          <button className="btn-confirm" type="button" onClick={onConfirm}>
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}
