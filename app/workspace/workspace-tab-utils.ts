import type { TabId, TabItem } from "../tabs/types";
import type {
  WorkspacePaneModel,
  WorkspaceStartPageModel,
} from "./workspace-types";

/**
 * Converts a pane start page into the real tab item shown by the shared Tabs UI.
 */
export function createStartPageTab(startPage: WorkspaceStartPageModel): TabItem {
  return {
    id: startPage.id,
    title: startPage.title,
    closable: false,
    dirty: false,
    disabled: false,
    panel: startPage.panel,
  };
}

export function isStartPageTab(
  pane: WorkspacePaneModel,
  tab: TabItem | undefined,
) {
  return Boolean(tab && tab.id === pane.tabs.startPage.id);
}

export function isShowingOnlyStartPage(pane: WorkspacePaneModel) {
  return (
    pane.tabs.items.length === 1 &&
    pane.tabs.items[0]?.id === pane.tabs.startPage.id
  );
}

export function restorePaneStartPage(
  pane: WorkspacePaneModel,
): WorkspacePaneModel {
  const startTab = createStartPageTab(pane.tabs.startPage);

  return {
    ...pane,
    tabs: {
      ...pane.tabs,
      items: [startTab],
      activeTabId: startTab.id,
    },
  };
}

export function getNextActiveTabId(items: TabItem[]): TabId | undefined {
  return items.find((item) => !item.disabled)?.id ?? items[0]?.id;
}

/**
 * Removes a non-start tab from a pane. If the pane becomes empty, the start
 * page returns so the pane never renders without content.
 */
export function removeTabFromPane(
  pane: WorkspacePaneModel,
  tabId: TabId,
): WorkspacePaneModel {
  const tabToRemove = pane.tabs.items.find((item) => item.id === tabId);

  if (!tabToRemove || isStartPageTab(pane, tabToRemove)) {
    return pane;
  }

  const nextItems = pane.tabs.items.filter((item) => item.id !== tabId);

  if (nextItems.length === 0) {
    return restorePaneStartPage(pane);
  }

  const wasActiveTab = pane.tabs.activeTabId === tabId;

  return {
    ...pane,
    tabs: {
      ...pane.tabs,
      items: nextItems,
      activeTabId: wasActiveTab
        ? getNextActiveTabId(nextItems)
        : pane.tabs.activeTabId,
    },
  };
}

export function createPaneWithSingleTab(options: {
  pane: WorkspacePaneModel;
  id: string;
  title: string;
  tab: TabItem;
  startPage: WorkspaceStartPageModel;
}): WorkspacePaneModel {
  return {
    ...options.pane,
    id: options.id,
    title: options.title,
    tabs: {
      startPage: options.startPage,
      items: [options.tab],
      activeTabId: options.tab.id,
    },
  };
}

