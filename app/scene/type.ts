export type SceneNodeKind = "device" | "property" | "log" | "plot" | "folder";

export interface SceneNodeModel {
  id: string;
  kind: SceneNodeKind;
  name: string;
  dirty?: boolean;
  disabled?: boolean;
  children?: SceneNodeModel[];
  payload?: unknown;
}

export interface SceneModel {
  id: string;
  name: string;
  children: SceneNodeModel[];
}
