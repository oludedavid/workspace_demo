"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Tabs from "../tabs/api";
import {
  type TabController,
  type TabControllerAdapter,
  type TabControllerOptions,
} from "../tabs/tab-controller";
import {
  useCreateTabController,
  useTabControllerState,
} from "../tabs/useTabController";
import { splitWorkspaceItems } from "./data";
import { renderSplitWorkspaceItem } from "./renderer";
import type { SplitWorkspaceItem } from "./type";

type PaneId = "left" | "right";

const splitTabAdapter: TabControllerAdapter<SplitWorkspaceItem> = {
  getId: (item) => item.id,
  getTitle: (item) => item.title,
  getDirty: (item) => item.dirty ?? false,
  getDisabled: (item) => item.disabled ?? false,
  getClosable: () => true,
  getVersion: (item) =>
    JSON.stringify({
      id: item.id,
      kind: item.kind,
      title: item.title,
      description: item.description,
      dirty: item.dirty,
      disabled: item.disabled,
    }),
  renderContent: renderSplitWorkspaceItem,
};

function SplitStartPage({
  paneLabel,
  onOpenItem,
}: {
  paneLabel: string;
  onOpenItem: (item: SplitWorkspaceItem) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{paneLabel} Start</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Open one item here. The first item replaces this start page.
        </p>
      </div>

      <div className="grid gap-2">
        {splitWorkspaceItems.map((item) => (
          <button
            className="border border-zinc-200 bg-zinc-50 p-3 text-left transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            key={item.id}
            onClick={() => onOpenItem(item)}
            type="button"
          >
            <span className="block text-sm font-medium">{item.title}</span>
            <span className="mt-1 block text-xs capitalize text-zinc-500 dark:text-zinc-400">
              {item.kind}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function createPaneOptions(
  paneId: PaneId,
  paneLabel: string,
): TabControllerOptions<SplitWorkspaceItem> {
  return {
    createStartPage: (controller) => {
      return {
        id: `${paneId}-start`,
        title: "Start",
        panel: (
          <SplitStartPage
            paneLabel={paneLabel}
            onOpenItem={(item) => {
              controller.addTab(item, {
                active: true,
              });
            }}
          />
        ),
      };
    },
  };
}

function PaneTabs({
  controller,
  id,
  label,
}: {
  controller: TabController<SplitWorkspaceItem>;
  id: PaneId;
  label: string;
}) {
  const tabState = useTabControllerState(controller);

  return (
    <section className="flex min-h-0 flex-1 flex-col border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-medium">{label}</h2>
        <button
          className="text-xs text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          onClick={() => controller.resetToStartPage()}
          type="button"
        >
          Reset
        </button>
      </header>
      <Tabs
        activeTabId={tabState.activeTabId}
        ariaLabel={`${label} tabs`}
        className="flex-1"
        id={`split-${id}-tabs`}
        items={tabState.items}
        kind="split-pane"
        onTabClose={(_, tabId) => controller.closeTab(tabId)}
        onTabSelect={(_, tabId) => controller.selectTab(tabId)}
      />
    </section>
  );
}

export default function SplitWorkspacePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftSize, setLeftSize] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  const leftOptions = useMemo(() => {
    return createPaneOptions("left", "Left Pane");
  }, []);
  const rightOptions = useMemo(() => {
    return createPaneOptions("right", "Right Pane");
  }, []);

  const leftController = useCreateTabController(splitTabAdapter, leftOptions);
  const rightController = useCreateTabController(splitTabAdapter, rightOptions);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const bounds = container.getBoundingClientRect();
      const nextSize = ((event.clientX - bounds.left) / bounds.width) * 100;

      setLeftSize(Math.min(75, Math.max(25, nextSize)));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing]);

  return (
    <main className="flex h-dvh min-h-0 flex-col bg-zinc-100 p-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="mb-3 shrink-0">
        <p className="text-sm font-medium uppercase text-sky-600 dark:text-sky-400">
          Split Workspace
        </p>
        <h1 className="text-2xl font-semibold">Two Independent Tab Panes</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Each side owns a separate tab controller. Drag the divider to resize.
        </p>
      </header>

      <div
        className="flex min-h-0 flex-1 overflow-hidden"
        ref={containerRef}
      >
        <div
          className="flex min-w-0"
          style={{ flexBasis: `${leftSize}%` }}
        >
          <PaneTabs controller={leftController} id="left" label="Left Pane" />
        </div>

        <div
          aria-label="Resize split panes"
          className="w-2 shrink-0 cursor-col-resize bg-zinc-200 transition-colors hover:bg-sky-500 dark:bg-zinc-800 dark:hover:bg-sky-500"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsResizing(true);
          }}
          role="separator"
        />

        <div
          className="flex min-w-0 flex-1"
          style={{ flexBasis: `${100 - leftSize}%` }}
        >
          <PaneTabs controller={rightController} id="right" label="Right Pane" />
        </div>
      </div>
    </main>
  );
}
