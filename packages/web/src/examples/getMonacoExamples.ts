import type { QEditorExample } from "./QEditorExample";

export function getMonacoExamples(): QEditorExample[] {
    return [
        {
            title: "Hello World, JavaScript",
            descr: "Simple Hello World in JavaScript, language specified explicitly.",
            props: {
                type: "monaco",
                mode: "code",
                readOnly: false,
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
                mode: "code",
                readOnly: false,
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
            title: "Hello World, no language",
            descr: "Simple Hello World in JavaScript, no language specified.",
            props: {
                type: "monaco",
                mode: "code",
                readOnly: false,
                code: "console.log('Hello, world!');",
            },
        },
        {
            title: "Read Only",
            descr: "Simple Hello World in JavaScript, read only mode.",
            props: {
                type: "monaco",
                mode: "code",
                code: "console.log('Hello, world!');",
                lang: "javascript",
                readOnly: true,
            },
        }, 
        {
            title: "Salaxy SCSS, from URL",
            descr: "A small SASS-file from CDN (salaxy.scss).",
            props: {
                type: "monaco",
                lang: "scss",
                readOnly: false,
                url: "https://cdn.salaxy.com/skins/sass/salaxy.scss",
            },
        },
        {
            title: "Salaxy CSS, from URL",
            descr: "Salaxy CSS, from URL, pretty big file (defaults to read-only).",
            props: {
                type: "monaco",
                lang: "css",
                url: "https://cdn.salaxy.com/skins/bs5/salaxy.css",
            },
        },
    ];
}