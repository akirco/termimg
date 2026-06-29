import type { TermImageRenderable } from "./Image.tsx";

declare module "@opentui/react" {
  interface OpenTUIComponents {
    termImage: typeof TermImageRenderable;
  }
}
