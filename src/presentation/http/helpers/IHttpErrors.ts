import { IHttpResponse } from './IHttpResponse';

/**
 * Interface representing HTTP error responses.
 */
export interface IHttpErrors {
  /**
   * Creates an HTTP response with status code 400 (Bad Request).
   * @returns An HTTP response with status code 400.
   */
  error_400(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 401 (Unauthorized).
   * @returns An HTTP response with status code 401.
   */
  error_401(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 403 (Forbidden).
   * @returns An HTTP response with status code 403.
   */
  error_403(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 404 (Not Found).
   * @returns An HTTP response with status code 404.
   */
  error_404(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 409 (Conflict).
   * @returns An HTTP response with status code 409.
   */
  error_409(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 422 (Unprocessable Entity).
   * @returns An HTTP response with status code 422.
   */
  error_422(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 429 (Too Many Requests).
   * @returns An HTTP response with status code 429.
   */
  error_429(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 500 (Internal Server Error).
   * @returns An HTTP response with status code 500.
   */
  error_500(): IHttpResponse;

  /**
   * Creates an HTTP response with status code 503 (Service Unavailable).
   * @returns An HTTP response with status code 503.
   */
  error_503(): IHttpResponse;
}