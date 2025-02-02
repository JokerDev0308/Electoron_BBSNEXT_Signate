import React, { useState } from 'react';
import Modal, { Styles } from 'react-modal';
import './Modal.css';

type Props = {
  onSubmit: (key: string) => void;
  onClose: () => void;
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

export default function AuthModal(props: Props) {
  const [key, setKey] = useState('');
  const [disabled, setDisabled] = useState(false);
  const { onSubmit, onClose } = props;

  const handleOnChange = (event: any) => {
    setKey(event.target.value);
  };

  const handleOnSubmit = () => {
    if (key === '') return;
    onSubmit(key);
    setDisabled(true);
  };

  return (
    <Modal
      isOpen
      onRequestClose={onClose}
      ariaHideApp={false}
      style={customStyles}
    >
      <div className="dialog-content">
        <span className="dialog-message">認証用のキーを入力してください。</span>
        <div>
          <input
            className="dialog-input"
            type="text"
            value={key}
            onChange={handleOnChange}
          />
        </div>
        <div className="dialog-actions">
          <button
            className="btn-cancel"
            type="button"
            onClick={onClose}
            disabled={disabled}
          >
            キャンセル
          </button>
          <button
            className="btn-confirm"
            type="button"
            onClick={handleOnSubmit}
            disabled={disabled}
          >
            認証
          </button>
        </div>
      </div>
    </Modal>
  );
}
