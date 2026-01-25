import type { Meta, StoryObj } from "@storybook/vue3";
import MonacoEditor from "../components/MonacoEditor.vue";

const meta = {
  title: "Editors/MonacoEditor",
  component: MonacoEditor,
  args: {
    code: `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Quartal"));`,
    lang: "typescript",
    readOnly: false,
    theme: "vs-dark",
  },
  render: (args) => ({
    components: { MonacoEditor },
    setup() {
      return { args };
    },
    template: '<div style="height: 400px"><MonacoEditor v-bind="args" /></div>',
  }),
} satisfies Meta<typeof MonacoEditor>;

export default meta;

type Story = StoryObj<typeof MonacoEditor>;

export const Default: Story = {};
