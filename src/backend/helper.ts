import { BrowserWindow, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import { LogFunctions } from 'electron-log';
import prettyMS from 'pretty-ms';
import { logger } from './logger';

export function getWindowFromEvent(event: IpcMainEvent | IpcMainInvokeEvent) {
  return BrowserWindow.getAllWindows().find(
    (win) => win.webContents.id === event.sender.id,
  );
}

export function runFnAndLogDuration<T>({
  fn,
  name,
  logFn = logger.info,
  logArgs,
}: {
  fn: () => T;
  name: string;
  logFn?: LogFunctions['info'];
  logArgs?: Record<any, any>;
}): T {
  const startTime = Date.now();
  logFn(`${name} starting`, logArgs);
  const result = fn();

  // TODO - fix this type casting
  if (typeof (result as Promise<unknown>)?.finally === 'function') {
    return (result as Promise<unknown>).finally(() => {
      logFn(`File parsed in ${prettyMS(Date.now() - startTime)}`, logArgs);
    }) as T;
  }

  logFn(`${name} in ${prettyMS(Date.now() - startTime)}`, logArgs);

  return result;
}
