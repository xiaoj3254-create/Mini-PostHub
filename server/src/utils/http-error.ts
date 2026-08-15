export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (msg: string) => new HttpError(400, msg);
export const unauthorized = (msg = '未登录或登录已过期') => new HttpError(401, msg);
export const forbidden = (msg = '没有操作权限') => new HttpError(403, msg);
export const notFound = (msg = '资源不存在') => new HttpError(404, msg);
