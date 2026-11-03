export type AppErrorOptions = {
  statusCode: number;
  code: number | string;
  message: string;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: number | string;

  constructor(options: AppErrorOptions) {
    super(options.message);

    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
