/**
 * ui/factory-instructions.ts
 * React component for rendering a factory instruction
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import {
    FactoryGraph,
    FactoryNode,
    ContainerNode,
    TransferContainerNode,
    isContainerNode,
    isIndustryNode,
    isTransferNode,
    isTransferContainerNode,
    isOutputNode,
} from "../graph"
import {
    SIZE,
    FONTSIZE,
    LINKSPACING,
    CATEGORY_ORDER,
    TIER_ORDER,
    INDUSTRYLABELS,
    CONTAINERLABELS,
} from "./render-factory"

/**
 * If an item name contains a terminal XS, S, M, L, or XL, replace
 * that with A, B, C, D, or E to support sorting
 * @param name the name to fix
 */
function replaceSizeInName(name: string) {
    name = name.replace(" XS ", " A ")
    name = name.replace(" S ", " B ")
    name = name.replace(" M ", " C ")
    name = name.replace(" L ", " D ")
    name = name.replace(" XL ", " E ")
    return name
}

/**
 * Sorting function to sort factory nodes by name, considering XS, S, M, L, XL
 * @param a First node
 * @param b Second node
 */
function sortName(a: FactoryNode, b: FactoryNode): number {
    let aName = replaceSizeInName(a.name)
    let bName = replaceSizeInName(b.name)
    return aName.localeCompare(bName, "en", { numeric: true })
}

/**
 * Factory instruction object focused on a container
 */
export class FactoryInstruction {
    /**
     * Create a new FactoryInstruction object centered on a given container
     * @param container Container that is the focal point of this instruction
     * @param highlightDiff Highlight changed nodes
     */
    constructor(
        readonly container: ContainerNode | TransferContainerNode,
        readonly highlightDiff: boolean,
    ) {}

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
                        fill={this.highlightDiff && producer.changed ? "green" : "gray"}
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
        let ingress = 0
        let egress = 0
        let outputRate = 0
        let unit = "sec"
        if (isContainerNode(this.container)) {
            ingress = this.container.ingress * 60.0
            egress = this.container.egress * 60.0
            if (isOutputNode(this.container)) {
                outputRate = this.container.outputRate * 60.0
            }
            unit = "min"
            if (egress < 1) {
                ingress *= 60.0
                egress *= 60.0
                outputRate *= 60.0
                unit = "hour"
            }
            if (egress < 1) {
                ingress *= 24.0
                egress *= 24.0
                outputRate *= 24.0
                unit = "day"
            }
            ingress = Math.round(ingress * 100) / 100
            egress = Math.round(egress * 100) / 100
            outputRate = Math.round(outputRate * 100) / 100
        }
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
                            {isContainerNode(this.container) && ingress + "/" + unit}
                        </text>
                    </React.Fragment>
                )}
                <rect
                    x={x}
                    y={container_y}
                    width={SIZE}
                    height={SIZE}
                    fill={this.highlightDiff && this.container.changed ? "red" : "gray"}
                    stroke={isOutputNode(this.container) ? "blue" : "red"}
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
                    {isContainerNode(this.container) && Math.ceil(this.container.maintain)}
                </text>
                {isOutputNode(this.container) && (
                    <text
                        x={x + SIZE / 2}
                        y={container_y + SIZE + 15}
                        fill="blue"
                        fontSize={FONTSIZE}
                        dominantBaseline="hanging"
                        textAnchor="middle"
                    >
                        ({this.container.maintainedOutput})
                    </text>
                )}
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
                            {isContainerNode(this.container) && egress + "/" + unit}
                        </text>
                        {isOutputNode(this.container) && (
                            <text
                                x={x + 1.5 * SIZE}
                                y={container_y + SIZE / 2 - 5 + 20}
                                fill="blue"
                                fontSize={FONTSIZE}
                                dominantBaseline="auto"
                                textAnchor="middle"
                            >
                                ({outputRate + "/" + unit})
                            </text>
                        )}
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
 * @param showDifferences if true, highlight changed nodes
 */
export function generateInstructions(
    factory: FactoryGraph,
    showDifferences: boolean,
): FactoryInstruction[] {
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
            instructions.push(new FactoryInstruction(container, showDifferences))
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
                instructions.push(new FactoryInstruction(container, showDifferences))
            }
        }
    }
    return instructions
}
