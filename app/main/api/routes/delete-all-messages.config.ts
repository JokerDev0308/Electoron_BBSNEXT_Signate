import express from 'express';
import BaseRouteConfig from './base.config';
import { ApiResult } from '../../models/api';
import MessageController from '../../controller/message-controller';

export default class DeleteAllMessagesRouteConfig extends BaseRouteConfig {
  private controller: MessageController;

  constructor(app: express.Application, controller: MessageController) {
    super(app, 'DeleteAllMessagesRoute');
    this.controller = controller;
  }

  configureRoutes(): express.Application {
    this.app
      .route('/deleteAllMessages')
      .all(
        (
          request: express.Request,
          response: express.Response,
          next: express.NextFunction
        ) => {
          if (!this.authenticate(request, response)) return;
          next();
        }
      )
      .delete((_: express.Request, response: express.Response) => {
        this.controller
          .deleteAllMessages()
          .then(({ status, message }: ApiResult) =>
            response.status(status).send(message)
          )
          .catch((error) => {
            if (error.name === 'TransactionAlreadyStartedError') {
              this.conflictError(error, response);
            } else {
              this.internalError(error, response);
            }
          });
      });
    return this.app;
  }
}
