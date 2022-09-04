import * as Babel from "@babel/core";
import fs from "node:fs/promises";
import * as TsNode from "ts-node";
import { URL } from "url";

const tsconfig = await fs.readFile("./tsconfig.devServer.json", { encoding: "utf-8" }).then(JSON.parse);

const compiler = TsNode.create({
  compilerOptions: tsconfig.compilerOptions,
});

const tsNodeEsmHooks = TsNode.createEsmHooks(compiler);

export async function resolve(specifier, context, nextResolve) {
  const result = await tsNodeEsmHooks.resolve(specifier, context, nextResolve);
  const child  = new URL(result.url);

  if (child.protocol === "nodejs:" || child.protocol === "node:" || child.pathname.includes("/node_modules/")) {
    return result;
  }

  if (child.pathname.includes("src/server/constants.ts")) {
    return result;
  }

  return {
    ...result,
    url: child.href + "?update=" + new Date().toISOString(),
  };
}

export async function load(url, context, defaultLoad) {
  const tsNode             = await tsNodeEsmHooks.load(url, context, defaultLoad);
  const { format, source } = tsNode;
  if (format === "module" || format === "commonjs") {
    const config = Babel.loadPartialConfig({
      filename: url,
      plugins: ["babel-plugin-styled-components"],
      presets: [["@babel/preset-react", { runtime: "automatic" }]],
    });
    const { code } = await Babel.transformAsync(source, config.options);
    return { format, source: code, shortCircuit: true };
  }
  return tsNode;
}
