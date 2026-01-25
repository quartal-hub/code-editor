import type { Meta, StoryObj } from "@storybook/vue3";
import TopNavi from "../components/TopNavi.vue";
import { TestData } from "./TestData";

const meta = {
  title: "Layout/TopNavi",
  component: TopNavi,
  args: {
    navItems: TestData.getNavItems(),
    currentPath: "/test/monaco",
  },
} satisfies Meta<typeof TopNavi>;

export default meta;

type Story = StoryObj<typeof TopNavi>;

export const Default: Story = {};
