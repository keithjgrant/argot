import { ANSI_WHITE, ANSI_RED } from './ansiColors.ts';

export function print(message: string, color: string = ANSI_WHITE): void {
  console.log(`${color}${message}${ANSI_WHITE}\n`);
}

export function printError(message: string): void {
  console.error(`${ANSI_RED}argot: ${message}${ANSI_WHITE}\n`);
}
