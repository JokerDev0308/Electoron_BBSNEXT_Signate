import { spawnSync, SpawnSyncReturns } from 'child_process';
import path from 'path';
import { RESOURCES_PATH } from '../../common/constants/path';
import ExitCode from '../enums/exit-code';


/**
 * @description Triggers daily at 12am by default. If system reboot task is not set in the task scheduler, set a task.
 * @returns void
 */
export const registerSystemRebootToTaskScheduler = (): void => {

  // ユーザ名のMD5ハッシュ値を取得する
  const crypto = require('crypto');
  const username = crypto.createHash('md5')
    .update(process.env.USERNAME)
    .digest('hex');
  const taskName1 = 'ElecomWinAppSignageSystemReboot';
  const taskName2 = 'ElecomWinAppSignageSystemReboot_' + username;


  const taskSchedulerPath: string = path.join(RESOURCES_PATH, 'task-scheduler');
  const exefilePath: string = path.join(taskSchedulerPath, 'reboot.bat');
  const workingDirectory: string = path.join(taskSchedulerPath, '\\');

  const triggerTime = '12am';
  const description = `Reboots the system every day`;

  const ACTION = `$action = New-ScheduledTaskAction \`
    -Execute '${exefilePath}'\`
    -WorkingDirectory '${workingDirectory}'`;
  const TRIGGER = `$trigger = New-ScheduledTaskTrigger \`
    -Daily \
    -At ${triggerTime}`;

  const REGISTER = `Register-ScheduledTask \`
    -Action $action \`
    -Trigger $trigger \`
    -TaskName '${taskName2}' \`
    -Description '${description}'`;

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
    console.log('Register Reboot Task in the Task Scheduler.');
    spawnSync(`${ACTION};${TRIGGER};${REGISTER}`, {
      shell: 'powershell',
      windowsVerbatimArguments: true
    });
  } else {
    console.log('Reboot Task is already registered');
  }
};

/**
 * @description Update System Reboot Task's time trigger.
 * @param triggerTime
 * @returns void
 */
export const updateSystemRebootTimeTrigger = (triggerTime: string): void => {


  // ユーザ名のMD5ハッシュ値を取得する
  const crypto = require('crypto');
  const username = crypto.createHash('md5')
    .update(process.env.USERNAME)
    .digest('hex');

  const taskName2 = 'ElecomWinAppSignageSystemReboot_' + username;
  const TRIGGER = `$trigger = New-ScheduledTaskTrigger \`
    -Daily -At ${triggerTime}`;
  const UPDATE = `Set-ScheduledTask \`
    -Trigger $trigger \`
    -TaskName '${taskName2}'`;

  console.log('Update Reboot Task in the Task Scheduler.');
  spawnSync(`${TRIGGER};${UPDATE}`, {
    shell: 'powershell',
    windowsVerbatimArguments: true
  });


};
