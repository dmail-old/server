import { createCancellationSource } from "@dmail/cancellation"
import { assert } from "@dmail/assert"
import { startServer } from "../index.js"

const fetch = import.meta.require("node-fetch")

const { cancel, token } = createCancellationSource()

const timer = setTimeout(() => {}, 100000000)
token.register(() => {
  clearTimeout(timer)
})
process.on("SIGINT", () => cancel("process interrupt"))

const { origin, agent, stop } = await startServer({
  cancellationToken: token,
  protocol: "http",
  ip: "",
  port: 8998,
  logLevel: "off",
  requestToResponse: () => {
    return {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "ok",
    }
  },
})
assert({ actual: origin, expected: "http://127.0.0.1:8998" })

const response = await fetch(origin, { agent })
const text = await response.text()
assert({ actual: text, expected: "ok" })

stop()
cancel("done")

// we should test than close/cancel server gives expected response client side
// test(() => {
// 	return startServer({
// 		url: "http://localhost:0",
// 	}).then(({ nodeServer }) => {
// 		const { child } = isolateRequestHandler(nodeServer, (request, response) => {})
// 		child.kill()
// 	})
// })
