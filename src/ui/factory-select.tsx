/**
 * factory-select.tsx
 * Component for selecting new factory production items
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Button, Upload } from "antd"
import { compose } from "ramda"
import { ItemSelect } from "./item-select"
import { Craftable } from "../items"
import { FactoryState } from "./factory"

/**
 * Properties of the FactorySelect component
 */
interface FactorySelectProps {
    /**
     * Set the parent NewFactory state
     * @param state parent component state
     */
    setFactoryState: (state: FactoryState) => void

    // all craftable items
    items: Craftable[]

    // items to craft
    selection: Craftable[]

    /**
     * Set the selection of items to craft
     * @param selection items to craft
     */
    setSelection: (selection: Craftable[]) => void

    /**
     * Set the number of assemblers map
     * @param item Item to set the number of assemblers
     */
    setIndustryCountMap: (map: Map<Craftable, number>) => void

    /**
     * Set the maintain value map
     * @param item Item to set the maintain value
     */
    setMaintainValueMap: (map: Map<Craftable, number>) => void
}

/**
 * Factory select elements to build component
 * @param props {@link FactorySelectProps}
 */
export function FactorySelect(props: FactorySelectProps) {
    return (
        <React.Fragment>
            <h2>Select elements to build:</h2>
            <ItemSelect items={props.items} value={props.selection} onChange={props.setSelection} />
            <Button type="primary" onClick={() => props.setFactoryState(FactoryState.COUNT)}>
                Next
            </Button>
            <Upload
                accept=".csv"
                showUploadList={false}
                beforeUpload={(file) => {
                    const reader = new FileReader()
                    reader.onload = () => {
                        const result = reader.result as string
                        const lines = result.split("\n")
                        const myItems: Craftable[] = []
                        const assemblerMap: Map<Craftable, number> = new Map()
                        const maintainMap: Map<Craftable, number> = new Map()
                        for (const line of lines) {
                            const parts = line.split(",")
                            if (
                                parts[0].trim() === "" ||
                                parts[1].trim() === "" ||
                                parts[2].trim() === ""
                            ) {
                                continue
                            }
                            const item = props.items.find(
                                (element) => element.name === parts[0].trim(),
                            )
                            if (item === undefined) {
                                console.log("Item " + parts[0].trim() + "not found")
                                continue
                            }
                            myItems.push(item)
                            assemblerMap.set(item, Number(parts[1].trim()))
                            maintainMap.set(item, Number(parts[2].trim()))
                        }
                        props.setSelection(myItems)
                        props.setIndustryCountMap(assemblerMap)
                        props.setMaintainValueMap(maintainMap)
                        props.setFactoryState(FactoryState.COUNT)
                    }
                    reader.readAsText(file)
                    // skip upload
                    return false
                }}
            >
                <Button>Upload CSV</Button>
            </Upload>
        </React.Fragment>
    )
}
