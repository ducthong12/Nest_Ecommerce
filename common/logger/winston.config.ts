import { transports, format } from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import 'winston-daily-rotate-file';

export const createLoggerConfig = (appName: string) => {
  return {
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.json(),
    ),
    transports: [
      //   new transports.Console({
      //     format: format.combine(
      //       format.timestamp(),
      //       format.ms(),
      //       nestWinstonModuleUtilities.format.nestLike(appName, {
      //         colors: true,
      //         prettyPrint: true,
      //       }),
      //     ),
      //   }),

      new transports.DailyRotateFile({
        dirname: `logs/${appName}/error`,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
      }),

      new transports.DailyRotateFile({
        dirname: `logs/${appName}/error`,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'warn',
      }),

      new transports.DailyRotateFile({
        dirname: `logs/${appName}/combined`,
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
      }),
    ],
  };
};
