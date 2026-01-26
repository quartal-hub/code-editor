import type { NavItem } from "../model";

export class TestData {

    /** Gets some navi items for testing top and left navigation. */
    public static getNavItems(): NavItem[] {
        return [
            {
                path: "/",
                label: "Home",
                description: "Home page"
            }, {
                path: "/test/monaco",
                label: "Monaco Editor",
                description: "Monaco editor for testing"
            }, {
                path: "/test/project",
                label: "Project Editor",
                description: "Project editor for testing"
            }, {
                path: "/test/vibe-coding",
                label: "Vibe Coding",
                description: "Vibe coding for testing"
            },
        ];
    }

}