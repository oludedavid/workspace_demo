export type SplitWorkspaceItemKind = "scene" | "device" | "plot" | "log";

export interface SplitWorkspaceItem {
  id: string;
  kind: SplitWorkspaceItemKind;
  title: string;
  description: string;
  dirty?: boolean;
  disabled?: boolean;
}
