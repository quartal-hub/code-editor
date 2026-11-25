import type { QEditorExample } from "./QEditorExample";

export function getMonacoExamples(): QEditorExample[] {
    return [
        {
            title: "Hello World, JavaScript",
            descr: "Simple Hello World in JavaScript, language specified explicitly.",
            mode: "event",
            props: {
                type: "monaco",
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
            mode: "event",
            props: {
                type: "monaco",
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
            mode: "event",
            props: {
                type: "monaco",
                readOnly: false,
                code: "console.log('Hello, world!');",
            },
        },
        {
            title: "Diff",
            descr: "The code compared with an earlier version: the original on the left (read-only), the code on the right (editable). Unchanged lines are collapsed: click the bar to show them. In a narrow editor, Monaco shows the diff inline.",
            mode: "event",
            props: {
                type: "monaco",
                readOnly: false,
                original: `function sayHello() {
    console.log('Hello, JavaScript');
}

/** Formats a date as d.m.yyyy. */
function formatDate(date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
}

/** Adds days to a date. */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/** Days between two dates. */
function daysBetween(from, to) {
    return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

/** True for Saturday and Sunday. */
function isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
}

sayHello();`,
                code: `/** Says hello, with the time. */
function sayHello(target = 'JavaScript') {
    console.log('Hello, ' + target + ' at ' + new Date().toTimeString());
}

/** Formats a date as d.m.yyyy. */
function formatDate(date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
}

/** Adds days to a date. */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/** Days between two dates. */
function daysBetween(from, to) {
    return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

/** True for Saturday and Sunday. */
function isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
}

sayHello();
sayHello('Diff');`,
                lang: "javascript",
            },
        },
        {
            title: "Read Only",
            descr: "Simple Hello World in JavaScript, read only.",
            mode: "event",
            props: {
                type: "monaco",
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