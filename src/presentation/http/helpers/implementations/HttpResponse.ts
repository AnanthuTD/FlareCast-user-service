import { Service } from 'typedi'
import { IHttpResponse } from '../IHttpResponse'
import { injectable } from 'inversify'

/**
 * Implementation of IHttpResponse representing an HTTP response.
 */

@injectable()
export class HttpResponse implements IHttpResponse {
  /**
   * The HTTP status code of the response.
   */
  statusCode: number

  /**
   * The body of the HTTP response.
   */
  body: Record<string, string>

  /**
   * Initializes a new instance of the `HttpResponse` class.
   * @param statusCode - The HTTP status code of the response.
   * @param body - The body of the HTTP response.
   */
  constructor(statusCode: number, body: any) {
    this.statusCode = statusCode
    this.body = body
  }
}
