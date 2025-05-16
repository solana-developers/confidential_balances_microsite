import { type ReactNode } from "react";

const MainContent = ({ children }: { children: ReactNode }) => (
  <main className="holy-grail--content pt0">{children}</main>
);

export default MainContent;
