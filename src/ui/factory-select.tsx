/**
 * factory-select.tsx
 * Component for selecting new factory production items
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Button } from "antd"
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
}

/**
 * Factory select elements to build component
 * @param props {@link FactorySelectProps}
 */
export function FactorySelect({
    setFactoryState,
    items,
    selection,
    setSelection,
}: FactorySelectProps) {
    return (
        <React.Fragment>
            <h2>Select elements to build:</h2>
            <ItemSelect items={items} value={selection} onChange={setSelection} />
            <Button type="primary" onClick={() => setFactoryState(FactoryState.COUNT)}>
                Next
            </Button>
        </React.Fragment>
    )
}
