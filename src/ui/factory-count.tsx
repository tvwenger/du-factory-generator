import * as React from "react"
import { Button, Row, Col, InputNumber, Divider } from "antd"
import { Item, Recipe } from "../items"
import { FactoryState } from "./factory"
import { buildFactory } from "../generator"
import { FactoryGraph, PerSecond } from "../graph"
import { FactoryInstruction, generateInstructions } from "./generate-instructions"

/**
 * Properties of the FactoryCount component
 */
interface FactoryCountProps {
    /**
     * Set the parent NewFactory state
     * @param state parent component state
     */
    setFactoryState: (state: FactoryState) => void

    /**
     * Set the error message
     * @param error error message
     */
    setErrorMessage: (error: string) => void

    // Items selected to build
    selection: Item[]

    // Recipes for selected items
    recipes: Map<Item, Recipe>

    /**
     * Set the production rate and maintain value
     */
    setProductionRate: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>
    setMaintainValue: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>

    /**
     * Get the production rate for a given item
     * @param item Item to get assembler count
     */
    getProductionRate: (item: Item) => PerSecond

    /**
     * Get the maintain value for a given item
     * @param item Item to get maintain value
     */
    getMaintainValue: (item: Item) => number

    /**
     * Get factory production requirements
     */
    getRequirements: () => Map<Item, { rate: PerSecond; maintain: number }>

    // Talent levels
    talentLevels: { [key: string]: number }

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
            <h2>Select Production Quantity and Maintain Values</h2>
            <Divider orientation="left">Instructions</Divider>
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
            <Divider orientation="left">Set Production Quantity and Maintain Values</Divider>
            <Row className="tableHeader">
                <Col span={3}>Item</Col>
                <Col span={3}>Produce Per Day</Col>
                <Col span={2}>Maintain</Col>
                <Col span={4}>Required Industries</Col>
            </Row>
            {props.selection.map(function (item) {
                const recipe = props.recipes.get(item)!
                // Get the number of industries required to satisfy production rate
                const numIndustries = Math.ceil(
                    props.getProductionRate(item) / (recipe.quantity / recipe.time),
                )
                const setProductionRate = (value: number) => {
                    props.setProductionRate((prevState: { [key: string]: number }) => ({
                        ...prevState,
                        [item.name]: value,
                    }))
                }
                const setMaintainValue = (value: number) => {
                    props.setMaintainValue((prevState: { [key: string]: number }) => ({
                        ...prevState,
                        [item.name]: value,
                    }))
                }
                return (
                    <React.Fragment key={item.name}>
                        <MemorizedFactoryCountRow
                            setProductionRate={setProductionRate}
                            setMaintainValue={setMaintainValue}
                            item={item}
                            rate={props.getProductionRate(item) * (24.0 * 3600.0)}
                            value={props.getMaintainValue(item)}
                            numIndustries={numIndustries}
                        />
                    </React.Fragment>
                )
            })}
            <Button
                type="primary"
                onClick={() => {
                    try {
                        const newFactory = buildFactory(
                            props.getRequirements(),
                            props.talentLevels,
                            props.factory,
                        )
                        props.setFactory(newFactory)
                        props.setFactoryInstructions(
                            generateInstructions(newFactory, props.showDifferences),
                        )
                        props.setFactoryState(FactoryState.RENDER)
                    } catch (e) {
                        props.setFactoryState(FactoryState.ERROR)
                        props.setErrorMessage(e.message)
                    }
                }}
            >
                Next
            </Button>
        </React.Fragment>
    )
}

/**
 * Properties of the FactoryCountRow
 */
interface FactoryCountRowProps {
    setProductionRate: (rate: number) => void
    setMaintainValue: (value: number) => void
    item: Item
    rate: number
    value: number
    numIndustries: number
}

/**
 * Single row of the factory count
 */
function FactoryCountRow(props: FactoryCountRowProps) {
    return (
        <Row style={{ marginBottom: 2 }}>
            <Col span={3}>
                <label>{props.item.name}</label>
            </Col>
            <Col span={3}>
                <InputNumber
                    min={0}
                    value={props.rate}
                    onChange={(value) => props.setProductionRate(Number(value) / (24.0 * 3600.0))}
                />
            </Col>
            <Col span={2}>
                <InputNumber
                    min={1}
                    value={props.value}
                    onChange={(value) => props.setMaintainValue(Number(value))}
                />
            </Col>
            <Col span={4}>{props.numIndustries}</Col>
        </Row>
    )
}
function sameRow(oldProps: FactoryCountRowProps, newProps: FactoryCountRowProps) {
    return oldProps.rate === newProps.rate && oldProps.value === newProps.value
}
const MemorizedFactoryCountRow = React.memo(FactoryCountRow, sameRow)
