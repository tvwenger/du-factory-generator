import * as React from "react"
import { TransferContainer } from "../transfer-container"
import { sortName } from "./generate-instructions"
import { containerLabel, FONTSIZE, LINKSPACING, SIZE } from "./render-factory"

/**
 * Instruction centered on a transfer container
 */
export class TransferContainerInstruction {
    name: string
    header1: string
    header2: string

    /**
     * Create a new TransferContainerInstruction
     * @param container TransferContainer that is the focal point of this instruction
     * @param highlightDiff Highlight changed nodes
     * @param section Section identifier
     */
    constructor(
        readonly container: TransferContainer,
        readonly highlightDiff: boolean,
        readonly section: number,
    ) {
        this.name = container.name
        this.header1 = "Transfer"
        this.header2 = "Container"
    }

    /**
     * Approximate the width of the longest input link name
     */
    get maxInputWidth(): number {
        let maxInputWidth = 0
        for (const producer of this.container.producers) {
            for (const input of producer.inputs) {
                maxInputWidth = Math.max(maxInputWidth, (FONTSIZE / 1.333) * input.name.length)
            }
        }
        return maxInputWidth
    }

    /**
     * Approximate the width of the longest output link name
     */
    get maxOutputWidth(): number {
        let maxOutputWidth = 0
        for (const consumer of this.container.consumers) {
            maxOutputWidth = Math.max(maxOutputWidth, (FONTSIZE / 1.333) * consumer.name.length)
        }
        return maxOutputWidth
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
        let height = 0.75 * SIZE + 1.5 * SIZE * this.container.producers.size
        return height
    }

    /**
     * Generate SVG
     */
    render(): JSX.Element[] {
        let elements: JSX.Element[] = []
        let start_x = this.maxInputWidth
        const start_y = 0.75 * SIZE

        // Get producers and sort by name
        const producers = Array.from(this.container.producers)
        producers.sort((a, b) => sortName(a, b))

        let element = null
        let x = 0
        let y = 0
        let relayHeight = 1.5 * SIZE * this.container.producers.size

        // Loop over producers
        for (const [producer_i, producer] of producers.entries()) {
            // Get input links and sort by name
            const inputs = Array.from(producer.inputs)
            inputs.sort((a, b) => sortName(a, b))

            // Loop over input links
            for (const [input_i, input] of inputs.entries()) {
                x = start_x
                y =
                    start_y +
                    1.5 * SIZE * producer_i +
                    SIZE / 2 +
                    LINKSPACING * (input_i - (inputs.length - 1) / 2)

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

            x = start_x + SIZE
            y = start_y + 1.5 * SIZE * producer_i

            // add producer
            element = (
                <React.Fragment key={this.container.name + "producer" + producer_i}>
                    <line
                        x1={x - SIZE}
                        y1={y + SIZE / 2}
                        x2={x - 10}
                        y2={y + SIZE / 2}
                        stroke="#000"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                    />
                    <polygon
                        points={`${x + SIZE / 2} ${y}, ${x + SIZE} ${y + SIZE / 2}, ${
                            x + SIZE / 2
                        } ${y + SIZE}, ${x} ${y + SIZE / 2}`}
                        fill={this.highlightDiff && producer.changed ? "magenta" : "gray"}
                        stroke="magenta"
                        strokeWidth="3"
                    />
                    <text
                        x={x + SIZE / 2}
                        y={y + SIZE / 2}
                        fill="black"
                        fontSize={1.5 * FONTSIZE}
                        dominantBaseline="middle"
                        textAnchor="middle"
                    >
                        Trans
                    </text>
                    <text
                        x={x + SIZE / 2}
                        y={y - 5}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="auto"
                        textAnchor="end"
                    >
                        {producer.name}
                    </text>
                    <text
                        x={x + SIZE}
                        y={y + 0.75 * SIZE}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="auto"
                        textAnchor="start"
                    >
                        {this.container.maintain(producer.item)}
                    </text>
                    <line
                        x1={x + SIZE}
                        y1={y + SIZE / 2}
                        x2={x + 1.5 * SIZE + 10}
                        y2={y + SIZE / 2}
                        stroke="#000"
                        strokeWidth="2"
                    />
                    <line
                        x1={x + 1.5 * SIZE + 10}
                        y1={y + SIZE / 2}
                        x2={x + 1.5 * SIZE + 10}
                        y2={start_y + relayHeight / 2 - SIZE / 4}
                        stroke="#000"
                        strokeWidth="2"
                    />
                </React.Fragment>
            )
            elements.push(element)
        }

        // add container
        x = start_x + 3 * SIZE
        y = start_y + relayHeight / 2 - SIZE / 4
        element = (
            <React.Fragment key={this.container.name}>
                <line
                    x1={x - SIZE / 2 + 10}
                    y1={y}
                    x2={x - 10}
                    y2={y}
                    stroke="#000"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                />
                <rect
                    x={x}
                    y={y - SIZE / 2}
                    width={SIZE}
                    height={SIZE}
                    fill={this.highlightDiff && this.container.changed ? "red" : "gray"}
                    stroke={"red"}
                    strokeWidth="3"
                />
                <text
                    x={x + SIZE / 2}
                    y={y - SIZE / 2 - 5}
                    fill="black"
                    fontSize={FONTSIZE}
                    dominantBaseline="auto"
                    textAnchor="middle"
                >
                    {this.container.id}
                </text>
                <text
                    x={x + SIZE / 2}
                    y={y}
                    fill="black"
                    fontSize={2 * FONTSIZE}
                    dominantBaseline="middle"
                    textAnchor="middle"
                >
                    {containerLabel(this.container)}
                </text>
                <line
                    x1={x + SIZE}
                    y1={y}
                    x2={x + 2 * SIZE - 10}
                    y2={y}
                    stroke="#000"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                />
            </React.Fragment>
        )
        elements.push(element)

        // Get output links
        const outputs = Array.from(this.container.consumers)
        // Sort by name
        outputs.sort((a, b) => sortName(a, b))

        // Loop over output links
        for (const [output_i, output] of outputs.entries()) {
            x = start_x + 5 * SIZE
            y =
                start_y +
                relayHeight / 2.0 -
                SIZE / 4 +
                LINKSPACING * (output_i - (outputs.length - 1) / 2)

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
