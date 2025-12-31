import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import WalletAppProvider from "./WalletAppProvider";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <WalletAppProvider>
    <App />
  </WalletAppProvider>
);
