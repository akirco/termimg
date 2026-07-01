import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { useState } from "react";
import "./Image";

export function MyImageComponent() {
  const src = "sample.jpg";
  const [color, setColor] = useState("green");

  return (
    <box
      width={"100%"}
      height={"100%"}
      flexDirection="row"
      gap={2}
      // justifyContent="center"
      flexWrap="wrap"
      flexShrink={0}
      // alignItems="center"
      padding={0}
      margin={10}
    >
      <termImage src={src} width={20} />
      <termImage src={src} width={20} />

      <termImage src={src} width={20} />

      {/* <box
        backgroundColor={color}
        onMouseOver={() => setColor("red")}
        onMouseOut={() => setColor("green")}
      >
        <text>button</text>
      </box> */}
    </box>
  );
}

const renderer = await createCliRenderer({});
createRoot(renderer).render(<MyImageComponent />);
