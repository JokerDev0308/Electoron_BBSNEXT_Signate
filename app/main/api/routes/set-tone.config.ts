import express from 'express';
import BaseRouteConfig from './base.config';
import { ApiResult } from '../../models/api';
import MessageController from '../../controller/message-controller';
import ResponseStatus from '../../enums/response-status';

export default class SetToneRouteConfig extends BaseRouteConfig {
  private controller: MessageController;

  constructor(app: express.Application, controller: MessageController) {
    super(app, 'SetToneRoute');
    this.controller = controller;
  }

  configureRoutes(): express.Application {
    this.app
      .route('/setTone')
      .put((request: express.Request, response: express.Response) => {
        if (!this.validateParams(request, response)) return;

        this.controller
          .setTone(request)
          .then(({ status, message }: ApiResult) =>
            response.status(status).send(message)
          )
          .catch((error) => this.internalError(error, response));
      });
    return this.app;
  }

  private validateParams = (
    request: express.Request,
    response: express.Response
  ): boolean => {
    const { toneEnabled } = request.query;

    if (
      !toneEnabled ||
      toneEnabled === 'undefined' ||
      toneEnabled === '1' ||
      toneEnabled === '0'
    ) {
      return true;
    }
    response.status(ResponseStatus.BAD_REQUEST);
    response.send('Error! Invalid value');
    return false;
  };
}
