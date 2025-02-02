import { app } from 'electron';
import path from 'path';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import { RESOURCES_PATH } from '../../common/constants/path';
import ExitCode from '../enums/exit-code';


/**
 * @description If no task has been set in the task scheduler, set a task.
 * @returns void
 */
const registerAppMonitorTask = (): void => {

  // ユーザ名のMD5ハッシュ値を取得する
  const crypto = require('crypto');
  const username = crypto.createHash('md5')
    .update(process.env.USERNAME)
    .digest('hex');
  const taskName1 = 'ElecomWinAppSignageAliveMonitor';
  const taskName2 = 'ElecomWinAppSignageAliveMonitor_' + username;

  //
  const argAppName: string = app.getName();
  const argExePath: string = app.getPath('exe');
  const taskSchedulerPath: string = path.join(RESOURCES_PATH, 'task-scheduler');
  const exefilePath: string = path.join(taskSchedulerPath, 'execute.vbs');
  const workingDirectory: string = path.join(taskSchedulerPath, '\\');

  const discription =
    'The process is checked every minute, and if it does not exist, it is started.';

  const USERINFO = `$userinfo = [System.Security.Principal.WindowsIdentity]::GetCurrent()`;
  const ACTION = `$action = New-ScheduledTaskAction \`
    -Execute '${exefilePath}' \`
    -Argument '${argAppName} """"${argExePath}""""' \`
    -WorkingDirectory '${workingDirectory}'`;
  const TRIGGER = `$trigger = New-ScheduledTaskTrigger \`
    -AtLogOn \
    -User $userinfo.name`;
  const REGISTER = `Register-ScheduledTask \`
    -Action $action \`
    -Trigger $trigger \`
    -TaskName '${taskName2}' \`
    -Description '${discription}'`;


  // ユーザ名が付与されていないタスクを削除する
  const UNREGISTER1 = `Unregister-ScheduledTask -TaskName '${taskName1}' -Confirm:$false`;
  spawnSync(`${UNREGISTER1}`, {
    shell: 'powershell',
    windowsVerbatimArguments: true
  });

  // ユーザ名が付与されているタスクが存在しているか
  const ps: SpawnSyncReturns<Buffer> = spawnSync(
    `Get-ScheduledTask -TaskName "${taskName2}"`,
    {
      shell: 'powershell',
      windowsVerbatimArguments: true
    }
  );

  const statusNumber: number | null = ps.status;
  if (statusNumber === ExitCode.ERROR) {
    // タスクが存在しないので登録する
    spawnSync(`${USERINFO};${ACTION};${TRIGGER};${REGISTER}`, {
      shell: 'powershell',
      windowsVerbatimArguments: true
    });
  }

  // タスクを実行する
  spawnSync(`Start-ScheduledTask -TaskName "${taskName2}"`, {
    shell: 'powershell'
  });
  // // タスクを削除する
  // spawnSync(`${UNREGISTER1}`, {
  //   shell: 'powershell',
  //   windowsVerbatimArguments: true
  // });
  // spawnSync(`${UNREGISTER2}`, {
  //   shell: 'powershell',
  //   windowsVerbatimArguments: true
  // });
  //
  // // タスクを登録する
  // spawnSync(`${USERINFO};${ACTION};${TRIGGER};${REGISTER}`, {
  //   shell: 'powershell',
  //   windowsVerbatimArguments: true
  // });
  //
  // // タスクを実行する
  // spawnSync(`Start-ScheduledTask -TaskName "${taskName2}"`, {
  //   shell: 'powershell'
  // });

};

export default registerAppMonitorTask;
