import type { CSSProp } from "styled-components";

declare module "react" {
  interface HTMLAttributes<T> {
    css?: CSSProp;
  }
}
