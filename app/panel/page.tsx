import type { Metadata } from "next";
import { PanelDockview } from "./PanelDockview";

export const metadata: Metadata = {
  title: "Panel | Dockview Demo",
  description: "Initial Dockview panel route.",
};

export default function PanelPage() {
  return <PanelDockview />;
}
