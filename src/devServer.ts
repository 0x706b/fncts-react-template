import type {} from "./global";
import type {} from "@fncts/io/global";
import type { NextFunction, Request, Response } from "express";

import * as E from "@fncts/express";
import { Console } from "@fncts/io/Console";
import express from "express";
import path from "node:path";
import url from "node:url";
import { inspect } from "node:util";
import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";

import webpackConfig from "../webpack.config.js";
import { createRouteManifestService } from "./server/manifest.js";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const RouteManifest = createRouteManifestService(path.resolve(dirname, "../dist/route-manifest.json"));

const compiler = webpack(webpackConfig);

const bodyParserMiddleware = E.classic(express.urlencoded({ extended: true }));
const staticMiddleware     = E.classic(express.static(path.join(dirname, "../dist"), { index: false }));
const jsonMiddleware       = E.classic(express.json());
const urlencodedMiddleware = E.classic(express.urlencoded());

const devMiddleware = E.classic(
  webpackDevMiddleware(compiler, {
    serverSideRender: true,
    publicPath: webpackConfig.output?.publicPath ?? "/",
    writeToDisk: true,
  }),
);
const hotMiddleware = E.classic(
  webpackHotMiddleware(compiler, {
    path: "/__webpack_hmr",
  }),
);

const ssr = E.get("/*", (req, res, next) =>
  IO.fromPromiseHalt(import("./server/routes/ssr.js")).flatMap(({ ssr }) => ssr(req, res, next)),
);

const Express = E.LiveExpressAppConfig("0.0.0.0", 3000, E.defaultExitHandler).andTo(E.LiveExpressApp);

const program = Do((Δ) => {
  const express = Δ(IO.service(E.ExpressAppTag));
  Δ(E.use(bodyParserMiddleware));
  Δ(E.use(staticMiddleware));
  Δ(E.use(jsonMiddleware));
  Δ(E.use(urlencodedMiddleware));
  Δ(E.use(hotMiddleware));
  Δ(E.use(devMiddleware));
  Δ(ssr);
  Δ(Console.show("Listening on", express.server.address()));
  Δ(IO.never);
});

program.provideLayer(RouteManifest.and(Express)).unsafeRunAsyncWith((exit) => {
  console.log(
    inspect(exit, {
      depth: 10,
      colors: true,
    }),
  );
});
