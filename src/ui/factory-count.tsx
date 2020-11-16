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
import { Recipe } from "../recipes"

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

    // Recipes for selected items
    recipes: Map<Craftable, Recipe>

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

    // the starting FactoryGraph
    startingFactory: FactoryGraph | undefined

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

    // flag to show differences from original factory
    showDifferences: boolean
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
                <Col span={4}>Production Rate</Col>
            </Row>
            {props.selection.map(function (item) {
                const recipe = props.recipes.get(item)!
                // per minute
                let productionRate =
                    (60.0 * props.getIndustryCount(item) * recipe.product.quantity) / recipe.time
                let unit = "minute"
                if (productionRate < 1.0) {
                    productionRate *= 60.0
                    unit = "hour"
                }
                if (productionRate < 1.0) {
                    productionRate *= 24.0
                    unit = "day"
                }
                // round to 2 decimals
                productionRate = Math.round(productionRate * 100) / 100
                return (
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
                        <Col span={4}>{productionRate + " / " + unit}</Col>
                    </Row>
                )
            })}
            <Button
                type="primary"
                onClick={() => {
                    const newFactory = buildFactory(props.getRequirements(), props.startingFactory)
                    props.setFactory(newFactory)
                    props.setFactoryInstructions(
                        generateInstructions(newFactory, props.showDifferences),
                    )
                    props.setFactoryState(FactoryState.RENDER)
                }}
            >
                Next
            </Button>
        </React.Fragment>
    )
}
