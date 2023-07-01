import * as React from "react"
import { FactoryNode } from "../graph"
import { sortName } from "./generate-instructions"
import { containerLabel, FONTSIZE, LINKSPACING, SIZE } from "./render-factory"

/**
 * Instruction centered on a transfer container
 */
export class OreInstruction {
    name: string

    /**
     * Create a new NodeInstruction
     * @param node The factory node
     * @param highlightDiff Highlight changed nodes
     * @section Section identifier
     * @header1 Header for this section
     * @header2 Header for this section
     */
    constructor(
        readonly node: FactoryNode,
        readonly highlightDiff: boolean,
        readonly section: number,
        readonly header1: string,
        readonly header2: string,
    ) {
        this.name = node.item.name
    }

    /**
     * Approximate the width of the longest input link name
     */
    get maxInputWidth(): number {
        // A little buffer
        return 0.5 * SIZE
    }

    /**
     * Approximate the width of the longest output link name
     */
    get maxOutputWidth(): number {
        let maxOutputWidth = 0
        for (const relayRoute of this.node.relayRoutes) {
            for (const consumer of relayRoute.container.consumers) {
                maxOutputWidth = Math.max(maxOutputWidth, (FONTSIZE / 1.333) * consumer.name.length)
            }
        }
        return maxOutputWidth
    }

    /**
     * Approximate the width of this instruction SVG
     */
    get width(): number {
        // container -> <output name>
        // = 2*SIZE + output lengths
        let width = 2.0 * SIZE + this.maxInputWidth + this.maxOutputWidth
        return width
    }

    /**
     * Approximate the height of this instruction SVG
     */
    get height(): number {
        return SIZE + 2.5 * SIZE * this.node.relayRoutes.length
    }

    /**
     * Generate SVG
     */
    render(): JSX.Element[] {
        let elements: JSX.Element[] = []
        let start_x = 0.5 * SIZE
        const start_y = 0.75 * SIZE
        let relayStart_y = start_y

        let x = 0
        let y = 0
        let element = null

        // add item name
        element = (
            <text
                key={this.node.relayRoutes[0].container.name + "label"}
                x={start_x + SIZE}
                y={0.5 * SIZE}
                fill="black"
                fontSize={1.5 * FONTSIZE}
                dominantBaseline="auto"
                textAnchor="middle"
                fontWeight="bold"
            >
                {this.node.item.name} ({this.node.item.id})
            </text>
        )
        elements.push(element)

        for (const relayRoute of this.node.relayRoutes) {
            // Add relay container
            x = start_x
            y = relayStart_y + SIZE / 2
            let egress = relayRoute.container.egress(relayRoute.container.item)
            let steadyStateEgress = relayRoute.container.steadyStateEgress(
                relayRoute.container.item,
            )
            let outputRate = relayRoute.container.outputRate
            let unit = "sec"
            if (steadyStateEgress < 1) {
                egress *= 60.0
                steadyStateEgress *= 60.0
                outputRate *= 60.0
                unit = "min"
            }
            if (steadyStateEgress < 1) {
                egress *= 60.0
                steadyStateEgress *= 60.0
                outputRate *= 60.0
                unit = "hour"
            }
            if (steadyStateEgress < 1) {
                egress *= 24.0
                steadyStateEgress *= 24.0
                outputRate *= 24.0
                unit = "day"
            }
            egress = Math.round(egress * 100) / 100
            steadyStateEgress = Math.round(steadyStateEgress * 100) / 100
            outputRate = Math.round(outputRate * 100) / 100
            element = (
                <React.Fragment key={relayRoute.container.name}>
                    <rect
                        x={x}
                        y={y}
                        width={SIZE}
                        height={SIZE}
                        fill={this.highlightDiff && relayRoute.container.changed ? "red" : "gray"}
                        stroke={outputRate > 0 ? "blue" : "red"}
                        strokeWidth="3"
                    />
                    <text
                        x={x + SIZE / 2}
                        y={y - 5}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="auto"
                        textAnchor="middle"
                    >
                        {relayRoute.container.id}
                    </text>
                    <text
                        x={x + SIZE / 2}
                        y={y + SIZE + 5}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="hanging"
                        textAnchor="middle"
                    >
                        {Math.ceil(relayRoute.container.maintain)}
                    </text>
                    <text
                        x={x + SIZE / 2}
                        y={y + SIZE / 2}
                        fill="black"
                        fontSize={1.0 * FONTSIZE}
                        dominantBaseline="middle"
                        textAnchor="middle"
                    >
                        {containerLabel(relayRoute.container)}
                    </text>
                    {relayRoute.container.consumers.size > 0 && (
                        <React.Fragment>
                            <line
                                x1={x + SIZE}
                                y1={y + SIZE / 2}
                                x2={x + 2 * SIZE - 10}
                                y2={y + SIZE / 2}
                                stroke="#000"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                            <text
                                x={x + SIZE + 2}
                                y={y + SIZE / 2 - 5}
                                fill="red"
                                fontSize="10"
                                dominantBaseline="auto"
                                textAnchor="start"
                            >
                                {egress + "/" + unit}
                            </text>
                            <text
                                x={x + SIZE + 2}
                                y={y + SIZE / 2 + 10}
                                fill="blue"
                                fontSize="10"
                                dominantBaseline="auto"
                                textAnchor="start"
                            >
                                {steadyStateEgress + "/" + unit}
                            </text>
                        </React.Fragment>
                    )}
                </React.Fragment>
            )
            elements.push(element)

            // Add relay output links
            const outputs = Array.from(relayRoute.container.consumers)
            // Sort by name
            outputs.sort((a, b) => sortName(a, b))

            // Loop over output links
            for (const [output_i, output] of outputs.entries()) {
                x = start_x + 2 * SIZE
                y = relayStart_y + SIZE + LINKSPACING * (output_i - (outputs.length - 1) / 2)

                // Add output link
                const element = (
                    <text
                        x={x}
                        y={y}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="middle"
                        textAnchor="start"
                        key={relayRoute.container.name + "outputlink" + output_i}
                    >
                        {output.name}
                    </text>
                )
                elements.push(element)
            }
            relayStart_y += 2.5 * SIZE
        }
        return elements
    }
}
