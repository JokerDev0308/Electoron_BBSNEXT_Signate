import express from 'express';
import CreateMessageRouteConfig from './routes/create-message.config';
import GetMessagesRouteConfig from './routes/get-messages.config';
import GetAllMessagesRouteConfig from './routes/get-all-messages.config';
import DeleteMessageRouteConfig from './routes/delete-message.config';
import DeleteAllMessagesRouteConfig from './routes/delete-all-messages.config';
import OmitMessageRouteConfig from './routes/omit-message.config';
import UnOmitMessageRouteConfig from './routes/unomit-message.config';
import UpdateMessageRouteConfig from './routes/update-message.config';
import ReplyMessageRouteConfig from './routes/reply-message.config';
import SetToneRouteConfig from './routes/set-tone.config';
import MessageController from '../controller/message-controller';

export default function addRoutes(server: express.Application) {
  const messageController = new MessageController();
  return [
    new CreateMessageRouteConfig(server, messageController),
    new GetMessagesRouteConfig(server, messageController),
    new GetAllMessagesRouteConfig(server, messageController),
    new DeleteMessageRouteConfig(server, messageController),
    new DeleteAllMessagesRouteConfig(server, messageController),
    new OmitMessageRouteConfig(server, messageController),
    new UnOmitMessageRouteConfig(server, messageController),
    new UpdateMessageRouteConfig(server, messageController),
    new ReplyMessageRouteConfig(server, messageController),
    new SetToneRouteConfig(server, messageController),
  ];
}
