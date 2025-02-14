import { privateEnv } from "@inlang/env-variables"
import { decryptAccessToken } from "../services/auth/index.server.js"
import express from "express"
import { telefunc, config } from "telefunc"
import fastGlob from "fast-glob"

export const router = express.Router()

const rootPath = new URL("../..", import.meta.url).pathname

// https://telefunc.com/disableNamingConvention
config.disableNamingConvention = true
config.root = rootPath
config.telefuncFiles = await fastGlob(rootPath + "/**/*.telefunc.ts")

// serving telefunc https://telefunc.com/
router.all(
	"/_telefunc",
	// Parse & make HTTP request body available at `req.body` (required by telefunc)
	express.text(),
	// handle the request
	(request, response, next) => {
		// decrypting the access token if it exists
		if (request.session?.encryptedAccessToken) {
			decryptAccessToken({
				jwe: request.session.encryptedAccessToken,
				JWE_SECRET_KEY: privateEnv.JWE_SECRET,
			})
				.then((accessToken) =>
					telefunc({
						context: { githubAccessToken: accessToken },
						url: request.originalUrl,
						method: request.method,
						body: request.body,
					}),
				)
				.then(({ body, statusCode, contentType }) => {
					response.status(statusCode).type(contentType).send(body)
				})
				.catch(next)
		} else {
			telefunc({
				context: { githubAccessToken: undefined },
				url: request.originalUrl,
				method: request.method,
				body: request.body,
			})
				.then(({ body, statusCode, contentType }) => {
					response.status(statusCode).type(contentType).send(body)
				})
				.catch(next)
		}
	},
)
