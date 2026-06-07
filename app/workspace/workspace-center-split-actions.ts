import type { TabId } from "../tabs/types";
import type {
  WorkspaceCenterSplitBranchNodeModel,
  WorkspaceCenterSplitLeafNodeModel,
  WorkspaceCenterSplitNodeModel,
  WorkspacePaneId,
  WorkspacePaneModel,
  WorkspaceSplitNodeId,
  WorkspaceStartPageModel,
  WorkspaceWindowModel,
} from "./workspace-types";
import { createPaneWithSingleTab, isStartPageTab } from "./workspace-tab-utils";

interface SplitCenterTabOptions {
  sourceLeafId: WorkspaceSplitNodeId;
  tabId: TabId;
  createStartPage: (paneId: WorkspacePaneId) => WorkspaceStartPageModel;
  createId?: (prefix: string) => string;
}

function createDefaultId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Date.now().toString();

  return `${prefix}-${randomId}`;
}

function createCenterPaneFromTab(options: {
  sourcePane: WorkspacePaneModel;
  tabId: TabId;
  createStartPage: (paneId: WorkspacePaneId) => WorkspaceStartPageModel;
  createId: (prefix: string) => string;
}): WorkspacePaneModel | undefined {
  const tab = options.sourcePane.tabs.items.find(
    (item) => item.id === options.tabId,
  );

  if (!tab || isStartPageTab(options.sourcePane, tab)) {
    return undefined;
  }

  const paneId = options.createId("center-pane");

  return createPaneWithSingleTab({
    pane: options.sourcePane,
    id: paneId,
    title: tab.title,
    tab,
    startPage: options.createStartPage(paneId),
  });
}

function splitLeafTabToRight(options: {
  leaf: WorkspaceCenterSplitLeafNodeModel;
  tabId: TabId;
  createStartPage: (paneId: WorkspacePaneId) => WorkspaceStartPageModel;
  createId: (prefix: string) => string;
}): WorkspaceCenterSplitNodeModel {
  const { leaf, tabId, createStartPage, createId } = options;

  if (!leaf.pane.capabilities.canSplit) {
    return leaf;
  }

  const rightPane = createCenterPaneFromTab({
    sourcePane: leaf.pane,
    tabId,
    createStartPage,
    createId,
  });

  if (!rightPane) {
    return leaf;
  }

  const rightLeafId = createId("center-leaf");
  const sourceLeaf: WorkspaceCenterSplitLeafNodeModel = {
    ...leaf,
    pane: {
      ...leaf.pane,
      tabs: {
        ...leaf.pane.tabs,
        activeTabId: tabId,
      },
    },
  };
  const rightLeaf: WorkspaceCenterSplitLeafNodeModel = {
    type: "leaf",
    id: rightLeafId,
    pane: rightPane,
  };

  const splitBranch: WorkspaceCenterSplitBranchNodeModel = {
    type: "split",
    id: createId("center-split"),
    direction: "horizontal",
    ratio: 0.5,
    first: sourceLeaf,
    second: rightLeaf,
  };

  return splitBranch;
}

function splitTabToRightInNode(options: {
  node: WorkspaceCenterSplitNodeModel;
  sourceLeafId: WorkspaceSplitNodeId;
  tabId: TabId;
  createStartPage: (paneId: WorkspacePaneId) => WorkspaceStartPageModel;
  createId: (prefix: string) => string;
}): WorkspaceCenterSplitNodeModel {
  const { node, sourceLeafId, tabId, createStartPage, createId } = options;

  if (node.type === "leaf") {
    if (node.id !== sourceLeafId) {
      return node;
    }

    return splitLeafTabToRight({
      leaf: node,
      tabId,
      createStartPage,
      createId,
    });
  }

  return {
    ...node,
    first: splitTabToRightInNode({
      node: node.first,
      sourceLeafId,
      tabId,
      createStartPage,
      createId,
    }),
    second: splitTabToRightInNode({
      node: node.second,
      sourceLeafId,
      tabId,
      createStartPage,
      createId,
    }),
  };
}

/**
 * Creates a side-by-side split view of one tab. The source leaf keeps the tab,
 * and the new right-side leaf opens another view of that same tab.
 */
export function splitCenterTabToRight(
  workspace: WorkspaceWindowModel,
  options: SplitCenterTabOptions,
): WorkspaceWindowModel {
  const paneManager = workspace.body.paneManager;
  const createId = options.createId ?? createDefaultId;
  const nextRoot = splitTabToRightInNode({
    node: paneManager.center.splitManager.root,
    sourceLeafId: options.sourceLeafId,
    tabId: options.tabId,
    createStartPage: options.createStartPage,
    createId,
  });

  if (nextRoot === paneManager.center.splitManager.root) {
    return workspace;
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
            root: nextRoot,
          },
        },
      },
    },
  };
}
