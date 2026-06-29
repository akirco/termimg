import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { useState } from "react";
import "./Image";

export function MyImageComponent() {
  const src = "sample.jpg";
  const [color, setColor] = useState("green");

  return (
    <box flexDirection="row" gap={10} flexWrap="wrap">
      <termImage src={src} width={20} protocol="ascii" />
      <termImage src={src} width={20} protocol="braille" />
      <termImage src={src} width={20} protocol="halfblock" />
      <termImage src={src} width={20} />
      <box
        backgroundColor={color}
        onMouseOver={() => setColor("red")}
        onMouseOut={() => setColor("green")}
      >
        <text>button</text>
      </box>
    </box>
  );
}

const renderer = await createCliRenderer({});
createRoot(renderer).render(<MyImageComponent />);
