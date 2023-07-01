import * as React from "react"
import { DumpRoute, FactoryNode } from "../graph"
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
 * Instruction centered on a transfer container
 */
export class NodeInstruction {
    name: string

    /**
     * Create a new NodeInstruction
     * @param node The factory node
     * @param dumpGroup The dump routes included in this instruction
     * @param highlightDiff Highlight changed nodes
     * @section Section identifier
     * @header1 Header for this section
     * @header2 Header for this section
     */
    constructor(
        readonly node: FactoryNode,
        readonly dumpGroup: DumpRoute[],
        readonly highlightDiff: boolean,
        readonly section: number,
        readonly header1: string,
        readonly header2: string,
    ) {
        this.name = dumpGroup[0].container.name
    }

    /**
     * Approximate the width of the longest input link name
     */
    get maxInputWidth(): number {
        let maxInputWidth = 0
        for (const dumpRoute of this.dumpGroup) {
            for (const producer of dumpRoute.container.producers) {
                for (const input of producer.inputs) {
                    maxInputWidth = Math.max(maxInputWidth, (FONTSIZE / 1.333) * input.name.length)
                }
            }
        }
        return maxInputWidth
    }

    /**
     * Approximate the width of the longest output link name
     */
    get maxOutputWidth(): number {
        let maxOutputWidth = 0
        for (const dumpRoute of this.dumpGroup) {
            for (const relayRoute of dumpRoute.relayRoutes) {
                for (const consumer of relayRoute.container.consumers) {
                    maxOutputWidth = Math.max(
                        maxOutputWidth,
                        (FONTSIZE / 1.333) * consumer.name.length,
                    )
                }
            }
        }
        return maxOutputWidth
    }

    /**
     * Approximate the width of this instruction SVG
     */
    get width(): number {
        // <input name> -> industry -> container -> transfer -> container -> <output name>
        // = 9x SIZE + input and output lengths
        let width = 9 * SIZE + this.maxInputWidth + this.maxOutputWidth
        return width
    }

    /**
     * Approximate the height of this instruction SVG based on the number of producers
     */
    get producerHeight(): number {
        let height = SIZE * (this.dumpGroup.length - 1)
        const numProducers = this.dumpGroup
            .map((dumpRoute) => dumpRoute.container.incomingLinkCount)
            .reduce((total, current) => total + current, 0)
        height += 1.5 * SIZE * numProducers
        return height
    }

    /**
     * Approximate the height of this instruction SVG based on the number of relays
     */
    get relayHeight(): number {
        let numRelays = this.dumpGroup[0].relayRoutes.length
        return 2.5 * SIZE * numRelays
    }

    /**
     * Approximate the height of this instruction SVG
     */
    get height(): number {
        return SIZE + Math.max(this.producerHeight, this.relayHeight)
    }

    /**
     * Generate SVG
     */
    render(): JSX.Element[] {
        let elements: JSX.Element[] = []
        let start_x = this.maxInputWidth
        const start_y = 0.75 * SIZE

        // if the producers are taller than the relays, then start the producers at the top
        // and offset the relays from the center
        let dumpStart_y = start_y
        let relayStart_y = start_y + this.producerHeight / 2.0 - this.relayHeight / 2.0
        if (this.producerHeight < this.relayHeight) {
            // Otherwise, start the relays at the top and offset the producers from the center
            dumpStart_y = start_y + this.relayHeight / 2.0 - this.producerHeight / 2.0
            relayStart_y = start_y
        }

        let x = 0
        let y = 0
        let lastDump_y = []
        let element = null

        // Loop over dump Routes
        for (const dumpRoute of this.dumpGroup) {
            // Get producers and sort by name
            const producers = Array.from(dumpRoute.container.producers)
            producers.sort((a, b) => sortName(a, b))

            const dumpHeight = 1.5 * SIZE * producers.length

            // Loop over producers
            for (const [producer_i, producer] of producers.entries()) {
                // Get input links
                const inputs = Array.from(producer.inputs)
                // Sort by name
                inputs.sort((a, b) => sortName(a, b))

                // Loop over input links
                for (const [input_i, input] of inputs.entries()) {
                    x = start_x
                    y =
                        dumpStart_y +
                        producer_i * 1.5 * SIZE +
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
                            key={
                                dumpRoute.container.name +
                                "producer" +
                                producer_i +
                                "inputlink" +
                                input_i
                            }
                        >
                            {input.name}
                        </text>
                    )
                    elements.push(element)
                }

                x = start_x + SIZE
                y = dumpStart_y + producer_i * 1.5 * SIZE

                // add producer
                element = (
                    <React.Fragment key={dumpRoute.container.name + "producer" + producer_i}>
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
                            y2={dumpStart_y + dumpHeight / 2 - SIZE / 4}
                            stroke="#000"
                            strokeWidth="2"
                        />
                    </React.Fragment>
                )
                elements.push(element)
            }

            // add dump container
            x = start_x + 3 * SIZE
            y = dumpStart_y + dumpHeight / 2 - SIZE / 4
            lastDump_y.push(y)
            let ingress = dumpRoute.container.ingress(dumpRoute.container.item)
            let egress = dumpRoute.container.egress(dumpRoute.container.item)
            let steadyStateEgress = dumpRoute.container.steadyStateEgress(dumpRoute.container.item)
            let outputRate = dumpRoute.container.outputRate
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
                <React.Fragment key={dumpRoute.container.name}>
                    {dumpRoute.container.producers.size > 0 && (
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
                    <rect
                        x={x}
                        y={y - SIZE / 2}
                        width={SIZE}
                        height={SIZE}
                        fill={this.highlightDiff && dumpRoute.container.changed ? "red" : "gray"}
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
                        {dumpRoute.container.id}
                    </text>
                    <text
                        x={x + SIZE / 2}
                        y={y + SIZE / 2 + 5}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="hanging"
                        textAnchor="middle"
                    >
                        {Math.ceil(dumpRoute.container.maintain)}
                    </text>
                    <text
                        x={x + SIZE / 2}
                        y={y}
                        fill="black"
                        fontSize={1.0 * FONTSIZE}
                        dominantBaseline="middle"
                        textAnchor="middle"
                    >
                        {containerLabel(dumpRoute.container)}
                    </text>
                    {dumpRoute.container.consumers.size > 0 && (
                        <React.Fragment>
                            <line
                                x1={x + SIZE}
                                y1={y}
                                x2={x + 2 * SIZE - 15}
                                y2={y}
                                stroke="#000"
                                strokeWidth="2"
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
            for (const consumer of dumpRoute.container.consumers) {
                if (
                    isTransferUnit(consumer) &&
                    (isByproductTransferUnit(consumer) || isCatalystBalancer(consumer))
                ) {
                    element = (
                        <React.Fragment
                            key={dumpRoute.container.name + "byproduct" + consumer.name}
                        >
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
                    <React.Fragment key={dumpRoute.container.name + "byproduct arrow"}>
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

            dumpStart_y += dumpHeight + SIZE
        }

        // Add relay transfer units and containers
        let relayRoutes = this.dumpGroup[0].relayRoutes

        // add item name
        element = (
            <text
                key={relayRoutes[0].container.name + "label"}
                x={start_x + 5.5 * SIZE}
                y={0.5 * SIZE}
                fill="black"
                fontSize={1.5 * FONTSIZE}
                dominantBaseline="auto"
                textAnchor="middle"
                fontWeight="bold"
            >
                {relayRoutes[0].container.item.name} ({relayRoutes[0].container.item.id})
            </text>
        )
        elements.push(element)

        for (const relayRoute of relayRoutes) {
            x = start_x + 5 * SIZE
            y = relayStart_y + SIZE / 2

            // add arrows from each dump container to transfer unit
            for (const dump_y of lastDump_y) {
                element = (
                    <React.Fragment key={relayRoute.container.name + "transfer lines " + dump_y}>
                        <line
                            x1={x - 15}
                            y1={dump_y}
                            x2={x - 15}
                            y2={y + SIZE / 2}
                            stroke="#000"
                            strokeWidth="2"
                        />
                        <line
                            x1={x - 15}
                            y1={y + SIZE / 2}
                            x2={x - 10}
                            y2={y + SIZE / 2}
                            stroke="#000"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                    </React.Fragment>
                )
                elements.push(element)
            }

            // add transfer unit
            element = (
                <React.Fragment key={relayRoute.container.name + "transfer"}>
                    <polygon
                        points={`${x + SIZE / 2} ${y}, ${x + SIZE} ${y + SIZE / 2}, ${
                            x + SIZE / 2
                        } ${y + SIZE}, ${x} ${y + SIZE / 2}`}
                        fill={
                            this.highlightDiff && relayRoute.transferUnit.changed
                                ? "magenta"
                                : "gray"
                        }
                        stroke="magenta"
                        strokeWidth="3"
                    />
                    <text
                        x={x + SIZE / 2}
                        y={y + SIZE / 2}
                        fill="black"
                        fontSize={1.0 * FONTSIZE}
                        dominantBaseline="middle"
                        textAnchor="middle"
                    >
                        {relayRoute.transferUnit.number + "xTU"}
                    </text>
                    <text
                        x={x + SIZE / 2}
                        y={y - 5}
                        fill="black"
                        fontSize={FONTSIZE}
                        dominantBaseline="auto"
                        textAnchor="middle"
                    >
                        {relayRoute.transferUnit.id}
                    </text>
                </React.Fragment>
            )
            elements.push(element)

            // Add relay container
            x = start_x + 7 * SIZE
            y = relayStart_y + SIZE / 2
            let ingress = relayRoute.container.ingress(relayRoute.container.item)
            let egress = relayRoute.container.egress(relayRoute.container.item)
            let steadyStateEgress = relayRoute.container.steadyStateEgress(
                relayRoute.container.item,
            )
            let outputRate = relayRoute.container.outputRate
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
                <React.Fragment key={relayRoute.container.name}>
                    {relayRoute.container.producers.size > 0 && (
                        <React.Fragment>
                            <line
                                x1={x - SIZE}
                                y1={y + SIZE / 2}
                                x2={x - 10}
                                y2={y + SIZE / 2}
                                stroke="#000"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                            <text
                                x={x - 2}
                                y={y + SIZE / 2 - 5}
                                fill="green"
                                fontSize={FONTSIZE}
                                dominantBaseline="auto"
                                textAnchor="end"
                            >
                                {ingress + "/" + unit}
                            </text>
                        </React.Fragment>
                    )}
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
                x = start_x + 9 * SIZE
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
