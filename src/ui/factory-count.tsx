import * as React from "react"
import { Button, Row, Col, InputNumber } from "antd"
import { Craftable } from "../items"
import { FactoryState } from "./factory"
import { buildFactory } from "../generator"
import { FactoryGraph, PerSecond } from "../graph"
import { FactoryInstruction, generateInstructions } from "./generate-instructions"
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
     * Set the production rate for a given item
     * @param item Item to set the number of assemblers
     */
    setProductionRate: (item: Craftable, rate: PerSecond) => void

    /**
     * Get the production rate for a given item
     * @param item Item to get assembler count
     */
    getProductionRate: (item: Craftable) => PerSecond

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
    getRequirements: () => Map<Craftable, { rate: PerSecond; maintain: number }>

    // the current FactoryGraph
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
    setFactoryInstructions: (instructions: FactoryInstruction[]) => void

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
            <ul>
                <li>
                    Produce Per Day: How many items to produce per day. Default value is the
                    production rate for a single industry.
                </li>
                <li>Maintain: How many items to maintain in the factory output container</li>
                <li>
                    Required Industries: The required number of industries producing this item to
                    fulfill the requested production rate
                </li>
            </ul>
            <Row>
                <Col span={3}>Item</Col>
                <Col span={3}>Produce Per Day</Col>
                <Col span={2}>Maintain</Col>
                <Col span={4}>Required Industries</Col>
            </Row>
            {props.selection.map(function (item) {
                const recipe = props.recipes.get(item)!
                // Get the number of industries required to satisfy production rate
                const numIndustries = Math.ceil(
                    props.getProductionRate(item) / (recipe.product.quantity / recipe.time),
                )
                return (
                    <Row key={item.name}>
                        <Col span={3}>
                            <label>{item.name}</label>
                        </Col>
                        <Col span={3}>
                            <InputNumber
                                min={0}
                                value={props.getProductionRate(item) * (24.0 * 3600.0)}
                                onChange={(value) =>
                                    props.setProductionRate(item, Number(value) / (24.0 * 3600.0))
                                }
                            />
                        </Col>
                        <Col span={2}>
                            <InputNumber
                                min={1}
                                value={props.getMaintainValue(item)}
                                onChange={(value) => props.setMaintainValue(item, Number(value))}
                            />
                        </Col>
                        <Col span={4}>{numIndustries}</Col>
                    </Row>
                )
            })}
            <Button
                type="primary"
                onClick={() => {
                    const newFactory = buildFactory(props.getRequirements(), props.factory)
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
