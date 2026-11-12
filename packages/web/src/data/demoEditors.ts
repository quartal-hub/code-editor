import type { EditorType } from "@quartal/code-editors-core";
import { navItems, type NavItemEditor } from "./navItems";

/** The editors that have pages on the site (Intro, Getting Started, API and samples): the ones in the navigation. */
export const demoEditors: NavItemEditor[] = navItems
  .filter((item) => item.path !== "/")
  .map((item) => ({ ...item, editor: item.path.split("/")[1] as EditorType }));

/** The page ids that a sample id must not take: they are the other pages of an editor. */
export const reservedPageIds = ["getting-started", "api"];
