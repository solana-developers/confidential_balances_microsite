import { type ReactNode } from "react";

const AsideLeft = ({ children }: { children: ReactNode }) => (
  <aside className="holy-grail--aside">{children}</aside>
);

export default AsideLeft;
