import { IHttpResponse } from './IHttpResponse';

/**
 * Interface representing HTTP error responses.
 */
export interface IHttpErrors {
  /**
   * Creates an HTTP response with status code 400 (Bad Request).
   * @returns An HTTP response with status code 400.
   */
  badRequest(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 401 (Unauthorized).
   * @returns An HTTP response with status code 401.
   */
  unauthorized(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 403 (Forbidden).
   * @returns An HTTP response with status code 403.
   */
  forbidden(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 404 (Not Found).
   * @returns An HTTP response with status code 404.
   */
  notFound(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 409 (Conflict).
   * @returns An HTTP response with status code 409.
   */
  conflict(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 422 (Unprocessable Entity).
   * @returns An HTTP response with status code 422.
   */
  unprocessableEntity(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 429 (Too Many Requests).
   * @returns An HTTP response with status code 429.
   */
  tooManyRequests(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 500 (Internal Server Error).
   * @returns An HTTP response with status code 500.
   */
  internalServerError(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 503 (Service Unavailable).
   * @returns An HTTP response with status code 503.
   */
  serviceUnavailable(): IHttpResponse;
}