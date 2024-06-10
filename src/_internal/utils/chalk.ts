import chalk from 'chalk'

// eslint-disable-next-line no-control-regex
export const trim = (txt: string) => txt.replace(/\u001b\[[0-9;]*m/g, '')

export const success = chalk.green
export const warn = chalk.hex('#FFA500')
export const info = chalk.hex('#77CFF5')
export const error = chalk.red
export const hop = chalk.hex('#F577F5')
export const cyan = chalk.cyan
export const bold = chalk.bold
export const dim = chalk.dim
