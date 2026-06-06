"use client";

import { useState } from "react";
import Tabs, { type TabGroupId, type TabId, type TabItem } from "./api";

type TabTemplate = {
  id: TabId;
  title: string;
  panelTitle: string;
};

const tabTemplates: TabTemplate[] = [
  {
    id: "scene",
    title: "Scene",
    panelTitle: "Scene editor",
  },
  {
    id: "device",
    title: "Device",
    panelTitle: "Device controls",
  },
  {
    id: "log",
    title: "Log",
    panelTitle: "Log stream",
  },
];

function createTabFromTemplate(template: TabTemplate): TabItem {
  return {
    id: template.id,
    title: template.title,
    closable: true,
    panel: (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{template.panelTitle}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Content for the {template.title.toLowerCase()} tab.
        </p>
      </div>
    ),
  };
}

function hasTab(items: TabItem[], tabId: TabId) {
  return items.some((item) => item.id === tabId);
}

export default function EditorPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState<TabId | undefined>("file-1");

  const [items, setItems] = useState<TabItem[]>([
    {
      id: "file-1",
      title: "index.tsx",
      closable: true,
      dirty: false,
      panel: <div>Index file editor</div>,
    },
    {
      id: "file-2",
      title: "layout.tsx",
      closable: true,
      panel: <div>Layout file editor</div>,
    },
    {
      id: "preview",
      title: "Preview",
      closable: true,
      panel: <div>Preview panel</div>,
    },
  ]);

  const handleTabSelect = (_groupId: TabGroupId, tabId: TabId) => {
    setActiveTabId(tabId);
  };

  const handleTabClose = (_groupId: TabGroupId, tabId: TabId) => {
    const nextItems = items.filter((item) => item.id !== tabId);

    setItems(nextItems);

    setActiveTabId((currentActiveTabId) => {
      if (currentActiveTabId !== tabId) {
        return currentActiveTabId;
      }

      const nextTab = nextItems.find((item) => !item.disabled);

      return nextTab?.id;
    });
  };

  const handleAddTab = (template: TabTemplate) => {
    if (hasTab(items, template.id)) {
      return;
    }

    const nextTab = createTabFromTemplate(template);

    setItems((currentItems) => [...currentItems, nextTab]);
    setActiveTabId(nextTab.id);
    setIsMenuOpen(false);
  };

  return (
    <main className="flex h-dvh min-h-0 flex-col bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-sm font-medium">Tabs demo</div>
        <div className="relative">
          <button
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            type="button"
            className="inline-flex h-8 items-center gap-2 border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <span aria-hidden="true">+</span>
            Add tab
          </button>

          {isMenuOpen ? (
            <div
              className="absolute right-0 top-9 z-20 min-w-44 border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              role="menu"
            >
              {tabTemplates.map((template) => {
                const isAdded = hasTab(items, template.id);

                return (
                  <button
                    className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800 dark:disabled:text-zinc-600"
                    disabled={isAdded}
                    key={template.id}
                    onClick={() => handleAddTab(template)}
                    role="menuitem"
                    type="button"
                  >
                    <span>{template.title}</span>
                    {isAdded ? (
                      <span className="text-xs text-zinc-400 dark:text-zinc-600">
                        Added
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <Tabs
        id="editor-tabs"
        kind="editor"
        ariaLabel="Editor tabs"
        activeTabId={activeTabId}
        className="flex-1"
        items={items}
        onTabClose={handleTabClose}
        onTabSelect={handleTabSelect}
      />
    </main>
  );
}
