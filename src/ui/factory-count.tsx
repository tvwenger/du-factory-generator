/**
 * factory-count.tsx
 * Component for selecting new factory assembler quantities and maintain values
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Button, Row, Col, InputNumber } from "antd"
import { Craftable } from "../items"
import { FactoryState } from "./factory"
import { buildFactory } from "../factory"
import { FactoryGraph } from "../graph"
import { FactoryInstruction, generateInstructions } from "./factory-instruction"

/**
 * Properties of the FactoryCount component
 */
interface FactoryCountProps {
    /**
     * Set the parent NewFactory state
     * @param state parent component state
     */
    setFactoryState: (state: FactoryState) => void

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

    // the existing FactoryGraph
    factory: FactoryGraph | undefined

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
 * Factory get number of assembers and maintain value
 * @param props {@link NewFactoryCountProps}
 */
export function FactoryCount(props: FactoryCountProps) {
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
                    const newFactory = buildFactory(props.getRequirements(), props.factory)
                    props.setFactory(newFactory)
                    props.setFactoryInstructions(generateInstructions(newFactory))
                    props.setFactoryState(FactoryState.RENDER)
                }}
            >
                Next
            </Button>
        </React.Fragment>
    )
}
