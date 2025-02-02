import { ipcRenderer, IpcRendererEvent } from 'electron';
import React, { Fragment, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import { IdleTimerProps, useIdleTimer, IdleTimerAPI } from 'react-idle-timer';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthStatus from '../main/enums/auth-status';
import './app.global.css';
import AuthModal from './components/modals/AuthModal';
import ErrorModal from './components/modals/ErrorModal';
import App from './containers/App';
import { AuthResponse } from '../common/ipc/response/AuthResponse';
import { AuthRequest } from '../common/ipc/request/AuthRequest';

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;


//
let idleTimer: IdleTimerAPI;

const handleCloseModal = () => {
  ipcRenderer.send('quit-app');
};

const handleSubmitAuthKeyModal = (key: string) => {
  const request: AuthRequest = {
    responseChannel: 'key-activation-response',
    param: key
  };
  ipcRenderer.send('key-activation', request);
};

const toggleCursor = () => {
  ipcRenderer.send('toggle-cursor');
};

const idleTimerProps: IdleTimerProps = {
  timeout: 5000, // 5 seconds,
  onIdle: () => toggleCursor(),
  onActive: () => toggleCursor(),
  startOnMount: true
};

function Renderer() {
  const [status, setStatus] = useState('');

  idleTimer = useIdleTimer(idleTimerProps);

  useEffect(() => {
    const handleResponse = (_: IpcRendererEvent, response: AuthResponse) => {
      setStatus(response.status);
    };
    ipcRenderer.once('check-authentication-response', handleResponse);
    ipcRenderer.once('key-activation-response', handleResponse);

    return () => {
      ipcRenderer.off('check-authentication-response', handleResponse);
      ipcRenderer.off('key-activation-response', handleResponse);
    };
  }, []);

  useEffect(() => {
    if (status === '') {
      const request: AuthRequest = {
        responseChannel: 'check-authentication-response'
      };
      ipcRenderer.send('check-authentication', request);
    }
  }, [status]);

  let elem;
  switch (status) {
    case AuthStatus.ACTIVATED:
      elem = <App
        idleTimer={idleTimer}/>;
      break;
    case AuthStatus.DEACTIVATED:
      elem = (
        <AuthModal
          onSubmit={handleSubmitAuthKeyModal}
          onClose={handleCloseModal}
        />
      );
      break;
    case AuthStatus.INVALID:
      elem = <ErrorModal onConfirm={handleCloseModal} />;
      break;
    default:
      break;
  }

  return (
    <>
      <ToastContainer
        position='bottom-center'
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        closeButton={false}
        transition={Slide}
        limit={1}
        style={{
          whiteSpace: 'pre-line',
          width: 'auto'
        }}
      />
      {elem}
    </>
  );
}

const doRender = () => {
  render(
    <AppContainer>
      <Renderer />
    </AppContainer>,
    document.getElementById('root')
  );
};

document.addEventListener('DOMContentLoaded', doRender);
