import { QEditorExample } from "./QEditorExample";

export function getExpressionExamples(): QEditorExample[] {
    return [
        {
            title: "Calculation",
            descr: "Calculates 1 + 2",
            props: {
                type: "expression",
                code: "1 + 2",
            },
        },
        {
            title: "Read only",
            descr: "Read only mode",
            props: {
                type: "expression",
                code: "1 + 2",
                mode: "read-only",
            },
        },
        {
            title: "Plain mode",
            descr: "Plain mode is just the Monaco editor part without the Excel-like UI",
            props: {
                type: "expression",
                code: "1 + 2",
                mode: "plain",
            },
        },
        {
            title: "String Concatenation",
            descr: "Concatenate 'Hello, ' and 'world!'",
            props: {
                type: "expression",
                code: "'Hello, ' + 'world!'",
            },
        },
        {
            title: "Boolean Result",
            descr: "Boolean expression result: 3 > 1",
            props: {
                type: "expression",
                code: "3 > 1",
            },
        },
        {
            title: "Current Time",
            descr: "Get current time using Date",
            props: {
                type: "expression",
                code: "new Date().toLocaleTimeString()",
            },
        },
        {
            title: "Random Value",
            descr: "Get a random number between 0 and 1",
            props: {
                type: "expression",
                code: "Math.random()",
            },
        },
        {
            title: "Call Math Function",
            descr: "Get the square root of 25",
            props: {
                type: "expression",
                code: "Math.sqrt(25)",
            },
        },
        {
            title: "Call JavaScript Function",
            descr: "Call Array.join to combine elements with commas",
            props: {
                type: "expression",
                code: "[1, 2, 3].join(', ')",
            },
        },
    ];
}