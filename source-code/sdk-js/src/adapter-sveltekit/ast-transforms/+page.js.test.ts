import { describe, expect, test } from "vitest"
import { dedent } from "ts-dedent"
import { initTransformConfig } from "./test.utils.js"
import { transformPageJs } from "./+page.js.js"

// TODO: create test matrix for all possible combinations

describe("transformPageJs", () => {
	describe("root", () => {
		describe("empty file", () => {
			describe("lang-in-slug", () => {
				test("non-static", () => {
					const code = ""
					const config = initTransformConfig({ languageInUrl: true })
					const transformed = transformPageJs("", config, code, true)

					expect(transformed).toMatchInlineSnapshot(`
						"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
						import { initRootPageLoadWrapper, replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
						import { browser } from '$app/environment';
						export const load = initRootPageLoadWrapper({
						    browser
						}).use(() => { });"
					`)
				})

				test("static", () => {
					const code = ""
					const config = initTransformConfig({
						languageInUrl: true,
						isStatic: true,
					})
					const transformed = transformPageJs("", config, code, true)

					expect(transformed).toMatchInlineSnapshot(`
						"import { redirect } from '@sveltejs/kit';
						import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
						import { initRootPageLoadWrapper, replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
						import { browser } from '$app/environment';
						export const load = initRootPageLoadWrapper({
						    browser,
						    initDetectors: () => [navigatorDetector],
						    redirect: {
						        throwable: redirect,
						        getPath: ({ url }, language) => replaceLanguageInUrl(new URL(url), language),
						    },
						}).use(() => { });"
					`)
				})
			})
		})

		test("basic load function", () => {
			const code = dedent`
				export const load = async () => { };
			`
			const config = initTransformConfig({ languageInUrl: true })
			const transformed = transformPageJs("", config, code, true)

			expect(transformed).toMatchInlineSnapshot(`
				"import { initLocalStorageDetector, navigatorDetector } from '@inlang/sdk-js/detectors/client';
				import { initRootPageLoadWrapper, replaceLanguageInUrl } from '@inlang/sdk-js/adapter-sveltekit/shared';
				import { browser } from '$app/environment';
				export const load = initRootPageLoadWrapper({
				    browser
				}).use(async () => { });"
			`)
		})
	})

	describe("non-root", () => {
		test("should not do anything", () => {
			const code = ""
			const config = initTransformConfig()
			const transformed = transformPageJs("", config, code, false)
			expect(transformed).toEqual(code)
		})
	})

	test("should not do anything if '@inlang/sdk-js/no-transforms' import is detected", () => {
		const code = "import '@inlang/sdk-js/no-transforms'"
		const config = initTransformConfig()
		const transformed = transformPageJs("", config, code, true)
		expect(transformed).toEqual(code)
	})

	describe("'@inlang/sdk-js' imports", () => {
		test("should throw an error if an import from '@inlang/sdk-js' gets detected", () => {
			const code = "import { i } from '@inlang/sdk-js'"
			const config = initTransformConfig()
			expect(() => transformPageJs("", config, code, true)).toThrow()
		})

		test("should not thorw an error if an import from a suppath of '@inlang/sdk-js' gets detected", () => {
			const code =
				"import { initServerLoadWrapper } from '@inlang/sdk-js/adapter-sveltekit/server';"
			const config = initTransformConfig()
			expect(() => transformPageJs("", config, code, true)).not.toThrow()
		})
	})
})
