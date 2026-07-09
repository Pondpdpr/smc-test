import chalk from 'chalk';
import * as ErrorStackParser from 'error-stack-parser';
import { utilities, WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';

import type { AppConfig } from '@/infra/config';

import { HttpBaseException } from '../http/http.exception';
import myDayjs from './common.dayjs';

export function coreLogger(appConfig: AppConfig['app']) {
  return WinstonModule.createLogger({
    transports: [
      new transports.Console({
        level: 'warn',
        format: appConfig.enableJsonLog
          ? format.combine(
              format.timestamp(),
              format.json(), // Use JSON format for Promtail
            )
          : format.combine(
              utilities.format.nestLike('BE', {
                colors: true,
                prettyPrint: true,
              }),
            ),
      }),
    ],
  });
}

export function prettyLogError(error: Error) {
  let message = error?.message || 'noMessage';
  if (error instanceof HttpBaseException) {
    const baseException = error as HttpBaseException;

    message = baseException.key;
  }

  const timestamp = myDayjs().format('YYYY-MM-DD HH:mm:ss Z');

  // Header for the error log
  console.log('');
  console.log(chalk.bold.red('========= ERROR LOG ========='));
  console.log(chalk.cyan(`Timestamp: ${timestamp}`));
  console.log('');

  // Error message
  console.log(chalk.red.bold('Error: ') + chalk.yellowBright(message));

  console.log('');

  // Parse and format each frame in the stack trace
  const parsedStack = ErrorStackParser.parse(error);

  parsedStack.forEach((frame, index) => {
    console.log(
      chalk.blue(`#${index + 1}`) +
        chalk.gray(` Function: `) +
        chalk.green(frame.functionName || '(anonymous function)') +
        chalk.gray(`\n    Location: `) +
        chalk.blue(
          `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`,
        ) +
        chalk.gray(`\n    File: `) +
        chalk.magenta(frame.fileName) +
        chalk.gray(`\n    Line: `) +
        chalk.white(`${frame.lineNumber}:${frame.columnNumber}`),
    );
    console.log('');
  });

  // Footer
  console.log(chalk.bold.red('=============================\n'));
}
