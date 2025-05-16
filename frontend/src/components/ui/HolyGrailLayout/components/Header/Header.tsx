import { type ReactNode } from "react";

const Header = ({ children }: { children: ReactNode }) => (
  <header className="holy-grail--header">
    <div className="holy-grail--container">{children}</div>
  </header>
);

export default Header;
