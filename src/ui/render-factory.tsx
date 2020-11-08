/**
 * ui/render-factory.ts
 * React component for visualizing a factory graph
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Button } from "antd"
import { Category, Tier, ITEMS } from "../items"
import { FactoryGraph, MAX_CONTAINER_LINKS } from "../graph"
import { FactoryState } from "./factory"
import { serialize } from "../serialize"
import { FactoryInstruction } from "./factory-instruction"
import { FactoryMap } from "./factory-map"

enum VisualizationState {
    INSTRUCTIONS = "instructions",
    MAP = "map",
}

// order that the factory is visualized
export const CATEGORY_ORDER = [
    Category.ORE,
    Category.PURE,
    Category.PRODUCT,
    Category.CATALYST,
    Category.STRUCTURAL_PARTS,
    Category.INTERMEDIARY_PARTS,
    Category.COMPLEX_PARTS,
    Category.EXCEPTIONAL_PARTS,
    Category.FUNCTIONAL_PARTS,
    Category.AMMO,
    Category.FUEL,
    Category.ANTI_GRAVITY,
    Category.ITEM_CONTAINERS,
    Category.FUEL_TANKS,
    Category.CONTROL,
    Category.DECORATIVE,
    Category.FLIGHT_CONTROL,
    Category.AIRFOIL,
    Category.ENGINES,
    Category.INDUSTRY,
    Category.INSTRUMENTS,
    Category.INTERACTIVE,
    Category.LIGHT,
    Category.LOGIC,
    Category.PROJECTOR,
    Category.REPAIR,
    Category.RESURRECTION,
    Category.SEAT,
    Category.SENSOR,
    Category.SURROGATE,
    Category.WARP,
    Category.WEAPON,
    Category.CORE_UNIT,
    Category.TERRITORY_UNIT,
]
export const TIER_ORDER = [
    Tier.BASIC,
    Tier.UNCOMMON,
    Tier.ADVANCED,
    Tier.RARE,
    Tier.EXOTIC,
    Tier.ELEMENT,
]

// industry labels
export const INDUSTRYLABELS = new Map([
    [ITEMS["Assembly Line XS"], "XS"],
    [ITEMS["Assembly Line S"], "S"],
    [ITEMS["Assembly Line M"], "M"],
    [ITEMS["Assembly Line L"], "L"],
    [ITEMS["Assembly Line XL"], "XL"],
    [ITEMS["3D Printer M"], "3D"],
    [ITEMS["Chemical Industry M"], "Chem"],
    [ITEMS["Electronics Industry M"], "Elec"],
    [ITEMS["Glass Furnace M"], "Glass"],
    [ITEMS["Metalwork Industry M"], "Metal"],
    [ITEMS["Refiner M"], "Refine"],
    [ITEMS["Smelter M"], "Smelt"],
])

// container labels
export const CONTAINERLABELS = new Map([
    [ITEMS["Container XS"], "XS"],
    [ITEMS["Container S"], "S"],
    [ITEMS["Container M"], "M"],
    [ITEMS["Container L"], "L"],
])

// The size (in pixels) of a node item in the visualization
export const SIZE = 50

// The size (in pt) of the font
export const FONTSIZE = 10

// Spacing between link lines
export const LINKSPACING = (2.0 * SIZE) / MAX_CONTAINER_LINKS

/**
 * Properties of the FactoryVisualization components
 */
export interface FactoryVisualizationComponentProps {
    // the factory instructions
    instructions: FactoryInstruction[]
}

/**
 * Properties of the FactoryVisualization components
 */
export interface FactoryVisualizationProps extends FactoryVisualizationComponentProps {
    // the factory graph
    factory: FactoryGraph | undefined

    /**
     * Set the parent factory state
     * @param state the FactoryState
     */
    setFactoryState: (state: FactoryState) => void
}

/**
 * Component for visualizing factory graph
 * @param props {@link FactoryVisualizationProps}
 */
export function FactoryVisualization({
    factory,
    setFactoryState,
    instructions,
}: FactoryVisualizationProps) {
    // The state of the visualization
    const [visualizationState, setVisualizationState] = React.useState<VisualizationState>()

    let content = null
    switch (visualizationState) {
        default:
            content = (
                <React.Fragment>
                    <Button onClick={() => setVisualizationState(VisualizationState.INSTRUCTIONS)}>
                        Building Instructions
                    </Button>
                    <Button onClick={() => setVisualizationState(VisualizationState.MAP)}>
                        Factory Map
                    </Button>
                </React.Fragment>
            )
            break
        case VisualizationState.INSTRUCTIONS:
            content = (
                <React.Fragment>
                    <Button onClick={() => setVisualizationState(VisualizationState.MAP)}>
                        Factory Map
                    </Button>
                    <br />
                    <FactoryInstructions instructions={instructions} />
                </React.Fragment>
            )
            break
        case VisualizationState.MAP:
            content = (
                <React.Fragment>
                    <Button onClick={() => setVisualizationState(VisualizationState.INSTRUCTIONS)}>
                        Building Instructions
                    </Button>
                    <br />
                    <FactoryMap instructions={instructions} />
                </React.Fragment>
            )
            break
    }

    return (
        <React.Fragment>
            <Button onClick={() => setFactoryState(FactoryState.COUNT)}>Back</Button>
            <Button
                href={`data:text/json;charset=utf-8,${encodeURIComponent(serialize(factory!))}`}
                download="factory.json"
            >
                Download Factory as JSON
            </Button>
            <br />
            {content}
        </React.Fragment>
    )
}

/**
 * Component for visualizing factory graph as building instructions
 * @param props {@link FactoryVisualizationComponentProps}
 */
export function FactoryInstructions({ instructions }: FactoryVisualizationComponentProps) {
    // current building step
    const [step, setStep] = React.useState<number>(0)

    return (
        <React.Fragment>
            <svg height={instructions[step].height} width={instructions[step].width}>
                <marker
                    id="arrowhead"
                    markerWidth="5"
                    markerHeight="4"
                    refX="0"
                    refY="2"
                    orient="auto"
                >
                    <polygon points="0 0, 5 2, 0 4" />
                </marker>
                <rect width="100%" height="100%" fill="lightgray" />
                {instructions[step].render()}
            </svg>
            <br />
            {step > 0 && <Button onClick={() => setStep(step - 1)}>Previous Step</Button>}
            {step < instructions.length - 1 && (
                <Button onClick={() => setStep(step + 1)}>Next Step</Button>
            )}
        </React.Fragment>
    )
}
