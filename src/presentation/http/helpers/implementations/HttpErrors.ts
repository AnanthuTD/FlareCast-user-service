import { Service } from "typedi";
import { IHttpErrors } from "../IHttpErrors";
import { IHttpResponse } from "../IHttpResponse";
import { injectable } from "inversify";

/**
 * Implementation of the IHttpErrors interface for generating HTTP error responses.
 */

@injectable()
export class HttpErrors implements IHttpErrors {
  badRequest(): IHttpResponse {
    return { statusCode: 400, body: { message: "Bad Request" } };
  }

  unauthorized(): IHttpResponse {
    return { statusCode: 401, body: { message: "Unauthorized" } };
  }

  forbidden(): IHttpResponse {
    return { statusCode: 403, body: { message: "Forbidden" } };
  }

  notFound(): IHttpResponse {
    return { statusCode: 404, body: { message: "Not Found" } };
  }

  conflict(): IHttpResponse {
    return { statusCode: 409, body: { message: "Conflict" } };
  }

  unprocessableEntity(): IHttpResponse {
    return { statusCode: 422, body: { message: "Unprocessable Entity" } };
  }

  tooManyRequests(): IHttpResponse {
    return { statusCode: 429, body: { message: "Too Many Requests" } };
  }

  internalServerError(): IHttpResponse {
    return { statusCode: 500, body: { message: "Internal Server Error" } };
  }

  serviceUnavailable(): IHttpResponse {
    return { statusCode: 503, body: { message: "Service Unavailable" } };
  }
}