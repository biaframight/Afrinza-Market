import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { PwaInstallPrompt } from "@/components/pwa-update-prompt";

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <>
    <App />
    <PwaInstallPrompt />
  </>
);
