import type { Context } from './context.js'
import { errors } from './errors.js'
import type { ErrorRequestState, RequestMethod } from './types.js'

export type DelayFn = (state: ErrorRequestState) => number
export type ValidateFn = (state: ErrorRequestState, options: RetryOptions) => boolean | undefined

export interface RetryOptions {
  limit: number
  methods: RequestMethod[]
  statusCodes: number[]
  codes: string[]
  delay: DelayFn
  validate: ValidateFn
}

export interface UserRetryOptions extends Partial<RetryOptions> {}

// TODO: handle retry-after header
const delay: DelayFn = ({ retryCount }) => {
  return 0.1 * (2 ** (retryCount - 1)) * 1000
}

const validate: ValidateFn = ({ retryCount, error }, options) => {
  if (retryCount > options.limit) {
    return false
  }

  if (!options.methods.includes(error.config.method)) {
    return false
  }

  const status = error.response?.status ?? -1

  return options.statusCodes.includes(status) || options.codes.includes(error.code)
}

const defaultOptions: RetryOptions = {
  limit: 2,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  statusCodes: [408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 530],
  codes: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'UND_ERR_SOCKET'],
  delay,
  validate,
}

export class Retry {
  private options: RetryOptions

  constructor(options: UserRetryOptions = {}) {
    this.options = {
      ...defaultOptions,
      ...options,
    }
  }

  async run<T>(fn: () => T, context: Context): Promise<Awaited<T>> {
    while (true) {
      try {
        return await fn()
      } catch (error) {
        context.error = error as errors['RequestError']
        context.retryCount++

        if (!(error instanceof errors.RequestError) ||
          context.controller.signal.aborted ||
          !this.validate(context)
        ) {
          throw error
        }

        const delayMs = this.options.delay(context as ErrorRequestState)
        const time = Date.now() + delayMs

        if (context.timeoutsAt && time > context.timeoutsAt) {
          throw error
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs))

        if (context.controller.signal.aborted) {
          throw error
        }
      }
    }
  }

  private validate(context: Context) {
    const result = this.options.validate(context as ErrorRequestState, this.options)

    if (typeof result === 'boolean') {
      return result
    }

    // Fallback to default validation if custom validate returned undefined
    return validate(context as ErrorRequestState, this.options)!
  }
}
