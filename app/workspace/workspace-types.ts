import type { ReactNode } from "react";
import type { TabId, TabItem } from "../tabs/types";

export type WorkspaceId = string;
export type WorkspacePaneId = string;
export type WorkspaceSplitNodeId = string;

export type WorkspaceLayoutPaneSlot = "left" | "center" | "right";
export type WorkspaceFixedPaneSlot = "left" | "right";

export type WorkspacePaneKind =
  | "navigator"
  | "scene"
  | "inspector"
  | "console"
  | "viewer"
  | "custom";

export type WorkspaceSplitDirection = "horizontal" | "vertical";
export type WorkspaceSplitPlacement = "right" | "left" | "down" | "up";

export interface WorkspaceWindowModel {
  id: WorkspaceId;
  title: string;
  header: WorkspaceHeaderModel;
  body: WorkspaceBodyModel;
  footer: WorkspaceFooterModel;
}

export interface WorkspaceHeaderModel {
  title: string;
  subtitle?: string;
  actions?: WorkspaceActionModel[];
}

export interface WorkspaceFooterModel {
  status: string;
  detail?: string;
}

export interface WorkspaceActionModel {
  id: string;
  title: string;
  disabled?: boolean;
}

export interface WorkspaceBodyModel {
  paneManager: WorkspacePaneManagerModel;
}

export interface WorkspacePaneManagerModel {
  left: WorkspaceFixedLayoutPaneModel;
  center: WorkspaceCenterLayoutPaneModel;
  right: WorkspaceFixedLayoutPaneModel;
}

export interface WorkspaceLayoutPaneMetrics {
  size: number;
  minSize: number;
  maxSize?: number;
}

export interface WorkspaceFixedLayoutPaneModel {
  slot: WorkspaceFixedPaneSlot;
  collapsed: boolean;
  collapsedSize: number;
  metrics: WorkspaceLayoutPaneMetrics;
  pane: WorkspacePaneModel;
}

export interface WorkspaceCenterLayoutPaneModel {
  slot: "center";
  metrics: Pick<WorkspaceLayoutPaneMetrics, "minSize">;
  splitManager: WorkspaceCenterSplitManagerModel;
}

export interface WorkspaceCenterSplitManagerModel {
  root: WorkspaceCenterSplitNodeModel;
  activeLeafId?: WorkspaceSplitNodeId;
}

export type WorkspaceCenterSplitNodeModel =
  | WorkspaceCenterSplitLeafNodeModel
  | WorkspaceCenterSplitBranchNodeModel;

export interface WorkspaceCenterSplitLeafNodeModel {
  type: "leaf";
  id: WorkspaceSplitNodeId;
  pane: WorkspacePaneModel;
}

export interface WorkspaceCenterSplitBranchNodeModel {
  type: "split";
  id: WorkspaceSplitNodeId;
  direction: WorkspaceSplitDirection;
  ratio: number;
  first: WorkspaceCenterSplitNodeModel;
  second: WorkspaceCenterSplitNodeModel;
}

export interface WorkspacePaneModel {
  id: WorkspacePaneId;
  title: string;
  kind: WorkspacePaneKind;
  tabs: WorkspacePaneTabsModel;
  capabilities: WorkspacePaneCapabilities;
}

export interface WorkspacePaneCapabilities {
  canClose: boolean;
  canSplit: boolean;
  canResize: boolean;
  canCollapse: boolean;
}

export interface WorkspacePaneTabsModel {
  startPage: WorkspaceStartPageModel;
  items: TabItem[];
  activeTabId?: TabId;
}

export interface WorkspaceStartPageModel {
  id: TabId;
  title: string;
  panel: ReactNode;
}
