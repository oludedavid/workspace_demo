"use client";

import Tabs from "../tabs/api";
import type { TabControllerAdapter } from "../tabs/tab-controller";
import {
  useCreateTabController,
  useTabControllerState,
} from "../tabs/useTabController";
import { sceneModel } from "./data";
import { renderSceneNode } from "./sceneRenderer";
import type { SceneNodeModel } from "./type";

const DEFAULT_ACTIVE_NODE_ID = "device-camera";
const LOGS_NODE_ID = "system-logs";
const ACTION_BUTTON_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";

const sceneTabAdapter: TabControllerAdapter<SceneNodeModel> = {
  getId: (node) => node.id,
  getTitle: (node) => node.name,
  getDirty: (node) => node.dirty ?? false,
  getDisabled: (node) => node.disabled ?? false,
  getClosable: () => true,
  getVersion: (node) =>
    JSON.stringify({
      id: node.id,
      kind: node.kind,
      name: node.name,
      dirty: node.dirty,
      disabled: node.disabled,
      payload: node.payload,
    }),
  renderContent: renderSceneNode,
};

function HelpPanel() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Runtime Help</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This tab was created manually without a scene model.
      </p>
    </div>
  );
}

function findSceneNode(nodeId: string) {
  return sceneModel.children.find((node) => node.id === nodeId);
}

export default function KaraboRuntimeTabsExample() {
  const tabController = useCreateTabController(sceneTabAdapter);
  const tabState = useTabControllerState(tabController);

  const handleCreateTabs = () => {
    tabController.createTabs(sceneModel.children, {
      activeTabId: DEFAULT_ACTIVE_NODE_ID,
    });
  };

  const handleOpenLogs = () => {
    const logsNode = findSceneNode(LOGS_NODE_ID);

    if (!logsNode) {
      return;
    }

    tabController.addTab(logsNode, {
      active: true,
    });
  };

  const handleAddManualTab = () => {
    tabController.addView(
      {
        id: "manual-help",
        title: "Help",
        closable: true,
        panel: <HelpPanel />,
      },
      {
        active: true,
      },
    );
  };

  return (
    <main className="min-h-screen bg-zinc-100 p-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
            Runtime Tab Controller
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            Karabo-style Scientific Browser
          </h1>

          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Scene models can be converted into cached tabs at runtime.
          </p>
        </header>

        <div className="flex gap-2">
          <button
            onClick={handleCreateTabs}
            type="button"
            className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          >
            Create tabs from scene children
          </button>

          <button
            onClick={handleOpenLogs}
            type="button"
            className={ACTION_BUTTON_CLASS}
          >
            Open logs
          </button>

          <button
            onClick={handleAddManualTab}
            type="button"
            className={ACTION_BUTTON_CLASS}
          >
            Add manual tab
          </button>
        </div>

        <Tabs
          id="karabo-runtime-tabs"
          kind="runtime"
          ariaLabel="Karabo runtime tabs"
          items={tabState.items}
          activeTabId={tabState.activeTabId}
          onTabSelect={(_, tabId) => {
            tabController.selectTab(tabId);
          }}
          onTabClose={(_, tabId) => {
            tabController.closeTab(tabId);
          }}
        />
      </div>
    </main>
  );
}
