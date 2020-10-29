/**
 * ui/old-factory.ts
 * React components for updating an existing factory
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Upload, Button, message } from "antd"
import { AppState } from "./app"
import { FactoryState } from "./new-factory"
import { FactoryInstruction, FactoryVisualization, generateInstructions } from "./render-factory"
import { FactoryGraph } from "../graph"
import { deserialize } from "../serialize"

/**
 * Properties of the OldFactory component
 */
interface OldFactoryProps {
    /**
     * Set the parent application state
     * @param state the AppState
     */
    setAppState: (state: AppState) => void
}

/**
 * Start from existing factory component
 * @param props {@link OldFactoryProps}
 */
export function OldFactory({ setAppState }: OldFactoryProps) {
    // OldFactory state and instructions
    const [factoryState, setFactoryState] = React.useState<FactoryState>(FactoryState.COUNT)
    const [factoryInstructions, setFactoryInstructions] = React.useState<FactoryInstruction[]>([])
    // the FactoryGraph
    const [factory, setFactory] = React.useState<FactoryGraph>()

    switch (factoryState) {
        default:
            return (
                <React.Fragment>
                    <Button onClick={() => setAppState(AppState.HOME)}>Back</Button>
                    <br />
                    <Upload
                        accept=".json"
                        showUploadList={false}
                        beforeUpload={(file) => {
                            const reader = new FileReader()
                            reader.onload = () => {
                                const factoryJSON = reader.result as string
                                const factory = deserialize(factoryJSON)
                                setFactory(factory)
                                setFactoryInstructions(generateInstructions(factory))
                                setFactoryState(FactoryState.RENDER)
                            }
                            reader.readAsText(file)

                            return false
                        }}
                    >
                        <Button type="primary">Upload Factory JSON</Button>
                    </Upload>
                </React.Fragment>
            )
        case FactoryState.RENDER:
            return (
                <FactoryVisualization
                    factory={factory}
                    setFactoryState={setFactoryState}
                    instructions={factoryInstructions!}
                />
            )
    }
}
