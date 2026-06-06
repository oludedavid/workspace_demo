"use client";

import type { TabButtonsViewProps } from "../types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TabButtons({
  groupId,
  tab,
  isActive,
  onTabSelect,
  onTabClose,
}: TabButtonsViewProps) {
  const tabButtonId = `${groupId}-${tab.id}`;
  const tabPanelId = `${groupId}-${tab.id}-panel`;

  return (
    <div
      role="presentation"
      data-tab-wrapper
      className={cx(
        "group/tab flex h-full min-w-0 shrink-0 items-center border-r border-zinc-200 transition-colors dark:border-zinc-800",
        isActive
          ? "bg-white dark:bg-zinc-900"
          : "bg-zinc-50 hover:bg-white dark:bg-zinc-950 dark:hover:bg-zinc-900",
        tab.disabled && "opacity-50",
      )}
    >
      <button
        aria-controls={tabPanelId}
        aria-selected={isActive}
        data-active={isActive}
        disabled={tab.disabled}
        id={tabButtonId}
        onClick={() => onTabSelect(groupId, tab.id)}
        role="tab"
        tabIndex={isActive ? 0 : -1}
        type="button"
        className={cx(
          "relative flex h-full min-w-0 items-center gap-2 px-3 text-sm outline-none transition-colors",
          "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500",
          "disabled:pointer-events-none disabled:cursor-not-allowed",
          "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-['']",
          isActive
            ? "text-zinc-950 after:bg-sky-500 dark:text-zinc-50"
            : "text-zinc-500 after:bg-transparent hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
        )}
      >
        <span className="max-w-44 truncate">{tab.title}</span>

        {tab.dirty ? (
          <span
            aria-label="Unsaved changes"
            title="Unsaved changes"
            className={cx(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              isActive ? "bg-sky-500" : "bg-amber-500",
            )}
          />
        ) : null}
      </button>

      {tab.closable && onTabClose ? (
        <button
          aria-label={`Close ${tab.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onTabClose(groupId, tab.id);
          }}
          type="button"
          className={cx(
            "mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm transition-colors",
            "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500",
            "dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
            isActive
              ? "opacity-100"
              : "opacity-0 group-hover/tab:opacity-100 focus:opacity-100",
          )}
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
}
