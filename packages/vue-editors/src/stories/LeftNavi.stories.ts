import type { Meta, StoryObj } from "@storybook/vue3";
import LeftNavi from "../components/LeftNavi.vue";
import { navItems } from "../data/navItems";

const meta = {
  title: "Layout/LeftNavi",
  component: LeftNavi,
  args: {
    navItems,
    currentPath: "/test/monaco",
  },
} satisfies Meta<typeof LeftNavi>;

export default meta;

type Story = StoryObj<typeof LeftNavi>;

export const Default: Story = {};
