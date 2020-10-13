/**
 * main.ts
 * Create or update a factory graph to produce a set of elements.
 * lgfrbcsgo & Nikolaus - October 2020
 */
import { items } from "./items"
import { buildFactory } from "./factory"
import * as React from "react"
import * as ReactDOM from "react-dom"

Object.assign(window, {
    items,
    buildFactory,
})

console.log(
    `
// produce each item with two assemblers
const requirements = new Map([
    [items["Adjustor L"], 2],
    [items["Vertical Booster L"], 2],
    [items["Retro-Rocket Brake L"], 2],
])
const factory = buildFactory(requirements)
`,
    "color: #000099",
)

function App() {
    return <h1>Open the Javascript console</h1>
}

const rootElement = document.getElementById("root")
ReactDOM.render(<App />, rootElement)
