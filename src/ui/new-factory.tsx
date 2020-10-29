/**
 * ui/new-factory.ts
 * React components for creating a new factory
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Craftable, isCraftable, ITEMS } from "../items"
import { values } from "ramda"
import { ItemSelect } from "./item-select"
import { useMap } from "./app"
import { Button, Row, Col, InputNumber } from "antd"
import { buildFactory } from "../factory"
import { FactoryGraph, FactoryNode } from "../graph"
import { AppState } from "./app"
import { FactoryInstruction, generateInstructions, FactoryVisualization } from "./render-factory"

export enum FactoryState {
    SELECT = "select",
    COUNT = "count",
    RENDER = "render",
}

/**
 * Properties of the NewFactory component
 */
interface NewFactoryProps {
    /**
     * Set the parent application state
     * @param state the AppState
     */
    setAppState: (state: AppState) => void
}

/**
 * New Factory component
 * @param props {@link NewFactoryProps}
 */
export function NewFactory({ setAppState }: NewFactoryProps) {
    // all possible craftable items
    const items = React.useMemo(() => values(ITEMS).filter(isCraftable), [ITEMS])
    // NewFactory state and factory instructions
    const [factoryState, setFactoryState] = React.useState<FactoryState>(FactoryState.SELECT)
    const [factoryInstructions, setFactoryInstructions] = React.useState<FactoryInstruction[]>([])
    // produced items, industry count, and maintain count
    const [selection, setSelection] = React.useState<Craftable[]>([])
    const [industryCount, setIndustryCount] = useMap<Craftable, number>()
    const [maintainValue, setMaintainValue] = useMap<Craftable, number>()
    // the FactoryGraph
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
                    <NewFactorySelect
                        setFactoryState={setFactoryState}
                        items={items}
                        selection={selection}
                        setSelection={setSelection}
                    />
                </React.Fragment>
            )
        case FactoryState.COUNT:
            return (
                <React.Fragment>
                    <Button onClick={() => setFactoryState(FactoryState.SELECT)}>Back</Button>
                    <NewFactoryCount
                        selection={selection}
                        setFactoryState={setFactoryState}
                        setIndustryCount={setIndustryCount}
                        getIndustryCount={getIndustryCount}
                        setMaintainValue={setMaintainValue}
                        getMaintainValue={getMaintainValue}
                        getRequirements={getRequirements}
                        setFactory={setFactory}
                        setFactoryInstructions={setFactoryInstructions}
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
 * Properties of the NewFactory child components
 */
interface NewFactoryChildrenProps {
    /**
     * Set the parent NewFactory state
     * @param state parent component state
     */
    setFactoryState: (state: FactoryState) => void
}

/**
 * Properties of the NewFactorySelect component
 */
interface NewFactorySelectProps extends NewFactoryChildrenProps {
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
 * New Factory select elements to build component
 * @param props {@link NewFactorySelectProps}
 */
function NewFactorySelect({
    setFactoryState,
    items,
    selection,
    setSelection,
}: NewFactorySelectProps) {
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

/**
 * Properties of the NewFactoryCount component
 */
interface NewFactoryCountProps extends NewFactoryChildrenProps {
    // Items selected to build
    selection: Craftable[]

    /**
     * Set the number of assemblers for a given item
     * @param item Item to set the number of assemblers
     */
    setIndustryCount: (item: Craftable, num: number) => void

    /**
     * Get the assembler count for a given item
     * @param item Item to get assembler count
     */
    getIndustryCount: (item: Craftable) => number

    /**
     * Set the maintain value for a given item
     * @param item Item to set the maintain value
     */
    setMaintainValue: (item: Craftable, num: number) => void

    /**
     * Get the maintain value for a given item
     * @param item Item to get maintain value
     */
    getMaintainValue: (item: Craftable) => number

    /**
     * Get factory production requirements
     */
    getRequirements: () => Map<Craftable, { count: number; maintain: number }>

    /**
     * Set the factory graph
     * @param factory the FactoryGraph
     */
    setFactory: (factory: FactoryGraph) => void

    /**
     * Set the factory instructions
     * @param factoryInstructions the FactoryInstructions
     */
    setFactoryInstructions: (factory: FactoryInstruction[]) => void
}

/**
 * New Factory get number of assembers and maintain value
 * @param props {@link NewFactoryCountProps}
 */
function NewFactoryCount(props: NewFactoryCountProps) {
    return (
        <React.Fragment>
            <h2>Select production quantity:</h2>
            <Row>
                <Col span={3}>Item</Col>
                <Col span={2}>Assemblers</Col>
                <Col span={2}>Maintain</Col>
            </Row>
            {props.selection.map((item) => (
                <Row key={item.name}>
                    <Col span={3}>
                        <label>{item.name}</label>
                    </Col>
                    <Col span={2}>
                        <InputNumber
                            min={1}
                            value={props.getIndustryCount(item)}
                            onChange={(value) => props.setIndustryCount(item, Number(value))}
                        />
                    </Col>
                    <Col span={2}>
                        <InputNumber
                            min={1}
                            value={props.getMaintainValue(item)}
                            onChange={(value) => props.setMaintainValue(item, Number(value))}
                        />
                    </Col>
                </Row>
            ))}
            <Button
                type="primary"
                onClick={() => {
                    const factory = buildFactory(props.getRequirements())
                    props.setFactory(factory)
                    props.setFactoryInstructions(generateInstructions(factory))
                    props.setFactoryState(FactoryState.RENDER)
                }}
            >
                Next
            </Button>
        </React.Fragment>
    )
}
