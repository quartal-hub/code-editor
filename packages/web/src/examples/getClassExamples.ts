import type { QEditorExample } from "./QEditorExample";

export function getClassExamples(): QEditorExample[] {
  return [
    {
      title: "Simple class",
      descr: "A simple class with a few methods (inlined).",
      props: {
        type: "class",
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
      title: "Row type scripts",
      descr: "A class with row type scripts",
      props: {
        type: "class",
        url: "/examples/class-editor/RowTypeScriptsSamples.ts",
      },
    },
    {
      title: "Complex class",
      descr: "A complex class with a few methods",
      props: {
        type: "class",
        url: "/examples/class-editor/SampleScript1.ts",
      },
    },
    {
      title: "Long runninc (asyc) scripts",
      descr: "A complex class with a few methods",
      props: {
        type: "class",
        url: "/examples/class-editor/BeforeCalcScriptsSamples.ts",
      },
    }
  ];
}