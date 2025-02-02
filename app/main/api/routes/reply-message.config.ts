import express from 'express';
import BaseRouteConfig from './base.config';
import ResponseStatus from '../../enums/response-status';
import { ApiResult } from '../../models/api';
import MessageController from '../../controller/message-controller';

export default class ReplyMessageRouteConfig extends BaseRouteConfig {
  private controller: MessageController;

  constructor(app: express.Application, controller: MessageController) {
    super(app, 'ReplyMessageRoute');
    this.controller = controller;
  }

  configureRoutes(): express.Application {
    this.app
      .route('/replyMessage')
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
      .patch((request: express.Request, response: express.Response) => {
        if (!this.validateParams(request, response)) return;

        this.controller
          .replyMessage(request)
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

  private validateParams = (
    request: express.Request,
    response: express.Response
  ): boolean => {
    const { id } = request.query;
    if (!id) {
      response.status(ResponseStatus.BAD_REQUEST);
      response.send('Message ID not found');
      return false;
    }
    return true;
  };
}
