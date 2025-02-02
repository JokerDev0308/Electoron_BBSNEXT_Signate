import express from 'express';
import multer from 'multer';
import BaseRouteConfig from './base.config';
import ResponseStatus from '../../enums/response-status';
import { ApiResult } from '../../models/api';
import MessageController from '../../controller/message-controller';

export default class CreateMessageRouteConfig extends BaseRouteConfig {
  private controller: MessageController;

  constructor(app: express.Application, controller: MessageController) {
    super(app, 'CreateMessageRoute');
    this.controller = controller;
  }

  configureRoutes(): express.Application {
    const upload = multer({ storage: multer.memoryStorage() });
    this.app
      .route('/upload')
      .all(
        (
          req: express.Request,
          res: express.Response,
          next: express.NextFunction
        ) => {
          if (!this.authenticate(req, res)) return;
          next();
        }
      )
      .post(
        upload.any(),
        (request: express.Request, response: express.Response) => {
          if (!this.validateParams(request, response)) return;

          this.controller
            .createMessage(request)
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
        }
      );
    return this.app;
  }

  private validateParams = (
    request: express.Request,
    response: express.Response
  ): boolean => {
    const message = JSON.parse(request.body.message);

    if (!message.hostId) {
      response.status(ResponseStatus.BAD_REQUEST);
      response.send('Host ID not found');
      return false;
    }
    if (!message.uid) {
      response.status(ResponseStatus.BAD_REQUEST);
      response.send('UID not found');
      return false;
    }
    if (!message.serialNumber) {
      response.status(ResponseStatus.BAD_REQUEST);
      response.send('Serial number not found');
      return false;
    }
    return true;
  };
}
