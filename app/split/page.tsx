"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Tabs from "../tabs/api";
import {
  TabController,
  type TabControllerAdapter,
  type TabControllerOptions,
} from "../tabs/tab-controller";
import { useTabControllerState } from "../tabs/useTabController";
import { splitWorkspaceItems } from "./data";
import { renderSplitWorkspaceItem } from "./renderer";
import type { SplitWorkspaceItem } from "./type";

type PaneId = string;

interface SplitPane {
  id: PaneId;
  label: string;
  controller: TabController<SplitWorkspaceItem>;
}

const INITIAL_PANE_COUNT = 2;
const MIN_PANE_PERCENT = 12;

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

function createSplitPane(paneNumber: number): SplitPane {
  const id = `pane-${paneNumber}`;
  const label = `Pane ${paneNumber}`;

  return {
    id,
    label,
    controller: new TabController(
      splitTabAdapter,
      createPaneOptions(id, label),
    ),
  };
}

function createInitialPanes() {
  return Array.from({ length: INITIAL_PANE_COUNT }, (_, index) => {
    return createSplitPane(index + 1);
  });
}

function createInitialPaneSizes() {
  return Array.from({ length: INITIAL_PANE_COUNT }, () => {
    return 100 / INITIAL_PANE_COUNT;
  });
}

function appendPaneSize(currentSizes: number[]) {
  const nextPaneSize = Math.max(
    MIN_PANE_PERCENT,
    100 / (currentSizes.length + 1),
  );
  const totalCurrentSize = currentSizes.reduce((total, size) => {
    return total + size;
  }, 0);
  const remainingSize = 100 - nextPaneSize;
  const resizeRatio = remainingSize / totalCurrentSize;

  return [
    ...currentSizes.map((size) => {
      return size * resizeRatio;
    }),
    nextPaneSize,
  ];
}

function resizePanePair(
  sizes: number[],
  dividerIndex: number,
  pointerPercent: number,
) {
  const leftPaneSize = sizes[dividerIndex];
  const rightPaneSize = sizes[dividerIndex + 1];

  if (leftPaneSize === undefined || rightPaneSize === undefined) {
    return sizes;
  }

  const sizeBeforePair = sizes.slice(0, dividerIndex).reduce((total, size) => {
    return total + size;
  }, 0);
  const pairSize = leftPaneSize + rightPaneSize;
  const minimumPaneSize = Math.min(MIN_PANE_PERCENT, pairSize / 2);
  const rawLeftSize = pointerPercent - sizeBeforePair;
  const nextLeftSize = Math.min(
    pairSize - minimumPaneSize,
    Math.max(minimumPaneSize, rawLeftSize),
  );
  const nextSizes = [...sizes];

  nextSizes[dividerIndex] = nextLeftSize;
  nextSizes[dividerIndex + 1] = pairSize - nextLeftSize;

  return nextSizes;
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
  const nextPaneNumber = useRef(INITIAL_PANE_COUNT + 1);
  const [panes, setPanes] = useState(createInitialPanes);
  const [paneSizes, setPaneSizes] = useState(createInitialPaneSizes);
  const [resizingDividerIndex, setResizingDividerIndex] = useState<
    number | null
  >(null);

  const addPane = useCallback(() => {
    const pane = createSplitPane(nextPaneNumber.current);

    nextPaneNumber.current += 1;

    setPanes((currentPanes) => {
      return [...currentPanes, pane];
    });
    setPaneSizes((currentSizes) => {
      return appendPaneSize(currentSizes);
    });
  }, []);

  useEffect(() => {
    if (resizingDividerIndex === null) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const bounds = container.getBoundingClientRect();
      const pointerPercent =
        ((event.clientX - bounds.left) / bounds.width) * 100;

      setPaneSizes((currentSizes) => {
        return resizePanePair(
          currentSizes,
          resizingDividerIndex,
          pointerPercent,
        );
      });
    };

    const handlePointerUp = () => {
      setResizingDividerIndex(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizingDividerIndex]);

  return (
    <main className="flex h-dvh min-h-0 flex-col bg-zinc-100 p-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="mb-3 flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase text-sky-600 dark:text-sky-400">
            Split Workspace
          </p>
          <h1 className="text-2xl font-semibold">Independent Tab Panes</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Each pane owns a separate tab controller. New panes open to the
            right.
          </p>
        </div>

        <button
          className="shrink-0 border border-zinc-300 bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          onClick={addPane}
          type="button"
        >
          + Pane
        </button>
      </header>

      <div
        className="flex min-h-0 flex-1 overflow-hidden"
        ref={containerRef}
      >
        {panes.map((pane, index) => (
          <div
            className="contents"
            key={pane.id}
          >
            <div
              className="flex min-w-0"
              style={{ flexBasis: `${paneSizes[index]}%` }}
            >
              <PaneTabs
                controller={pane.controller}
                id={pane.id}
                label={pane.label}
              />
            </div>

            {index < panes.length - 1 ? (
              <div
                aria-label={`Resize ${pane.label} and ${
                  panes[index + 1]?.label
                }`}
                className="w-2 shrink-0 cursor-col-resize bg-zinc-200 transition-colors hover:bg-sky-500 dark:bg-zinc-800 dark:hover:bg-sky-500"
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setResizingDividerIndex(index);
                }}
                role="separator"
              />
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
