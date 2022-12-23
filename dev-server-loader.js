import * as Babel from "@babel/core";
import fs from "node:fs/promises";
import * as TsNode from "ts-node";
import { URL } from "url";

const RESOLUTION_INVALIDATION_TIME = 1_000;
const RESOLUTION_CACHE             = new Map();

const tsconfig = await fs.readFile("./tsconfig.devServer.json", { encoding: "utf-8" }).then(JSON.parse);

const compiler = TsNode.create({
  compilerOptions: tsconfig.compilerOptions,
});

const tsNodeEsmHooks = TsNode.createEsmHooks(compiler);

let lastRefresh = new Date();

export async function resolve(specifier, context, nextResolve) {
  const result = await tsNodeEsmHooks.resolve(specifier, context, nextResolve);
  const child  = new URL(result.url);

  if (child.protocol === "nodejs:" || child.protocol === "node:" || child.pathname.includes("/node_modules/")) {
    return result;
  }

  if (child.pathname.includes("src/constants.ts")) {
    return result;
  }

  const now = new Date();

  if (now.getTime() - lastRefresh.getTime() < RESOLUTION_INVALIDATION_TIME) {
    lastRefresh        = now;
    const cachedResult = RESOLUTION_CACHE.get(child.href);
    if (!cachedResult) {
      const updatedResult = {
        ...result,
        url: child.href + "?update=" + now.toISOString(),
      };
      RESOLUTION_CACHE.set(child.href, updatedResult);
      return updatedResult;
    }
    return cachedResult;
  } else {
    RESOLUTION_CACHE.clear();
    lastRefresh         = now;
    const updatedResult = {
      ...result,
      url: child.href + "?update=" + now.toISOString(),
    };
    RESOLUTION_CACHE.set(child.href, updatedResult);
    return updatedResult;
  }
}

export async function load(url, context, defaultLoad) {
  const tsNode             = await tsNodeEsmHooks.load(url, context, defaultLoad);
  const { format, source } = tsNode;
  if (format === "module" || format === "commonjs") {
    const config = Babel.loadPartialConfig({
      filename: url.split("?update=")[0],
      plugins: ["babel-plugin-styled-components"],
      presets: [["@babel/preset-react", { runtime: "automatic" }]],
    });
    const { code } = await Babel.transformAsync(source, config.options);
    return { format, source: code, shortCircuit: true };
  }
  return tsNode;
}
