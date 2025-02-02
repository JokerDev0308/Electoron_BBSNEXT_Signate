import express from 'express';
import BaseRouteConfig from './base.config';
import { ApiResult } from '../../models/api';
import MessageController from '../../controller/message-controller';

export default class GetAllMessagesRouteConfig extends BaseRouteConfig {
  private controller: MessageController;

  constructor(app: express.Application, controller: MessageController) {
    super(app, 'GetAllMessagesRoute');
    this.controller = controller;
  }

  configureRoutes(): express.Application {
    this.app
      .route('/getAllMessages')
      .get((_: express.Request, response: express.Response) => {
        this.controller
          .fetchAllMessages()
          .then(({ status, message }: ApiResult) =>
            response.status(status).send(message)
          )
          .catch((error) => this.internalError(error, response));
      });
    return this.app;
  }
}
