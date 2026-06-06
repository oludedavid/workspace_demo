import type { SceneModel } from "./type";

export const sceneModel: SceneModel = {
  id: "scene-main",
  name: "Main Scene",
  children: [
    {
      id: "device-camera",
      kind: "device",
      name: "Camera Device",
      payload: {
        status: "online",
        temperature: "22.4 °C",
      },
    },
    {
      id: "device-config",
      kind: "property",
      name: "Configuration",
      dirty: true,
      payload: {
        sampleRate: "250 Hz",
      },
    },
    {
      id: "system-logs",
      kind: "log",
      name: "System Logs",
      payload: {
        lines: [
          "[12:04:12] Device initialized",
          "[12:04:15] Connection stable",
          "[12:04:22] Detector state: READY",
        ],
      },
    },
  ],
};
