import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletConnectButton() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <WalletMultiButton />
    </div>
  );
}
