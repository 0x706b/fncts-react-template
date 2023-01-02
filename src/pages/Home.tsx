import { Push } from "@fncts/io/Push";
import { RefSubject } from "@fncts/io/RefSubject";
import { usePush, useRefSubject, useScope } from "@fncts/react";
import React from "react";

const testRefSubject = RefSubject.unsafeMake("blue");

const testStream = Push.repeatIOMaybe(
  testRefSubject.getAndUpdate((x) => (x === "blue" ? "red" : "blue")).delay((500).milliseconds),
);

function Home() {
  const scope                   = useScope();
  const [startListening, color] = useRefSubject(testRefSubject);
  const [startStream]           = usePush(testStream);

  React.useEffect(() => {
    startListening.provideScope(scope).unsafeRunAsync();
    startStream.provideScope(scope).unsafeRunAsync();
  }, []);

  return (
    <p
      css={`
        color: ${color};
      `}
    >
      Homepage!!!
    </p>
  );
}

export default Home;
