import { type ReactNode } from "react";

const MainColumns = ({ children }: { children: ReactNode }) => (
  <div className="holy-grail--main">
    <div className="holy-grail--container holy-grail--main-columns">
      {children}
    </div>
  </div>
);

export default MainColumns;
