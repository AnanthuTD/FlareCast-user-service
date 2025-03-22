import { IHttpResponse } from './IHttpResponse';

/**
 * Interface representing HTTP success responses.
 */
export interface IHttpSuccess {
  /**
   * Generates a success response with a status code of 200 (OK).
   * @param data Optional data to include in the response body.
   * @returns An HTTP response object.
   */
  success_200(data?: any): IHttpResponse;

  /**
   * Generates a success response with a status code of 201 (Created).
   * @param data Optional data to include in the response body.
   * @returns An HTTP response object.
   */
  success_201(data?: any): IHttpResponse;

  /**
   * Generates a success response with a status code of 202 (Accepted).
   * @param data Optional data to include in the response body.
   * @returns An HTTP response object.
   */
  success_202(data?: any): IHttpResponse;

  /**
   * Generates a success response with a status code of 204 (No Content).
   * @param data Optional data to include in the response body (typically null).
   * @returns An HTTP response object.
   */
  success_204(data?: any): IHttpResponse;

  /**
   * Generates a success response with a status code of 206 (Partial Content).
   * @param data Optional data to include in the response body.
   * @returns An HTTP response object.
   */
  success_206(data?: any): IHttpResponse;
}