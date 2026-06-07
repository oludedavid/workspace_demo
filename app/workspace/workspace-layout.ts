import type { TabId } from "../tabs/types";
import type {
  WorkspaceCenterSplitNodeModel,
  WorkspaceFixedLayoutPaneModel,
  WorkspaceFixedPaneSlot,
  WorkspacePaneModel,
  WorkspaceWindowModel,
} from "./workspace-types";

export type WorkspaceResizeTarget = WorkspaceFixedPaneSlot;

export interface WorkspaceResizeBounds {
  left: number;
  right: number;
  width: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Returns the rendered width for a fixed outer pane. Collapsed panes keep a
 * small visible rail instead of disappearing from the workspace grid.
 */
export function getFixedPaneSize(pane: WorkspaceFixedLayoutPaneModel) {
  return pane.collapsed ? pane.collapsedSize : pane.metrics.size;
}

/**
 * Updates one fixed outer layout pane while preserving the rest of the
 * workspace model.
 */
export function updateFixedPane(
  workspace: WorkspaceWindowModel,
  slot: WorkspaceFixedPaneSlot,
  updater: (
    pane: WorkspaceFixedLayoutPaneModel,
  ) => WorkspaceFixedLayoutPaneModel,
): WorkspaceWindowModel {
  const paneManager = workspace.body.paneManager;

  return {
    ...workspace,
    body: {
      ...workspace.body,
      paneManager: {
        ...paneManager,
        [slot]: updater(paneManager[slot]),
      },
    },
  };
}

/**
 * Walks the center split tree until it finds the pane that owns the requested
 * id. Today the center has one leaf, but this keeps pane updates ready for
 * nested split leaves later.
 */
function updateCenterSplitPane(
  node: WorkspaceCenterSplitNodeModel,
  paneId: string,
  updater: (pane: WorkspacePaneModel) => WorkspacePaneModel,
): WorkspaceCenterSplitNodeModel {
  if (node.type === "leaf") {
    if (node.pane.id !== paneId) {
      return node;
    }

    return {
      ...node,
      pane: updater(node.pane),
    };
  }

  return {
    ...node,
    first: updateCenterSplitPane(node.first, paneId, updater),
    second: updateCenterSplitPane(node.second, paneId, updater),
  };
}

/**
 * Updates any workspace pane by id. Left and right panes are direct outer
 * panes, while center panes are leaves inside the center split manager.
 */
export function updateWorkspacePane(
  workspace: WorkspaceWindowModel,
  paneId: string,
  updater: (pane: WorkspacePaneModel) => WorkspacePaneModel,
): WorkspaceWindowModel {
  const paneManager = workspace.body.paneManager;
  const leftPane = paneManager.left.pane;
  const rightPane = paneManager.right.pane;

  if (leftPane.id === paneId) {
    return updateFixedPane(workspace, "left", (layoutPane) => ({
      ...layoutPane,
      pane: updater(layoutPane.pane),
    }));
  }

  if (rightPane.id === paneId) {
    return updateFixedPane(workspace, "right", (layoutPane) => ({
      ...layoutPane,
      pane: updater(layoutPane.pane),
    }));
  }

  return {
    ...workspace,
    body: {
      ...workspace.body,
      paneManager: {
        ...paneManager,
        center: {
          ...paneManager.center,
          splitManager: {
            ...paneManager.center.splitManager,
            root: updateCenterSplitPane(
              paneManager.center.splitManager.root,
              paneId,
              updater,
            ),
          },
        },
      },
    },
  };
}

/**
 * Stores the active tab id on the pane model. Rendering is still delegated to
 * the shared Tabs component.
 */
export function selectTabInPane(
  workspace: WorkspaceWindowModel,
  paneId: string,
  tabId: TabId,
) {
  return updateWorkspacePane(workspace, paneId, (pane) => ({
    ...pane,
    tabs: {
      ...pane.tabs,
      activeTabId: tabId,
    },
  }));
}

/**
 * Collapses or expands a fixed outer pane. The center pane is intentionally not
 * collapsible in this workspace model.
 */
export function toggleFixedPane(
  workspace: WorkspaceWindowModel,
  slot: WorkspaceFixedPaneSlot,
) {
  return updateFixedPane(workspace, slot, (pane) => ({
    ...pane,
    collapsed: !pane.collapsed,
  }));
}

/**
 * Resizes a fixed outer pane from a pointer position. The calculation clamps
 * against pane min/max values and keeps the center pane above its minimum size.
 */
export function resizeFixedPane(
  workspace: WorkspaceWindowModel,
  slot: WorkspaceResizeTarget,
  pointerX: number,
  containerBounds: WorkspaceResizeBounds,
) {
  const paneManager = workspace.body.paneManager;
  const leftSize = getFixedPaneSize(paneManager.left);
  const rightSize = getFixedPaneSize(paneManager.right);
  const targetPane = paneManager[slot];
  const otherFixedSize = slot === "left" ? rightSize : leftSize;
  const maxByContainer =
    containerBounds.width - otherFixedSize - paneManager.center.metrics.minSize;
  const configuredMax = targetPane.metrics.maxSize ?? maxByContainer;
  const safeMax = Math.max(
    targetPane.metrics.minSize,
    Math.min(configuredMax, maxByContainer),
  );
  const rawSize =
    slot === "left"
      ? pointerX - containerBounds.left
      : containerBounds.right - pointerX;

  return updateFixedPane(workspace, slot, (pane) => ({
    ...pane,
    metrics: {
      ...pane.metrics,
      size: clamp(rawSize, pane.metrics.minSize, safeMax),
    },
  }));
}
