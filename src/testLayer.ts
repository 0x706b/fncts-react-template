import { makeLayerContext } from "@fncts/react";

let x = 0;

const TestLayerTag = Tag<number>();

const testLayer = Layer.fromIO(
  IO(() => {
    x += 1;
    console.log(x);
    return x;
  }),
  TestLayerTag,
);

export const LayerContext = makeLayerContext(testLayer);
