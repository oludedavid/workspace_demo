import type { SplitWorkspaceItem } from "./type";

export const splitWorkspaceItems: SplitWorkspaceItem[] = [
  {
    id: "overview-scene",
    kind: "scene",
    title: "Overview Scene",
    description: "A high-level workspace scene for the current instrument.",
  },
  {
    id: "camera-device",
    kind: "device",
    title: "Camera Device",
    description: "Live camera controls and health status.",
  },
  {
    id: "temperature-plot",
    kind: "plot",
    title: "Temperature Plot",
    description: "A trend view for recent temperature samples.",
    dirty: true,
  },
  {
    id: "runtime-log",
    kind: "log",
    title: "Runtime Log",
    description: "Runtime events from the selected workspace.",
  },
];
