/**
 * main.ts
 * Create or update a factory graph to produce a set of elements.
 * lgfrbcsgo & Nikolaus - October 2020
 */
import { Item, items } from "./items"
import * as React from "react"
import { useMemo, useState } from "react"
import * as ReactDOM from "react-dom"
import { TreeSelect } from "antd"
import { compose, groupBy, toPairs, values } from "ramda"
import "antd/dist/antd.css"

function App() {
    const [selection, setSelection] = useState<Item[]>([])

    const treeData = useMemo(() => {
        const groupByCategory = compose(
            toPairs,
            groupBy((item: Item) => item.category),
        )
        const grouped = groupByCategory(values(items))
        return grouped.map(([category, items]) => ({
            title: category,
            value: category,
            children: items.map((item) => ({
                title: item.name,
                value: item.name,
            })),
        }))
    }, [items])

    return (
        <TreeSelect
            style={{ width: "100%" }}
            value={selection}
            dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
            treeData={treeData}
            placeholder="Please select"
            multiple
            allowClear
            showArrow
            treeCheckable
            onChange={setSelection}
        />
    )
}

const rootElement = document.getElementById("root")
ReactDOM.render(<App />, rootElement)
