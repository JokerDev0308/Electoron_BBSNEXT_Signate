import express from 'express';
import BaseRouteConfig from './base.config';
import ResponseStatus from '../../enums/response-status';
import { ApiResult } from '../../models/api';
import MessageController from '../../controller/message-controller';

export default class GetMessagesRouteConfig extends BaseRouteConfig {
  private controller: MessageController;

  constructor(app: express.Application, controller: MessageController) {
    super(app, 'GetMessagesRoute');
    this.controller = controller;
  }

  configureRoutes(): express.Application {
    this.app
      .route('/getMessages')
      .get((request: express.Request, response: express.Response) => {
        if (!this.validateParams(request, response)) return;

        this.controller
          .fetchMessages(request)
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
    // page and limit should come together
    const reqLimit = request.query.limit;
    const reqPage = request.query.page;

    if (
      (reqPage == null && reqLimit != null) ||
      (reqLimit == null && reqPage != null)
    ) {
      response.status(ResponseStatus.BAD_REQUEST);
      response.send('Error! Either page or limit parameter is missing');
      return false;
    }
    return true;
  };
}
