import { ANSI_WHITE, ANSI_RED } from './ansiColors.ts';

export function print(message: string, color: string = ANSI_WHITE): void {
  console.log(`${color}${message}${ANSI_WHITE}\n`);
}

export function printError(error: unknown): void {
  const isError = error instanceof Error;
  const message = isError ? `${error.name}: ${error.message}` : error;

  console.error(`${ANSI_RED}argot: ${message}${ANSI_WHITE}\n`);

  if (isError && process.argv.includes('--verbose')) {
    console.log(error);
  }
}
