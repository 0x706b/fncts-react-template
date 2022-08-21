import type { PathLike } from "node:fs";
import type { Match, Path } from "node-match-path";

import * as fs from "@fncts/node/fs";
import { match } from "node-match-path";

export interface RouteManifestEntry {
  readonly type: string;
  readonly href: string;
}

export type RouteManifest = Record<string, ReadonlyArray<RouteManifestEntry>>;

const RouteManifestDecoder = Derive<Decoder<RouteManifest>>();

export type RouteMatcher = (url: string) => Match;

export function makePathMatcher(path: Path): RouteMatcher {
  return (url) => match(path, url);
}

export function matchPaths(
  matchers: ReadonlyArray<RouteMatcher>,
): (url: string) => Maybe<{ match: Match; index: number }> {
  return (url) =>
    matchers.asImmutableArray.findMapWithIndex((index, matcher) => {
      const match = matcher(url);
      return match.matches ? Just({ match, index }) : Nothing();
    });
}

export interface RouteManifestService {
  readonly matchRoute: (url: string) => FIO<ManifestError, Maybe<ReadonlyArray<RouteManifestEntry>>>;
}

export const RouteManifestService = Tag<RouteManifestService>();

export function createRouteManifestService(path: PathLike): Layer<never, never, RouteManifestService> {
  return Layer.succeed(() => {
    const getRouteManifest = fs
      .readFile(path)
      .mapError((err) => new ManifestError(err))
      .flatMap((buffer) =>
        IO.tryCatch(
          () => JSON.parse(buffer.toString("utf-8")),
          (err) => new ManifestError(err),
        ),
      )
      .flatMap((json) =>
        RouteManifestDecoder(json).match2(
          (error) => IO.failNow(new ManifestError(error)),
          (_, manifest) => IO.succeedNow(manifest),
        ),
      );

    function matchRoute(url: string) {
      return Do((Δ) => {
        const manifest = Δ(getRouteManifest);
        const paths    = Object.keys(manifest).map((p) => [p, makePathMatcher(p)] as const);
        const matcher  = matchPaths(paths.map(([, matcher]) => matcher));
        return matcher(url).map(({ index }) => manifest[paths[index][0]]);
      });
    }

    return { matchRoute };
  }, RouteManifestService);
}

export class ManifestError extends Error {
  readonly _tag = "ManifestError";
  constructor(readonly error: unknown) {
    super();
  }
}
