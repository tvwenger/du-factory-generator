import * as React from "react"
import { Container } from "../container"
import { isIndustry } from "../industry"
import { isByproductTransferUnit, isCatalystBalancer, isTransferUnit } from "../transfer-unit"
import { sortName } from "./generate-instructions"
import {
    containerLabel,
    FONTSIZE,
    INDUSTRYLABELS,
    TIERLABELS,
    LINKSPACING,
    SIZE,
} from "./render-factory"

/**
 * Instruction centered on a merged node
 */
export class MergedNodeInstruction {
    name: string

    /**
     * Create a new MergedNodeInstruction
     * @param container Container that is the focal point of this instruction
     * @param highlightDiff Highlight changed nodes
     * @param section Section identifier
     * @param header1 Header for this section
     * @param header2 Header for this section
     */
    constructor(
        readonly container: Container,
        readonly highlightDiff: boolean,
        readonly section: number,
        readonly header1: string,
        readonly header2: string,
    ) {
        this.name = container.name
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
        let height = SIZE + 1.5 * SIZE * this.container.producers.size
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
                    {isTransferUnit(producer) && (
                        <polygon
                            points={`${x + SIZE / 2} ${y}, ${x + SIZE} ${y + SIZE / 2}, ${
                                x + SIZE / 2
                            } ${y + SIZE}, ${x} ${y + SIZE / 2}`}
                            fill={this.highlightDiff && producer.changed ? "magenta" : "gray"}
                            stroke="magenta"
                            strokeWidth="3"
                        />
                    )}
                    {isIndustry(producer) && (
                        <circle
                            cx={x + SIZE / 2}
                            cy={y + SIZE / 2}
                            r={SIZE / 2}
                            fill={this.highlightDiff && producer.changed ? "green" : "gray"}
                            stroke="green"
                            strokeWidth="3"
                        />
                    )}
                    <text
                        x={x + SIZE / 2}
                        y={y + SIZE / 2}
                        fill="black"
                        fontSize={1.0 * FONTSIZE}
                        dominantBaseline="middle"
                        textAnchor="middle"
                    >
                        {isIndustry(producer) &&
                            TIERLABELS[producer.item.tier] +
                                INDUSTRYLABELS[producer.recipe.industry]}
                        {isTransferUnit(producer) && producer.number + "xTU"}
                    </text>
                    <text
                        x={x + SIZE / 2}
                        y={y - 5}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="auto"
                        textAnchor="middle"
                    >
                        {producer.id}
                    </text>
                    <line
                        x1={x + SIZE}
                        y1={y + SIZE / 2}
                        x2={x + SIZE + 5}
                        y2={y + SIZE / 2}
                        stroke="#000"
                        strokeWidth="2"
                    />
                    <line
                        x1={x + SIZE + 5}
                        y1={y + SIZE / 2}
                        x2={x + SIZE + 5}
                        y2={start_y + relayHeight / 2 - SIZE / 4}
                        stroke="#000"
                        strokeWidth="2"
                    />
                </React.Fragment>
            )
            elements.push(element)
        }

        // add item name
        element = (
            <text
                key={this.container.name + "label"}
                x={start_x + 3 * SIZE}
                y={0.5 * SIZE}
                fill="black"
                fontSize={1.5 * FONTSIZE}
                dominantBaseline="auto"
                textAnchor="middle"
                fontWeight="bold"
            >
                {this.container.item.name}  ({this.container.item.id})
            </text>
        )
        elements.push(element)

        // add container
        x = start_x + 3 * SIZE
        y = start_y + relayHeight / 2 - SIZE / 4
        let ingress = this.container.ingress(this.container.item)
        let egress = this.container.egress(this.container.item)
        let steadyStateEgress = this.container.steadyStateEgress(this.container.item)
        let outputRate = this.container.outputRate
        let unit = "sec"
        if (steadyStateEgress < 1) {
            ingress *= 60.0
            egress *= 60.0
            steadyStateEgress *= 60.0
            outputRate *= 60.0
            unit = "min"
        }
        if (steadyStateEgress < 1) {
            ingress *= 60.0
            egress *= 60.0
            steadyStateEgress *= 60.0
            outputRate *= 60.0
            unit = "hour"
        }
        if (steadyStateEgress < 1) {
            ingress *= 24.0
            egress *= 24.0
            steadyStateEgress *= 24.0
            outputRate *= 24.0
            unit = "day"
        }
        ingress = Math.round(ingress * 100) / 100
        egress = Math.round(egress * 100) / 100
        steadyStateEgress = Math.round(steadyStateEgress * 100) / 100
        outputRate = Math.round(outputRate * 100) / 100
        element = (
            <React.Fragment key={this.container.name}>
                {this.container.producers.size > 0 && (
                    <React.Fragment>
                        <line
                            x1={x - SIZE + 5}
                            y1={y}
                            x2={x - 10}
                            y2={y}
                            stroke="#000"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                        <text
                            x={x - 2}
                            y={y - 5}
                            fill="green"
                            fontSize={FONTSIZE}
                            dominantBaseline="auto"
                            textAnchor="end"
                        >
                            {ingress + "/" + unit}
                        </text>
                    </React.Fragment>
                )}
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
                    stroke={outputRate > 0 ? "blue" : "red"}
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
                    y={y + SIZE / 2 + 5}
                    fill="black"
                    fontSize={FONTSIZE}
                    dominantBaseline="hanging"
                    textAnchor="middle"
                >
                    {Math.ceil(this.container.maintain)}
                </text>
                <text
                    x={x + SIZE / 2}
                    y={y}
                    fill="black"
                    fontSize={1.0 * FONTSIZE}
                    dominantBaseline="middle"
                    textAnchor="middle"
                >
                    {containerLabel(this.container)}
                </text>
                {this.container.consumers.size > 0 && (
                    <React.Fragment>
                        <line
                            x1={x + SIZE}
                            y1={y}
                            x2={x + 2 * SIZE - 10}
                            y2={y}
                            stroke="#000"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                        <text
                            x={x + SIZE + 2}
                            y={y - 5}
                            fill="red"
                            fontSize="10"
                            dominantBaseline="auto"
                            textAnchor="start"
                        >
                            {egress + "/" + unit}
                        </text>
                        <text
                            x={x + SIZE + 2}
                            y={y + 10}
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

        // Add byproduct consumers from this dump container
        let numByproductConsumers = 0
        for (const consumer of this.container.consumers) {
            if (
                isTransferUnit(consumer) &&
                (isByproductTransferUnit(consumer) || isCatalystBalancer(consumer))
            ) {
                element = (
                    <React.Fragment key={this.container.name + "byproduct" + consumer.name}>
                        <text
                            x={x + 1.5 * SIZE}
                            y={y + SIZE / 2 + 30 + 1.1 * FONTSIZE * numByproductConsumers}
                            fill="black"
                            fontSize="10"
                            dominantBaseline="auto"
                            textAnchor="end"
                        >
                            {consumer.name}
                        </text>
                    </React.Fragment>
                )
                elements.push(element)

                numByproductConsumers += 1
            }
        }
        if (numByproductConsumers > 0) {
            // Add arrow
            element = (
                <React.Fragment key={this.container.name + "byproduct arrow"}>
                    <line
                        x1={x + SIZE}
                        y1={y + SIZE / 4}
                        x2={x + 1.5 * SIZE - 10}
                        y2={y + SIZE / 4}
                        stroke="#000"
                        strokeWidth="2"
                        strokeDasharray="4"
                    />
                    <line
                        x1={x + 1.5 * SIZE - 10}
                        y1={y + SIZE / 4}
                        x2={x + 1.5 * SIZE - 10}
                        y2={y + SIZE / 2 + 10}
                        stroke="#000"
                        strokeWidth="2"
                        strokeDasharray="4"
                        markerEnd="url(#arrowhead)"
                    />
                </React.Fragment>
            )
            elements.push(element)
        }

        // Get output links
        const outputs = Array.from(this.container.consumers).filter(
            (consumer) =>
                !(
                    isTransferUnit(consumer) &&
                    (isByproductTransferUnit(consumer) || isCatalystBalancer(consumer))
                ),
        )
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
