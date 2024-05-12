import log from 'electron-log';

// log.transports.file.resolvePathFn = () => path.join(process.cwd(), "/log.log");
// log.transports.file.level = "verbose";

log.initialize({ preload: true, spyRendererConsole: true });

export function setLogDest(logDest: string) {
  if (logDest === 'stdout' || logDest === 'console') {
    log.transports.console.level = 'verbose';
  }
}
export const logger = log;
