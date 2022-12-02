import React from "react";

function Home() {
  const handle            = React.useRef<NodeJS.Timer | number | null>(null);
  const [color, setColor] = React.useState("blue");
  React.useEffect(() => {
    handle.current = setInterval(() => {
      setColor((color) => (color === "blue" ? "red" : "blue"));
    }, 500);
    return () => {
      if (handle.current !== null) {
        clearInterval(handle.current);
        handle.current = null;
      }
    };
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
