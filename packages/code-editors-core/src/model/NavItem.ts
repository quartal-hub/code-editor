/**
 * An item in the Navigation menu.
 * TODO: Consider syncing with @quartal/core SiteMap (or similar).
 */
export interface NavItem {
  /** The path to the page. */
  path: string;
  /** The label of the item. */
  label: string;
  /** The description of the item. */
  description: string;
  /** If true, the item is listed on the front page but not in the top menu. */
  hideInTopMenu?: boolean;
}