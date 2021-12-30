import * as React from "react"
import { Button, Upload } from "antd"
import { ItemSelect } from "./item-select"
import { FactoryState } from "./factory"
import { Item } from "../items"
import { PerSecond } from "../graph"

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
    items: Item[]

    // items to craft
    selection: Item[]

    /**
     * Set the selection of items to craft
     * @param selection items to craft
     */
    setSelection: (selection: Item[]) => void

    /**
     * Set the production rate and maintain value
     */
    setProductionRate: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>
    setMaintainValue: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>
}

/**
 * Factory select elements to build component
 * @param props {@link FactorySelectProps}
 */
export function FactorySelect(props: FactorySelectProps) {
    return (
        <React.Fragment>
            <h2>Select items to build:</h2>
            <ul>
                <li>Start typing the item name to filter</li>
                <li>
                    Or, upload a CSV file formatted like:{" "}
                    <pre>
                        Item Name, Number to produce per day, Number to maintain in output contanier
                    </pre>
                </li>
            </ul>
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
                        const myItems: Item[] = []
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
                            props.setProductionRate((prevState: { [key: string]: number }) => ({
                                ...prevState,
                                [item.name]: Number(parts[1].trim()) / (24 * 3600),
                            }))
                            props.setMaintainValue((prevState: { [key: string]: number }) => ({
                                ...prevState,
                                [item.name]: Number(parts[2].trim()),
                            }))
                        }
                        props.setSelection(myItems)
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
