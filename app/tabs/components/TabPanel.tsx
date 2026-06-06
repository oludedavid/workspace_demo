"use client";

import type { TabPanelViewProps } from "../types";

export default function TabPanel({
  id,
  labelledBy,
  isActive,
  children,
}: TabPanelViewProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      hidden={!isActive}
      id={id}
      role="tabpanel"
      tabIndex={0}
      className="h-full min-h-0 overflow-auto bg-white p-5 outline-none dark:bg-zinc-950"
    >
      {children}
    </section>
  );
}
