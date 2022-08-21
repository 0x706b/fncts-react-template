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

  if (
    child.protocol === "nodejs:" ||
    child.protocol === "node:" ||
    child.pathname.includes("/node_modules/") ||
    child.pathname.includes("src/server/manifest")
  ) {
    return result;
  }

  return {
    ...result,
    url: child.href + "?update=" + new Date().toISOString(),
  };
}

export const load = tsNodeEsmHooks.load;
