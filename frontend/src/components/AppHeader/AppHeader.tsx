import React from "react";
import { AppButton } from "../ui/AppButton";
import "./app-header.scss";

export const AppHeader = () => {
  return (
    <header className="app-header">
      <div className="flex flex--between flex--vcenter">
        <div className="flex gap8 flex--vcenter">
          <img
            src="/solana.png"
            alt="Solana Logo"
            width={98}
            height={12}
            style={{ display: "block" }}
          />

          <div className="project-title">
            Confidential
            <br />
            Balances Demo
          </div>
        </div>

        <div className="flex gap16 flex--vcenter">
          <AppButton style="ghost" size="medium">
            Auditor
          </AppButton>
          <AppButton style="ghost" size="medium">
            Github
          </AppButton>
          <AppButton style="ghost" size="medium">
            Documentation
          </AppButton>
          <AppButton style="secondary" size="medium">
            <>
              <i className="fa-solid fa-code"></i>
              <span>Dev Mode</span>
            </>
          </AppButton>
          <AppButton style="secondary" size="medium">
            <>
              <i className="fa-solid fa-network-wired"></i>
              <span>Devnet</span>
            </>
          </AppButton>
          <AppButton style="primary" size="medium">
            <>
              <i className="fa-solid fa-wallet"></i>
              <span>Connect Wallet</span>
            </>
          </AppButton>
        </div>
      </div>
    </header>
  );
};
