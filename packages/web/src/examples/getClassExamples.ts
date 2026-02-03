import type { QEditorExample } from "./QEditorExample";

export function getClassExamples(): QEditorExample[] {
  return [{
    title: "Salaxy Row types example",
    descr: "Basic Salaxy Row types example. New JavaScript format with types support.",
    props: {
      type: "class",
      url: "/examples/class-editor/monthlySalary.js",
      readOnly: false,
      view: "single-class"
    },
  },
    {
      title: "Simple HelloWorld class",
      descr: "A simple HelloWorld class with a few methods.",
      props: {
        type: "class",
        view: "single-class",
        code: `class HelloWorld {
  private _name: string = "World";

  constructor(name: string) {
    this._name = name;
  }

  /**
   * Says hello to the current name.
   * @param name The name to say hello to, default is the current name.
   * @param times The number of times to say hello, default is 1.
   */
  public sayHello(name?: string, times: number = 1): void {
    for (let i = 0; i < times; i++) {
      console.log("Hello, " + (name ?? this._name) + "!");
    }
  }

  /** Gets the current name. */
  public get name(): string {
    return this._name;
  }

  /** Sets the current name. */
  public set name(value: string) {
    this._name = value;
  }

}`,
      },
    }, {
      title: "Row type scripts (TS)",
      descr: "A file with multiple classes with row type scripts (TypeScript / not in use in UI)",
      props: {
        type: "class",
        view: "multi-class",
        url: "/examples/class-editor/RowTypeScriptsSamples.ts",
      },
    },
    {
      title: "Complex class",
      descr: "A complex class single class with a few methods",
      props: {
        type: "class",
        view: "single-class",
        url: "/examples/class-editor/SampleScript1.ts",
      },
    },
    {
      title: "Long running (asyc) scripts (multi)",
      descr: "3 complex classes with a few methods",
      props: {
        type: "class",
        view: "multi-class",
        url: "/examples/class-editor/BeforeCalcScriptsSamples.ts",
      },
    }
  ];
}