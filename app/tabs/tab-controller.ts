import type { ReactNode } from "react";
import type { TabId, TabItem } from "./types";

export interface RuntimeTabState {
  items: TabItem[];
  activeTabId?: TabId;
}

/**
 * Converts an app/domain model into the generic tab shape used by the tab UI.
 * The controller stays model-agnostic; callers decide how ids, labels, and
 * panel content are derived from their own data.
 */
export interface TabControllerAdapter<TModel> {
  getId: (model: TModel) => TabId;
  getTitle: (model: TModel) => string;
  renderContent: (model: TModel) => ReactNode;

  getVersion?: (model: TModel) => string | number;
  getDirty?: (model: TModel) => boolean;
  getDisabled?: (model: TModel) => boolean;
  getClosable?: (model: TModel) => boolean;
}

interface CachedTabItem {
  version: string | number;
  item: TabItem;
}

type AddTabOptions = {
  active?: boolean;
};

type CreateTabsOptions = {
  activeTabId?: TabId;
};

export class TabController<TModel> {
  private state: RuntimeTabState = {
    items: [],
    activeTabId: undefined,
  };

  /**
   * Keeps rendered tab items stable while the source model version is unchanged.
   * Call invalidate/invalidateAll when external data changes outside getVersion.
   */
  private cache = new Map<TabId, CachedTabItem>();

  /**
   * External-store subscribers. React registers here through useSyncExternalStore.
   */
  private listeners = new Set<() => void>();

  constructor(private adapter: TabControllerAdapter<TModel>) {}

  /**
   * Returns the current store snapshot. React calls this after emit() tells it
   * that something changed.
   */
  getSnapshot = (): RuntimeTabState => {
    return this.state;
  };

  /**
   * Registers a change listener and returns the unsubscribe cleanup function.
   */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Replaces the current tab list from domain models.
   */
  createTabs = (models: TModel[], options?: CreateTabsOptions) => {
    const items = models.map((model) => this.createTabItemFromModel(model));

    const preferredActiveTabId = options?.activeTabId ?? this.state.activeTabId;
    const nextActiveTabId = this.resolveActiveTabId(
      items,
      preferredActiveTabId,
    );

    this.state = {
      items,
      activeTabId: nextActiveTabId,
    };

    this.emit();
  };

  /**
   * Adds or refreshes one model-backed tab.
   */
  addTab = (model: TModel, options?: AddTabOptions) => {
    const item = this.createTabItemFromModel(model);

    this.upsertItem(item, options);
  };

  /**
   * Adds or refreshes one already-renderable tab item.
   */
  addView = (item: TabItem, options?: AddTabOptions) => {
    this.cache.set(item.id, {
      version: "manual",
      item,
    });

    this.upsertItem(item, options);
  };

  /**
   * Selects an existing enabled tab.
   */
  selectTab = (tabId: TabId) => {
    const selectedTab = this.state.items.find((item) => item.id === tabId);

    if (!selectedTab || selectedTab.disabled) {
      return;
    }

    this.state = {
      ...this.state,
      activeTabId: tabId,
    };

    this.emit();
  };

  /**
   * Removes a tab and chooses a replacement active tab when needed.
   */
  closeTab = (tabId: TabId) => {
    const nextItems = this.state.items.filter((item) => item.id !== tabId);

    const wasActiveTab = this.state.activeTabId === tabId;

    const nextActiveTabId = wasActiveTab
      ? this.resolveActiveTabId(nextItems, undefined)
      : this.state.activeTabId;

    this.state = {
      items: nextItems,
      activeTabId: nextActiveTabId,
    };

    this.emit();
  };

  /**
   * Clears all runtime tabs.
   */
  clear = () => {
    this.state = {
      items: [],
      activeTabId: undefined,
    };

    this.emit();
  };

  /**
   * Drops one cached tab item so the next model conversion rebuilds it.
   */
  invalidate = (tabId: TabId) => {
    this.cache.delete(tabId);
  };

  /**
   * Drops every cached tab item.
   */
  invalidateAll = () => {
    this.cache.clear();
  };

  /**
   * Converts a domain model into a TabItem, using the cache when its version
   * has not changed.
   */
  private createTabItemFromModel = (model: TModel): TabItem => {
    const id = this.adapter.getId(model);

    const version = this.adapter.getVersion?.(model) ?? "static";

    const cachedItem = this.cache.get(id);

    if (cachedItem && cachedItem.version === version) {
      return cachedItem.item;
    }

    const item: TabItem = {
      id,
      title: this.adapter.getTitle(model),
      dirty: this.adapter.getDirty?.(model) ?? false,
      disabled: this.adapter.getDisabled?.(model) ?? false,
      closable: this.adapter.getClosable?.(model) ?? true,
      panel: this.adapter.renderContent(model),
    };

    this.cache.set(id, {
      version,
      item,
    });

    return item;
  };

  /**
   * Inserts a new tab or replaces an existing tab with the same id.
   */
  private upsertItem = (item: TabItem, options?: AddTabOptions) => {
    const itemAlreadyExists = this.state.items.some(
      (currentItem) => currentItem.id === item.id,
    );

    const items = itemAlreadyExists
      ? this.state.items.map((currentItem) =>
          currentItem.id === item.id ? item : currentItem,
        )
      : [...this.state.items, item];

    this.state = {
      items,
      activeTabId: options?.active === false ? this.state.activeTabId : item.id,
    };

    this.emit();
  };

  /**
   * Chooses a valid active tab, preferring the requested id when possible.
   */
  private resolveActiveTabId = (
    items: TabItem[],
    preferredActiveTabId: TabId | undefined,
  ) => {
    const preferredTab = items.find(
      (item) => item.id === preferredActiveTabId && !item.disabled,
    );
    const firstEnabledTab = items.find((item) => !item.disabled);

    return preferredTab?.id ?? firstEnabledTab?.id ?? items[0]?.id;
  };

  /**
   * Notifies subscribers that the state object has changed.
   */
  private emit = () => {
    this.listeners.forEach((listener) => listener());
  };
}
