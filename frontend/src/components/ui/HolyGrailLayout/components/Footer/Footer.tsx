import { type ReactNode } from "react";

const Footer = ({ children }: { children: ReactNode }) => (
  <footer className="holy-grail--footer">
    <div className="holy-grail--container">{children}</div>
  </footer>
);

export default Footer;
