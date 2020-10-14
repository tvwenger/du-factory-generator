/**
 * main.ts
 * Create or update a factory graph to produce a set of elements.
 * lgfrbcsgo & Nikolaus - October 2020
 */
import { isCraftable, Item, ITEMS } from "./items"
import * as React from "react"
import { useMemo, useState } from "react"
import * as ReactDOM from "react-dom"
import "antd/dist/antd.css"
import { ItemSelect } from "./components/item-select"
import { values } from "ramda"

function App() {
    const [selection, setSelection] = useState<Item[]>([])

    const items = useMemo(() => values(ITEMS).filter(isCraftable), [ITEMS])

    return <ItemSelect items={items} selection={selection} onSelection={setSelection} />
}

const rootElement = document.getElementById("root")
ReactDOM.render(<App />, rootElement)
