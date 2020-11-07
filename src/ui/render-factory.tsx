/**
 * ui/render-factory.ts
 * React component for visualizing a factory graph
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Button } from "antd"
import { UncontrolledReactSVGPanZoom } from "react-svg-pan-zoom"
import { Category, Tier, ITEMS, Item } from "../items"
import {
    FactoryGraph,
    MAX_CONTAINER_LINKS,
    isContainerNode,
    isTransferContainerNode,
} from "../graph"
import { FactoryState } from "./factory"
import { serialize } from "../serialize"
import { FactoryInstruction } from "./factory-instruction"

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

/**
 * Component for visualizing factory graph as a large map
 * @param props {@link FactoryVisualizationComponentProps}
 */
export function FactoryMap({ instructions }: FactoryVisualizationComponentProps) {
    // keep track of edges of each section
    let start_x = 100
    let start_y = 100

    // keep track of the top-left corner where we are currently placing items
    let x = start_x
    let y = start_y

    // keep track of maximum width and height of instructions
    let max_x = start_x
    let max_y = start_y

    // keep track of the index of the first instruction in this section
    let section_i = 0

    // keep track of the maxInputWidth of the first instruction in each section
    let maxInputWidth = instructions[0].maxInputWidth

    const elements: JSX.Element[] = []
    for (const [instruction_i, instruction] of instructions.entries()) {
        const translate =
            "translate(" + (x + maxInputWidth - instruction.maxInputWidth) + "," + y + ")"
        const element = (
            <g key={instruction.container.name + "group"} transform={translate}>
                {instruction.render()}
            </g>
        )
        elements.push(element)

        y += instruction.height
        max_y = Math.max(y, max_y)

        // check if we've reached the end of this section
        let endSection = false
        let endFactory = false
        let sectionWidth = 0
        let nextInstruction: FactoryInstruction | undefined
        if (instruction_i < instructions.length - 1) {
            nextInstruction = instructions[instruction_i + 1]
            if (
                (isContainerNode(instruction.container) &&
                    !isContainerNode(nextInstruction.container)) ||
                (!isContainerNode(instruction.container) &&
                    isContainerNode(nextInstruction.container)) ||
                (isContainerNode(instruction.container) &&
                    isContainerNode(nextInstruction.container) &&
                    (instruction.container.item.category !=
                        nextInstruction.container.item.category ||
                        instruction.container.item.tier != nextInstruction.container.item.tier))
            ) {
                endSection = true
            }
        } else {
            // end of factory
            endSection = true
            endFactory = true
        }

        // Add section title
        if (endSection) {
            //end of section
            sectionWidth = Math.max(
                ...instructions
                    .slice(section_i, instruction_i + 1)
                    .map((instruction) => instruction.width),
            )
            const translate = "translate(" + (x + sectionWidth / 2) + "," + start_y / 2 + ")"
            const element = (
                <g key={"sectionheader" + section_i} transform={translate}>
                    <text
                        x={0}
                        y={0}
                        fill="black"
                        fontSize={2 * FONTSIZE}
                        fontWeight="bold"
                        dominantBaseline="middle"
                        textAnchor="middle"
                    >
                        {isContainerNode(instruction.container) && (
                            <React.Fragment>
                                <tspan x="0" dy="1em">
                                    {instruction.container.item.category}
                                </tspan>
                                <tspan x="0" dy="1em">
                                    {instruction.container.item.tier}
                                </tspan>
                            </React.Fragment>
                        )}
                        {isTransferContainerNode(instruction.container) && (
                            <React.Fragment>
                                <tspan x="0" dy="1em">
                                    Transfer
                                </tspan>
                                <tspan x="0" dy="1em">
                                    Containers
                                </tspan>
                            </React.Fragment>
                        )}
                    </text>
                </g>
            )
            elements.push(element)
        }

        if (endFactory) {
            // save current x position
            max_x =
                x +
                Math.max(
                    ...instructions
                        .slice(section_i, instruction_i + 1)
                        .map((instruction) => instruction.width),
                )
        } else if (endSection) {
            // move to next section
            start_x += sectionWidth
            start_y = 100
            x = start_x
            y = start_y
            section_i = instruction_i + 1
            maxInputWidth = nextInstruction!.maxInputWidth
        }
    }
    return (
        <UncontrolledReactSVGPanZoom width={800} height={600}>
            <svg height={max_y} width={max_x}>
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
                {elements}
            </svg>
        </UncontrolledReactSVGPanZoom>
    )
}
