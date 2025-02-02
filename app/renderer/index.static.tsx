/**
 * This entry file is used to build static web page that can be consumed
 * by Android signage player and Admin app for content preview.
 * See `build:static` script command to check the build configurations.
 */
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { fetch as fetchPolyfill } from 'whatwg-fetch';
import AppStatic from './containers/App.static';
import { Content } from '../common/models/delivery';
import './app.global.css';

const doRender = (content: Content) => {
  render(
    <AppContainer>
      <AppStatic content={content} />
    </AppContainer>,
    document.getElementById('root')
  );
};

const showError = (error: string) => {
  render(
    <div style={{ color: 'white' }}>Failed to load content.json: {error}</div>,
    document.getElementById('root')
  );
};

const load = () => {
  const isPreview = window.location.hash.endsWith('#preview');
  if (isPreview) {
    window.addEventListener(
      'message',
      (event) => {
        if (!event.data.elecom) {
          return;
        }

        if (event.data.event === 'send-content') {
          // eslint-disable-next-line no-console
          console.warn(event.data.content);
          doRender(event.data.content);
        }
      },
      false
    );

    window.parent.postMessage(
      {
        elecom: true,
        event: 'player-ready',
      },
      '*'
    );
  } else {
    fetchPolyfill('content.json')
      .then((res: Response) => res.json())
      .then(doRender)
      .catch((err: Error) => showError(err.toString()));
  }
};

load();
