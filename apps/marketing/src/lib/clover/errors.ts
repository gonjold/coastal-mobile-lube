export class CloverApiError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'CloverApiError';
    this.status = status;
    this.body = body;
  }
}

export class CloverOAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloverOAuthError';
  }
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}
