import { IpcChannel } from '../IpcChannel';
import { AuthRequest } from '../../../common/ipc/request/AuthRequest';
import { AuthResponse } from '../../../common/ipc/response/AuthResponse';
import AuthStatus from '../../enums/auth-status';
import { validateKey } from '../../providers/authentication';

export default class ActivationChannel implements IpcChannel {
  readonly name = 'key-activation';

  handle = async (event: Electron.IpcMainEvent, request: AuthRequest) => {
    const key = request.param;
    const response: AuthResponse = { status: AuthStatus.INVALID };
    if (key && (await validateKey(key))) {
      response.status = AuthStatus.ACTIVATED;
    }
    event.reply(request.responseChannel, response);
  };
}
