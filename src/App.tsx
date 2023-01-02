import React from "react";
import { Route, Routes } from "react-router";

import { LayerContext } from "./testLayer.js";

const Home = React.lazy(() => import("./pages/Home.js"));

interface AppProps {
  readonly url?: string;
  readonly manifest?: ReadonlyArray<{ href: string }>;
}

export function App({ url }: AppProps) {
  return (
    <LayerContext.Provider>
      <React.Suspense fallback={<p>Loading...</p>}>
        <Routes location={url}>
          <Route path="/" element={<Home />} />
        </Routes>
      </React.Suspense>
    </LayerContext.Provider>
  );
}
