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

function submit() {
    console.log("submit!")
}

function App() {
    let elements = []
    for (const item of Object.keys(items)) {
        elements.push(item)
    }
    return (
        <div>
            <table>
                {elements.map((value, index) => {
                    return (
                        <tr>
                            <td>{value}:</td>
                            <td>
                                <input type="number" min="0" id="{value}"></input>
                            </td>
                        </tr>
                    )
                })}
            </table>
            <button onClick={submit}>Submit</button>
        </div>
    )
}

const rootElement = document.getElementById("root")
ReactDOM.render(<App />, rootElement)
