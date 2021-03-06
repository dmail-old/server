/* eslint-disable import/max-dependencies */
import { createServer as createNodeServer, STATUS_CODES } from "http"
import { createServer as createNodeSecureServer, Agent as SecureAgent } from "https"
import { memoizeOnce } from "@dmail/helper"
import {
  createCancellationToken,
  createOperation,
  createStoppableOperation,
} from "@dmail/cancellation"
import {
  registerProcessInterruptCallback,
  registerUnadvisedProcessCrashCallback,
  registerUngaranteedProcessTeardown,
} from "@dmail/process-signals"
import { hrefToOrigin } from "@jsenv/href"
import { createLogger } from "@jsenv/logger"
import { trackConnections, trackClients, trackRequestHandlers } from "../trackers/index.js"
import { nodeRequestToRequest } from "../request/index.js"
import { populateNodeResponse, composeResponseHeaders, composeResponse } from "../response/index.js"
import { colorizeResponseStatus } from "./colorizeResponseStatus.js"
import { originAsString } from "./originAsString.js"
import { listen, stopListening } from "./listen.js"
import {
  STOP_REASON_INTERNAL_ERROR,
  STOP_REASON_PROCESS_SIGINT,
  STOP_REASON_PROCESS_BEFORE_EXIT,
  STOP_REASON_PROCESS_HANGUP_OR_DEATH,
  STOP_REASON_PROCESS_DEATH,
  STOP_REASON_PROCESS_EXIT,
  STOP_REASON_NOT_SPECIFIED,
} from "./stop-reasons.js"
import * as defaultSignature from "./signature.js"

const killPort = import.meta.require("kill-port")

const STATUS_TEXT_INTERNAL_ERROR = "internal error"

export const defaultAccessControlAllowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
export const defaultAccessControlAllowedHeaders = ["x-requested-with"]

export const startServer = async ({
  cancellationToken = createCancellationToken(),
  protocol = "http",
  ip = "127.0.0.1",
  port = 0, // assign a random available port
  forcePort = false,
  // when port is https you must provide { privateKey, certificate } under signature
  signature = defaultSignature,
  stopOnSIGINT = true,
  // auto close the server when the process exits
  stopOnExit = true,
  // auto close when server respond with a 500
  stopOnInternalError = false,
  // auto close the server when an uncaughtException happens
  stopOnCrash = false,
  keepProcessAlive = true,
  requestToResponse = () => null,
  accessControlAllowedOrigins = [],
  accessControlAllowRequestOrigin = false,
  accessControlAllowedMethods = defaultAccessControlAllowedMethods,
  accessControlAllowRequestMethod = false,
  accessControlAllowedHeaders = defaultAccessControlAllowedHeaders,
  accessControlAllowRequestHeaders = false,
  accessControlAllowCredentials = false,
  // by default OPTIONS request can be cache for a long time, it's not going to change soon ?
  // we could put a lot here, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
  accessControlMaxAge = 600,
  logLevel,
  sendInternalErrorStack = false,
  internalErrorToResponseProperties = (error) => {
    const body = error
      ? JSON.stringify({
          code: error.code || "UNKNOWN_ERROR",
          ...(sendInternalErrorStack ? { stack: error.stack } : {}),
        })
      : JSON.stringify({ code: "VALUE_THROWED", value: error })

    return {
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
      },
      body,
    }
  },
  startedCallback = () => {},
  stoppedCallback = () => {},
} = {}) => {
  if (port === 0 && forcePort) throw new Error(`no need to pass forcePort when port is 0`)
  if (protocol !== "http" && protocol !== "https")
    throw new Error(`protocol must be http or https, got ${protocol}`)
  // https://github.com/nodejs/node/issues/14900
  if (ip === "0.0.0.0" && process.platform === "win32")
    throw new Error(`listening ${ip} not available on window`)

  const logger = createLogger({ logLevel })

  if (forcePort) {
    await createOperation({
      cancellationToken,
      start: () => killPort(port),
    })
  }

  const { nodeServer, agent } = getNodeServerAndAgent({ protocol, signature })

  // https://nodejs.org/api/net.html#net_server_unref
  if (!keepProcessAlive) {
    nodeServer.unref()
  }

  let status = "starting"

  const { registerCleanupCallback, cleanup } = createTracker()

  const connectionTracker = trackConnections(nodeServer)
  // opened connection must be shutdown before the close event is emitted
  registerCleanupCallback(connectionTracker.stop)

  const clientTracker = trackClients(nodeServer)
  registerCleanupCallback((reason) => {
    let responseStatus
    if (reason === STOP_REASON_INTERNAL_ERROR) {
      responseStatus = 500
      // reason = 'shutdown because error'
    } else {
      responseStatus = 503
      // reason = 'unavailable because closing'
    }
    clientTracker.stop({ status: responseStatus, reason })
  })

  const requestHandlerTracker = trackRequestHandlers(nodeServer)
  // ensure we don't try to handle request while server is closing
  registerCleanupCallback(requestHandlerTracker.stop)

  let stoppedResolve
  const stoppedPromise = new Promise((resolve) => {
    stoppedResolve = resolve
  })
  const stop = memoizeOnce(async (reason = STOP_REASON_NOT_SPECIFIED) => {
    status = "closing"
    logger.info(`server stopped because ${reason}`)

    await cleanup(reason)
    await stopListening(nodeServer)
    status = "stopped"
    stoppedCallback({ reason })
    stoppedResolve(reason)
  })
  const startOperation = createStoppableOperation({
    cancellationToken,
    start: () => listen({ cancellationToken, server: nodeServer, port, ip }),
    stop: (_, reason) => stop(reason),
  })

  if (stopOnCrash) {
    const unregister = registerUnadvisedProcessCrashCallback((reason) => {
      stop(reason.value)
    })
    registerCleanupCallback(unregister)
  }

  if (stopOnInternalError) {
    const unregister = requestHandlerTracker.add((nodeRequest, nodeResponse) => {
      if (
        nodeResponse.statusCode === 500 &&
        nodeResponse.statusMessage === STATUS_TEXT_INTERNAL_ERROR
      ) {
        stop(STOP_REASON_INTERNAL_ERROR)
      }
    })
    registerCleanupCallback(unregister)
  }

  if (stopOnExit) {
    const unregister = registerUngaranteedProcessTeardown((tearDownReason) => {
      stop(
        {
          beforeExit: STOP_REASON_PROCESS_BEFORE_EXIT,
          hangupOrDeath: STOP_REASON_PROCESS_HANGUP_OR_DEATH,
          death: STOP_REASON_PROCESS_DEATH,
          exit: STOP_REASON_PROCESS_EXIT,
        }[tearDownReason],
      )
    })
    registerCleanupCallback(unregister)
  }

  if (stopOnSIGINT) {
    const unregister = registerProcessInterruptCallback(() => {
      stop(STOP_REASON_PROCESS_SIGINT)
    })
    registerCleanupCallback(unregister)
  }

  port = await startOperation
  status = "opened"
  const origin = originAsString({ protocol, ip, port })
  logger.info(`server started at ${origin}`)
  startedCallback({ origin })

  // nodeServer.on("upgrade", (request, socket, head) => {
  //   // when being requested using a websocket
  //   // we could also answr to the request ?
  //   // socket.end([data][, encoding])

  //   console.log("upgrade", { head, request })
  //   console.log("socket", { connecting: socket.connecting, destroyed: socket.destroyed })
  // })

  requestHandlerTracker.add(async (nodeRequest, nodeResponse) => {
    const { request, response, error } = await generateResponseDescription({
      nodeRequest,
      origin,
    })

    if (
      request.method !== "HEAD" &&
      response.headers["content-length"] > 0 &&
      response.body === ""
    ) {
      logger.error(
        createContentLengthMismatchError(
          `content-length header is ${response.headers["content-length"]} but body is empty`,
        ),
      )
    }

    logger.info(`${request.method} ${request.origin}${request.ressource}`)
    if (error) {
      logger.error(error)
    }
    logger.info(`${colorizeResponseStatus(response.status)} ${response.statusText}`)
    populateNodeResponse(nodeResponse, response, {
      ignoreBody: request.method === "HEAD",
    })
  })

  const corsEnabled = accessControlAllowRequestOrigin || accessControlAllowedOrigins.length
  // here we check access control options to throw or warn if we find strange values

  const generateResponseDescription = async ({ nodeRequest, origin }) => {
    const request = nodeRequestToRequest(nodeRequest, origin)

    nodeRequest.on("error", (error) => {
      logger.error("error on", request.ressource, error)
    })

    const responsePropertiesToResponse = ({
      status = 501,
      statusText = statusToStatusText(status),
      headers = {},
      body = "",
      bodyEncoding,
    }) => {
      if (corsEnabled) {
        const accessControlHeaders = generateAccessControlHeaders({
          request,
          accessControlAllowedOrigins,
          accessControlAllowRequestOrigin,
          accessControlAllowedMethods,
          accessControlAllowRequestMethod,
          accessControlAllowedHeaders,
          accessControlAllowRequestHeaders,
          accessControlAllowCredentials,
          accessControlMaxAge,
        })

        return {
          status,
          statusText,
          headers: composeResponseHeaders(headers, accessControlHeaders),
          body,
          bodyEncoding,
        }
      }

      return {
        status,
        statusText,
        headers,
        body,
        bodyEncoding,
      }
    }

    try {
      if (corsEnabled && request.method === "OPTIONS") {
        return {
          request,
          response: responsePropertiesToResponse({
            status: 200,
            headers: {
              "content-length": 0,
            },
          }),
        }
      }

      const responseProperties = await requestToResponse(request)
      return {
        request,
        response: responsePropertiesToResponse(responseProperties),
      }
    } catch (error) {
      return {
        request,
        response: composeResponse(
          responsePropertiesToResponse({
            status: 500,
            statusText: STATUS_TEXT_INTERNAL_ERROR,
            headers: {
              // ensure error are not cached
              "cache-control": "no-store",
              "content-type": "text/plain",
            },
          }),
          internalErrorToResponseProperties(error),
        ),
        error,
      }
    }
  }

  return {
    getStatus: () => status,
    origin,
    nodeServer,
    // TODO: remove agent
    agent,
    stop,
    stoppedPromise,
  }
}

const createTracker = () => {
  const callbackArray = []

  const registerCleanupCallback = (callback) => {
    if (typeof callback !== "function")
      throw new TypeError(`callback must be a function
callback: ${callback}`)
    callbackArray.push(callback)
  }

  const cleanup = async (reason) => {
    const localCallbackArray = callbackArray.slice()
    await Promise.all(localCallbackArray.map((callback) => callback(reason)))
  }

  return { registerCleanupCallback, cleanup }
}

const statusToStatusText = (status) => STATUS_CODES[status] || "not specified"

const getNodeServerAndAgent = ({ protocol, signature }) => {
  if (protocol === "http") {
    return {
      nodeServer: createNodeServer(),
      agent: global.Agent,
    }
  }

  if (protocol === "https") {
    const { privateKey, certificate } = signature
    if (!privateKey || !certificate) {
      throw new Error(`missing signature for https server`)
    }

    return {
      nodeServer: createNodeSecureServer({
        key: privateKey,
        cert: certificate,
      }),
      agent: new SecureAgent({
        rejectUnauthorized: false, // allow self signed certificate
      }),
    }
  }

  throw new Error(`unsupported protocol ${protocol}`)
}

const createContentLengthMismatchError = (message) => {
  const error = new Error(message)
  error.code = "CONTENT_LENGTH_MISMATCH"
  error.name = error.code
  return error
}

// https://www.w3.org/TR/cors/
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
const generateAccessControlHeaders = ({
  request: { headers },
  accessControlAllowedOrigins,
  accessControlAllowRequestOrigin,
  accessControlAllowedMethods,
  accessControlAllowRequestMethod,
  accessControlAllowedHeaders,
  accessControlAllowRequestHeaders,
  accessControlAllowCredentials,
  // by default OPTIONS request can be cache for a long time, it's not going to change soon ?
  // we could put a lot here, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
  accessControlMaxAge = 600,
} = {}) => {
  const vary = []

  const allowedOriginArray = [...accessControlAllowedOrigins]
  if (accessControlAllowRequestOrigin) {
    if ("origin" in headers && headers.origin !== "null") {
      allowedOriginArray.push(headers.origin)
      vary.push("origin")
    } else if ("referer" in headers) {
      allowedOriginArray.push(hrefToOrigin(headers.referer))
      vary.push("referer")
    } else {
      allowedOriginArray.push("*")
    }
  }

  const allowedMethodArray = [...accessControlAllowedMethods]
  if (accessControlAllowRequestMethod && "access-control-request-method" in headers) {
    const requestMethodName = headers["access-control-request-method"]
    if (!allowedMethodArray.includes(requestMethodName)) {
      allowedMethodArray.push(requestMethodName)
      vary.push("access-control-request-method")
    }
  }

  const allowedHeaderArray = [...accessControlAllowedHeaders]
  if (accessControlAllowRequestHeaders && "access-control-request-headers" in headers) {
    const requestHeaderNameArray = headers["access-control-request-headers"].split(", ")
    requestHeaderNameArray.forEach((headerName) => {
      const headerNameLowerCase = headerName.toLowerCase()
      if (!allowedHeaderArray.includes(headerNameLowerCase)) {
        allowedHeaderArray.push(headerNameLowerCase)
        if (!vary.includes("access-control-request-headers")) {
          vary.push("access-control-request-headers")
        }
      }
    })
  }

  return {
    "access-control-allow-origin": allowedOriginArray.join(", "),
    "access-control-allow-methods": allowedMethodArray.join(", "),
    "access-control-allow-headers": allowedHeaderArray.join(", "),
    ...(accessControlAllowCredentials ? { "access-control-allow-credentials": true } : {}),
    "access-control-max-age": accessControlMaxAge,
    ...(vary.length ? { vary: vary.join(", ") } : {}),
  }
}
