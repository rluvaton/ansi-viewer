import assert from 'node:assert';
import log from 'electron-log';

log.initialize({ preload: true, spyRendererConsole: true });

export function setLogDest(logDest: string, logFilePath: string | undefined) {
  if (logDest === 'stdout' || logDest === 'console') {
    log.transports.console.level = 'verbose';
  }

  if (logDest === 'file') {
    assert.ok(logFilePath, 'log-file-path is required when log-dest is file');
    log.transports.file.level = 'verbose';
    log.transports.file.resolvePathFn = () => logFilePath;
  }
}
export const logger = log;
