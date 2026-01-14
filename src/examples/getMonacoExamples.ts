import { QEditorExample } from "./QEditorExample";

export function getMonacoExamples(): QEditorExample[] {
    return [
        {
            title: "Hello World",
            descr: "Simple Hello World in JavaScript, no language specified.",
            props: {
                type: "monaco",
                code: "console.log('Hello, world!');",
            },
        },
        {
            title: "Hello World, JavaScript",
            descr: "Simple Hello World in JavaScript, language specified explicitly.",
            props: {
                type: "monaco",
                code: `function sayHello() {
    console.log('Hello, JavaScript at ' + new Date().toTimeString());
}

sayHello();`,
                lang: "javascript",
            },
        },
        {
            title: "Hello World, TypeScript",
            descr: "Simple Hello World in TypeScript, language specified explicitly.",
            props: {
                type: "monaco",
                code: `enum Greetings {
    Hello = "Hello world",
    GoodMorning = "Good morning"
}

/**
 * Sends a greeting to the console.
 * @param greeting Greeting to show
 * @param target Target of the greeting, default is "World"
 */
function sayHello(greeting: Greetings, target?: string) {
    console.log(\`\${greeting} \${target || "World"} at \${new Date().toTimeString()}\`);
}

sayHello(Greetings.GoodMorning, "Typescript");`,
                lang: "typescript",
            },
        },
        {
            title: "Read Only",
            descr: "Simple Hello World in JavaScript, read only mode.",
            props: {
                type: "monaco",
                code: "console.log('Hello, world!');",
                lang: "javascript",
                mode: "read-only",
            },
        }
    ];
}