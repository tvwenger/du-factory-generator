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
    FactoryNode,
    ContainerNode,
    TransferContainerNode,
    MAX_CONTAINER_LINKS,
    isContainerNode,
    isIndustryNode,
    isTransferNode,
    isTransferContainerNode,
} from "../graph"
import { FactoryState } from "./new-factory"
import { serialize } from "../serialize"

enum VisualizationState {
    INSTRUCTIONS = "instructions",
    MAP = "map",
}

// order that the factory is visualized
const CATEGORY_ORDER = [
    Category.ORE,
    Category.PURE,
    Category.CATALYST,
    Category.PRODUCT,
    Category.STRUCTURAL_PARTS,
    Category.INTERMEDIARY_PARTS,
    Category.COMPLEX_PARTS,
    Category.EXCEPTIONAL_PARTS,
    Category.FUNCTIONAL_PARTS,
    Category.FUEL,
    Category.ITEM_CONTAINERS,
    Category.INDUSTRY,
    Category.CORE_UNIT,
    Category.CONTROL,
    Category.FLIGHT_CONTROL,
    Category.AIRFOIL,
    Category.FUEL_TANKS,
    Category.ENGINES,
    Category.INTERACTIVE,
    Category.INSTRUMENTS,
    Category.SENSOR,
    Category.ANTI_GRAVITY,
]
const TIER_ORDER = [Tier.BASIC, Tier.UNCOMMON, Tier.ADVANCED, Tier.RARE, Tier.EXOTIC, Tier.ELEMENT]

// industry labels
const INDUSTRYLABELS = new Map([
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
const CONTAINERLABELS = new Map([
    [ITEMS["Container XS"], "XS"],
    [ITEMS["Container S"], "S"],
    [ITEMS["Container M"], "M"],
    [ITEMS["Container L"], "L"],
])

// The size (in pixels) of a node item in the visualization
const SIZE = 50

// The size (in pt) of the font
const FONTSIZE = 10

// Spacing between link lines
const LINKSPACING = (2.0 * SIZE) / MAX_CONTAINER_LINKS

/**
 * Sorting function to sort factory nodes by name
 * @param a First node
 * @param b Second node
 */
function sortName(a: FactoryNode, b: FactoryNode): number {
    return a.name.localeCompare(b.name, "en", { numeric: true })
}

/**
 * Factory instruction object focused on a container
 */
export class FactoryInstruction {
    /**
     * Create a new FactoryInstruction object centered on a given container
     * @param container Container that is the focal point of this instruction
     */
    constructor(readonly container: ContainerNode | TransferContainerNode) {}

    /**
     * Approximate the width of the longest input link name
     */
    get maxInputWidth(): number {
        if (this.container.producers.size > 0) {
            return (
                (FONTSIZE / 1.333) *
                Math.max(
                    ...Array.from(this.container.producers).map((producer) =>
                        Math.max(...Array.from(producer.inputs).map((input) => input.name.length)),
                    ),
                )
            )
        }
        return 0
    }

    /**
     * Approximate the width of the longest output link name
     */
    get maxOutputWidth(): number {
        if (this.container.consumers.size > 0) {
            return (
                (FONTSIZE / 1.333) *
                Math.max(
                    ...Array.from(this.container.consumers).map((consumer) => consumer.name.length),
                )
            )
        }
        return 0
    }

    /**
     * Approximate the width of this instruction SVG
     */
    get width(): number {
        // -> industry -> container -> = 5x SIZE
        // Add approximate width of longest input link and output link strings
        let width = 5 * SIZE + this.maxInputWidth + this.maxOutputWidth
        return width
    }

    /**
     * Approximate the height of this instruction SVG
     */
    get height(): number {
        // height is a little larger than 1.5*size of combined producers
        let height = 1.5 * SIZE * Math.max(this.container.producers.size, 1) + SIZE
        return height
    }

    /**
     * Generate SVG
     */
    render(): JSX.Element[] {
        let elements: JSX.Element[] = []

        // Get producers
        const producers = Array.from(this.container.producers)
        // Sort by name
        producers.sort((a, b) => sortName(a, b))

        let start_x = this.maxInputWidth
        let start_y = 0.75 * SIZE
        let producer_y = start_y
        let element = null

        // add item name
        element = (
            <text
                key={this.container.name + "label"}
                x={start_x + 3 * SIZE}
                y={start_y - 20}
                fill="black"
                fontSize={1.5 * FONTSIZE}
                dominantBaseline="auto"
                textAnchor="middle"
                fontWeight="bold"
            >
                {isContainerNode(this.container) && this.container.item.name}
            </text>
        )
        elements.push(element)

        // Loop over producers
        for (const [producer_i, producer] of producers.entries()) {
            // Get input links
            const inputs = Array.from(producer.inputs)
            // Sort by name
            inputs.sort((a, b) => sortName(a, b))

            // Loop over input links
            for (const [input_i, input] of inputs.entries()) {
                const x = start_x
                const y = producer_y + SIZE / 2 + LINKSPACING * (input_i - (inputs.length - 1) / 2)

                // Add input link
                element = (
                    <text
                        x={x}
                        y={y}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="middle"
                        textAnchor="end"
                        key={this.container.name + "producer" + producer_i + "inputlink" + input_i}
                    >
                        {input.name}
                    </text>
                )
                elements.push(element)
            }

            const x = start_x + SIZE
            const y = producer_y + SIZE / 2

            // add producer
            element = (
                <React.Fragment key={this.container.name + "producer" + producer_i}>
                    <line
                        x1={x - SIZE}
                        y1={y}
                        x2={x - 10}
                        y2={y}
                        stroke="#000"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                    />
                    <circle
                        cx={x + SIZE / 2}
                        cy={y}
                        r={SIZE / 2}
                        fill="gray"
                        stroke="green"
                        strokeWidth="3"
                    />
                    <text
                        x={x + SIZE / 2}
                        y={y}
                        fill="black"
                        fontSize={1.5 * FONTSIZE}
                        dominantBaseline="middle"
                        textAnchor="middle"
                    >
                        {isIndustryNode(producer) && INDUSTRYLABELS.get(producer.industry)}
                        {isTransferNode(producer) && "Trans"}
                    </text>
                    {producer.output !== undefined && isTransferContainerNode(producer.output) ? (
                        <text
                            x={x + SIZE / 2}
                            y={y - SIZE / 2 - 5}
                            fill="black"
                            fontSize={FONTSIZE}
                            dominantBaseline="auto"
                            textAnchor="end"
                        >
                            {producer.name}
                        </text>
                    ) : (
                        <text
                            x={x + SIZE / 2}
                            y={y - SIZE / 2 - 5}
                            fill="black"
                            fontSize={FONTSIZE}
                            dominantBaseline="auto"
                            textAnchor="middle"
                        >
                            {producer.id}
                        </text>
                    )}
                    {producer.output !== undefined && isTransferContainerNode(producer.output) && (
                        <text
                            x={x + SIZE}
                            y={y + 0.25 * SIZE}
                            fill="black"
                            fontSize={FONTSIZE}
                            dominantBaseline="auto"
                            textAnchor="start"
                        >
                            {producer.output.maintain.get(producer.item)}
                        </text>
                    )}
                </React.Fragment>
            )
            elements.push(element)

            if (producer_i < producers.length - 1) {
                // move y to next producer
                producer_y += 1.5 * SIZE
            }
        }

        // add container
        const x = start_x + 3 * SIZE
        const container_y = start_y + (producer_y - start_y) / 2
        element = (
            <React.Fragment key={this.container.name}>
                {this.container.producers.size > 0 && (
                    <React.Fragment>
                        <line
                            x1={x - SIZE}
                            y1={container_y + SIZE / 2}
                            x2={x - 10}
                            y2={container_y + SIZE / 2}
                            stroke="#000"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                        <text
                            x={x - SIZE / 2}
                            y={container_y + SIZE / 2 - 5}
                            fill="green"
                            fontSize={FONTSIZE}
                            dominantBaseline="auto"
                            textAnchor="middle"
                        >
                            {isContainerNode(this.container) &&
                                Math.round(this.container.ingress * 100) / 100}
                        </text>
                    </React.Fragment>
                )}
                <rect
                    x={x}
                    y={container_y}
                    width={SIZE}
                    height={SIZE}
                    fill="gray"
                    stroke="red"
                    strokeWidth="3"
                />
                <text
                    x={x + SIZE / 2}
                    y={container_y - 5}
                    fill="black"
                    fontSize={FONTSIZE}
                    dominantBaseline="auto"
                    textAnchor="middle"
                >
                    {this.container.id}
                </text>
                <text
                    x={x + SIZE / 2}
                    y={container_y + SIZE + 5}
                    fill="black"
                    fontSize={FONTSIZE}
                    dominantBaseline="hanging"
                    textAnchor="middle"
                >
                    {isContainerNode(this.container) && this.container.maintain}
                </text>
                <text
                    x={x + SIZE / 2}
                    y={container_y + SIZE / 2}
                    fill="black"
                    fontSize={2 * FONTSIZE}
                    dominantBaseline="middle"
                    textAnchor="middle"
                >
                    {this.container.containers
                        .map((container) => CONTAINERLABELS.get(container))
                        .join("+")}
                </text>
                {this.container.consumers.size > 0 && (
                    <React.Fragment>
                        <line
                            x1={x + SIZE}
                            y1={container_y + SIZE / 2}
                            x2={x + 2 * SIZE - 10}
                            y2={container_y + SIZE / 2}
                            stroke="#000"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                        <text
                            x={x + 1.5 * SIZE}
                            y={container_y + SIZE / 2 - 5}
                            fill="red"
                            fontSize="10"
                            dominantBaseline="auto"
                            textAnchor="middle"
                        >
                            {isContainerNode(this.container) &&
                                Math.round(this.container.egress * 100) / 100}
                        </text>
                    </React.Fragment>
                )}
            </React.Fragment>
        )
        elements.push(element)

        // Get output links
        const outputs = Array.from(this.container.consumers)
        // Sort by name
        outputs.sort((a, b) => sortName(a, b))

        // Loop over output links
        for (const [output_i, output] of outputs.entries()) {
            const x = start_x + 5 * SIZE
            const y = container_y + SIZE / 2 + LINKSPACING * (output_i - (outputs.length - 1) / 2)

            // Add output link
            const element = (
                <text
                    x={x}
                    y={y}
                    fill="black"
                    fontSize={FONTSIZE}
                    dominantBaseline="middle"
                    textAnchor="start"
                    key={this.container.name + "outputlink" + output_i}
                >
                    {output.name}
                </text>
            )
            elements.push(element)
        }
        return elements
    }
}

/**
 * Generate the instruction set required to build a factory, in visualization order
 * @param factory the Factory graph
 */
export function generateInstructions(factory: FactoryGraph): FactoryInstruction[] {
    const instructions: FactoryInstruction[] = []

    // loop over category
    for (const category of CATEGORY_ORDER) {
        // Check if any transfer containers supply an industry in this category
        const transferContainers = Array.from(factory.transferContainers).filter((node) =>
            Array.from(node.consumers).some((consumer) => consumer.item.category === category),
        )
        // Sort by name
        transferContainers.sort((a, b) => sortName(a, b))

        // Add transferContainer instructions
        for (const container of transferContainers) {
            instructions.push(new FactoryInstruction(container))
        }
        // loop over tier
        for (const tier of TIER_ORDER) {
            // Get containers
            const containers = Array.from(factory.containers).filter(
                (node) => node.item.category === category && node.item.tier === tier,
            )
            // Sort by name
            containers.sort((a, b) => sortName(a, b))

            // Loop over containers
            for (const container of containers) {
                instructions.push(new FactoryInstruction(container))
            }
        }
    }
    return instructions
}

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
