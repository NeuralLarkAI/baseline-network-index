import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import WalletAppProvider from "./WalletAppProvider";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";

// ---- Polyfills required for Solana/Jupiter on Vite + Vercel ----
import { Buffer } from "buffer";
import process from "process";

(window as any).Buffer = Buffer;
(window as any).process = process;
// ---------------------------------------------------------------

createRoot(document.getElementById("root")!).render(
  <WalletAppProvider>
    <App />
  </WalletAppProvider>
);
