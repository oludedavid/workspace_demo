import type { ReactNode } from "react";
import type { TabId, TabItem } from "./types";

export interface RuntimeTabState {
  items: TabItem[];
  activeTabId?: TabId;
}

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

  private cache = new Map<TabId, CachedTabItem>();

  private listeners = new Set<() => void>();

  constructor(private adapter: TabControllerAdapter<TModel>) {}

  getSnapshot = (): RuntimeTabState => {
    return this.state;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

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

  addTab = (model: TModel, options?: AddTabOptions) => {
    const item = this.createTabItemFromModel(model);

    this.upsertItem(item, options);
  };

  addView = (item: TabItem, options?: AddTabOptions) => {
    this.cache.set(item.id, {
      version: "manual",
      item,
    });

    this.upsertItem(item, options);
  };

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

  clear = () => {
    this.state = {
      items: [],
      activeTabId: undefined,
    };

    this.emit();
  };

  invalidate = (tabId: TabId) => {
    this.cache.delete(tabId);
  };

  invalidateAll = () => {
    this.cache.clear();
  };

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

  private emit = () => {
    this.listeners.forEach((listener) => listener());
  };
}
