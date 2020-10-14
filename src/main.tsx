/**
 * main.ts
 * Create or update a factory graph to produce a set of elements.
 * lgfrbcsgo & Nikolaus - October 2020
 */
import { items, Item } from "./items"
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

var requirements: Map<Item, number> = new Map()
const selectItem = items

function submit() {
    console.log("submit!")
}

function App() {
    let rows = []
    requirements.forEach((value, key) =>
        rows.push(
            <tr>
                <td data-item={key} onClick={this.updateItem}>
                    key
                </td>
                <td data-item={key} onClick={this.updateValue}>
                    value
                </td>
            </tr>,
        ),
    )
    /**
    let newRow = []
    newRow.push(<tr><td><select name="newRequirement">)
     

    let elements = []
    for (const item of Object.keys(items)) {
        elements.push(item)
    }
    */
    return (
        <div>
            <h2>Requirements</h2>
            <table>
                <thead>
                    <tr>
                        <td>Product</td>
                        <td>Assemblers</td>
                    </tr>
                </thead>
                <tbody>{requirements.forEach()}</tbody>
            </table>
            <button onClick={submit}>Submit</button>
        </div>
    )
}

const rootElement = document.getElementById("root")
ReactDOM.render(<App />, rootElement)
