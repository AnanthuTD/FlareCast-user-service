import { Service } from "typedi";
import { IHttpErrors } from "../IHttpErrors";
import { IHttpResponse } from "../IHttpResponse";

/**
 * Implementation of the IHttpErrors interface for generating HTTP error responses.
 */
@Service()
export class HttpErrors implements IHttpErrors {
  error_400(): IHttpResponse {
    return { statusCode: 400, body: { message: "Bad Request" } };
  }

  error_401(): IHttpResponse {
    return { statusCode: 401, body: { message: "Unauthorized" } };
  }

  error_403(): IHttpResponse {
    return { statusCode: 403, body: { message: "Forbidden" } };
  }

  error_404(): IHttpResponse {
    return { statusCode: 404, body: { message: "Not Found" } };
  }

  error_409(): IHttpResponse {
    return { statusCode: 409, body: { message: "Conflict" } };
  }

  error_422(): IHttpResponse {
    return { statusCode: 422, body: { message: "Unprocessable Entity" } };
  }

  error_429(): IHttpResponse {
    return { statusCode: 429, body: { message: "Too Many Requests" } };
  }

  error_500(): IHttpResponse {
    return { statusCode: 500, body: { message: "Internal Server Error" } };
  }

  error_503(): IHttpResponse {
    return { statusCode: 503, body: { message: "Service Unavailable" } };
  }
}