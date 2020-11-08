/**
 * factory.tsx
 * React component for creating or updating a factory
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Craftable, isCraftable, ITEMS } from "../items"
import { values } from "ramda"
import { useMap, AppState } from "./app"
import { Button, Upload, Row, Col } from "antd"
import { FactorySelect } from "./factory-select"
import { FactoryCount } from "./factory-count"
import { FactoryGraph, isOutputNode } from "../graph"
import { FactoryVisualization } from "./render-factory"
import { FactoryInstruction, generateInstructions } from "./factory-instruction"
import { deserialize } from "../serialize"

export enum FactoryState {
    UPLOAD = "upload",
    SELECT = "select",
    COUNT = "count",
    RENDER = "render",
}

/**
 * Properties of the Factory component
 */
interface FactoryProps {
    /**
     * Set the parent application state
     * @param state the AppState
     */
    setAppState: (state: AppState) => void

    // Starting factory state
    startFactoryState: FactoryState
}

/**
 * Factory component
 * @param props {@link FactoryProps}
 */
export function Factory({ setAppState, startFactoryState }: FactoryProps) {
    // all possible craftable items
    const items = React.useMemo(() => values(ITEMS).filter(isCraftable), [ITEMS])
    // current and previous factory state
    const [factoryState, setFactoryState] = React.useState<FactoryState>(startFactoryState)
    //  factory building instructions instructions
    const [factoryInstructions, setFactoryInstructions] = React.useState<FactoryInstruction[]>([])
    // produced items, industry count, and maintain count
    const [selection, setSelection] = React.useState<Craftable[]>([])
    const [industryCount, setIndustryCount] = useMap<Craftable, number>()
    const [maintainValue, setMaintainValue] = useMap<Craftable, number>()
    // the FactoryGraph and a flag to show differences
    const [showDifferences, setShowDifferences] = React.useState<boolean>(false)
    const [startingFactory, setStartingFactory] = React.useState<FactoryGraph>()
    const [factory, setFactory] = React.useState<FactoryGraph>()
    // parse the industry and maintain values, generate requirements
    const getIndustryCount = (item: Craftable) => industryCount.get(item) || 1
    const getMaintainValue = (item: Craftable) => maintainValue.get(item) || 1
    const getRequirements = () =>
        new Map<Craftable, { count: number; maintain: number }>(
            selection.map((item) => [
                item,
                { count: getIndustryCount(item), maintain: getMaintainValue(item) },
            ]),
        )

    switch (factoryState) {
        default:
            return (
                <React.Fragment>
                    <Button onClick={() => setAppState(AppState.HOME)}>Back</Button>
                    <ExistingFactorySummary factory={startingFactory} />
                    <FactorySelect
                        setFactoryState={setFactoryState}
                        items={items}
                        selection={selection}
                        setSelection={setSelection}
                    />
                </React.Fragment>
            )
        case FactoryState.UPLOAD:
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
                                setShowDifferences(true)
                                setStartingFactory(factory)
                                setFactoryState(FactoryState.SELECT)
                            }
                            reader.readAsText(file)
                            // skip upload
                            return false
                        }}
                    >
                        <Button type="primary">Upload Factory JSON</Button>
                    </Upload>
                </React.Fragment>
            )
        case FactoryState.COUNT:
            return (
                <React.Fragment>
                    <Button onClick={() => setFactoryState(FactoryState.SELECT)}>Back</Button>
                    <ExistingFactorySummary factory={startingFactory} />
                    <FactoryCount
                        selection={selection}
                        setFactoryState={setFactoryState}
                        setIndustryCount={setIndustryCount}
                        getIndustryCount={getIndustryCount}
                        setMaintainValue={setMaintainValue}
                        getMaintainValue={getMaintainValue}
                        getRequirements={getRequirements}
                        startingFactory={startingFactory}
                        setFactory={setFactory}
                        setFactoryInstructions={setFactoryInstructions}
                        showDifferences={showDifferences}
                    />
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

/**
 * Properties of the ExistingFactorySummary component
 */
interface ExistingFactorySummaryProps {
    // the factory graph
    factory: FactoryGraph | undefined
}

/**
 * ExistingFactoryFactory component
 * @param props {@link ExistingFactorySummaryProps}
 */
export function ExistingFactorySummary({ factory }: ExistingFactorySummaryProps) {
    if (factory === undefined) {
        return <React.Fragment></React.Fragment>
    }

    const elements = []
    for (const output of factory.containers) {
        if (isOutputNode(output)) {
            const element = (
                <Row key={output.name}>
                    <Col span={3}>{output.item.name}</Col>
                    <Col span={2}>{output.producers.size}</Col>
                    <Col span={2}>{output.maintainedOutput}</Col>
                </Row>
            )
            elements.push(element)
        }
    }

    if (elements.length > 0) {
        return (
            <React.Fragment>
                <h2>Existing Factory Production</h2>
                <Row>
                    <Col span={3}>Item</Col>
                    <Col span={2}>Assemblers</Col>
                    <Col span={2}>Maintain</Col>
                </Row>
                {elements}
            </React.Fragment>
        )
    }
    return <React.Fragment></React.Fragment>
}
