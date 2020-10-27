/**
 * ui/render-factory.ts
 * React component for visualizing a factory graph
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { UncontrolledReactSVGPanZoom } from "react-svg-pan-zoom"
import { Category, Tier } from "../items"
import { FactoryGraph, FactoryNode, MAX_CONTAINER_LINKS, MAX_INDUSTRY_LINKS } from "../graph"

// order that the factory is visualized
const CATEGORY_ORDER = [
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
const TIER_ORDER = [Tier.BASIC, Tier.UNCOMMON, Tier.ADVANCED, Tier.RARE, Tier.EXOTIC]

/**
 * Sorting function to sort factory nodes by name
 * @param a First node
 * @param b Second node
 */
function sortName(a: FactoryNode, b: FactoryNode): number {
    var x = a.name.toLowerCase()
    var y = b.name.toLowerCase()
    if (x < y) {
        return -1
    }
    if (x > y) {
        return 1
    }
    return 0
}

/**
 * Properties of the FactoryVisualization component
 */
export interface FactoryVisualizationProps {
    // the factory graph to visualize
    factory: FactoryGraph
}

/**
 * Component for visualizing factory graph
 * @param props {@link FactoryVisualizationProps}
 */
export function FactoryVisualization({ factory }: FactoryVisualizationProps) {
    const visGroups: JSX.Element[] = []

    // geometry is as such, where each element is <size> pixels wide
    // incoming links -> industries -> containers -> outgoing links
    const size = 50

    // keep track of edges of each section
    let start_x = 100
    let start_y = 100
    let max_x = start_x
    let max_y = start_y

    // keep track of the top-left corner where we are currently placing items
    let x = start_x
    let y = start_y

    // input link spacing
    const inputSpacing = size / MAX_INDUSTRY_LINKS

    // loop over category
    for (const [category_i, category] of CATEGORY_ORDER.entries()) {
        // loop over tier
        for (const [tier_i, tier] of TIER_ORDER.entries()) {
            // Get containers
            const containers = Array.from(factory.containers).filter(
                (node) => node.item.category === category && node.item.tier === tier,
            )
            if (containers.length === 0) {
                continue
            }
            // Sort by name
            containers.sort((a, b) => sortName(a, b))

            // Loop over containers
            for (const container of containers) {
                // top-left corner of this container group
                const container_x = x + 4 * size
                const container_y = y

                // Get producers
                const producers = Array.from(container.producers)
                // Sort by name
                producers.sort((a, b) => sortName(a, b))

                // Loop over producers
                for (const producer of producers) {
                    // top-left corner of this producer group
                    const producer_x = x + 2 * size
                    const producer_y = y

                    // Get input links
                    const inputs = Array.from(producer.inputs)
                    // Sort by name
                    inputs.sort((a, b) => sortName(a, b))

                    // Loop over input links
                    for (const [input_i, input] of inputs.entries()) {
                        // top-left corner of this input link group
                        const input_x = x + size
                        const input_y =
                            producer_y +
                            size / 2 +
                            inputSpacing * (input_i - (inputs.length - 1) / 2)

                        // Add input link
                        const visGroup = (
                            <g key={input.name}>
                                <text
                                    x={input_x}
                                    y={input_y}
                                    fill="black"
                                    fontSize="10"
                                    dominant-baseline="middle"
                                    text-anchor="end"
                                >
                                    {input.name}
                                </text>
                            </g>
                        )
                        visGroups.push(visGroup)
                    }

                    // add producer
                    const visGroup = (
                        <g key={producer.name}>
                            <line
                                x1={producer_x - size}
                                y1={producer_y + size / 2}
                                x2={producer_x - 10}
                                y2={producer_y + size / 2}
                                stroke="#000"
                                stroke-width="2"
                                marker-end="url(#arrowhead)"
                            />
                            <circle
                                cx={producer_x + size / 2}
                                cy={producer_y + size / 2}
                                r={size / 2}
                                fill="gray"
                                stroke="green"
                                stroke-width="3"
                            />
                            <text
                                x={producer_x + size / 2}
                                y={producer_y}
                                fill="black"
                                fontSize="10"
                                dominant-baseline="auto"
                                text-anchor="middle"
                            >
                                {producer.name}
                            </text>
                        </g>
                    )
                    visGroups.push(visGroup)

                    // move y to next producer
                    y += 1.5 * size
                }
                y += -1.5 * size

                // add container
                const center_y = container_y + (y - container_y) / 2
                const visGroup = (
                    <g key={container.name}>
                        <line
                            x1={container_x - size}
                            y1={center_y + size / 2}
                            x2={container_x - 10}
                            y2={center_y + size / 2}
                            stroke="#000"
                            stroke-width="2"
                            marker-end="url(#arrowhead)"
                        />
                        <text
                            x={container_x - size / 2}
                            y={center_y + size / 2}
                            fill="green"
                            fontSize="10"
                            dominant-baseline="auto"
                            text-anchor="middle"
                        >
                            {Math.round(container.ingress * 100) / 100}
                        </text>
                        <rect
                            x={container_x}
                            y={center_y}
                            width={size}
                            height={size}
                            fill="gray"
                            stroke="red"
                            stroke-width="3"
                        />
                        <text
                            x={container_x + size / 2}
                            y={center_y}
                            fill="black"
                            fontSize="10"
                            dominant-baseline="auto"
                            text-anchor="middle"
                        >
                            {container.name}
                        </text>
                        <line
                            x1={container_x + size}
                            y1={center_y + size / 2}
                            x2={container_x + 2 * size - 10}
                            y2={center_y + size / 2}
                            stroke="#000"
                            stroke-width="2"
                            marker-end="url(#arrowhead)"
                        />
                        <text
                            x={container_x + 1.5 * size}
                            y={center_y + size / 2}
                            fill="red"
                            fontSize="10"
                            dominant-baseline="auto"
                            text-anchor="middle"
                        >
                            {Math.round(container.egress * 100) / 100}
                        </text>
                    </g>
                )
                visGroups.push(visGroup)

                // Get output links
                const outputs = Array.from(container.consumers)
                // Sort by name
                outputs.sort((a, b) => sortName(a, b))

                // Loop over output links
                for (const [output_i, output] of outputs.entries()) {
                    // top-left corner of this output link group
                    const output_x = x + 6 * size
                    const output_y =
                        center_y + size / 2 + inputSpacing * (output_i - (outputs.length - 1) / 2)

                    // Add output link
                    const visGroup = (
                        <g key={output.name}>
                            <text
                                x={output_x}
                                y={output_y}
                                fill="black"
                                fontSize="10"
                                dominant-baseline="middle"
                                text-anchor="start"
                            >
                                {output.name}
                            </text>
                        </g>
                    )
                    visGroups.push(visGroup)
                }

                // move y to next container
                y += 2 * size
            }
            if (y + start_y > max_y) {
                max_y = y + start_y
            }
            // move to next column
            x += 10 * size
            y = start_y
        }
    }
    if (x + start_x > max_x) {
        max_x = x + start_x
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
                {visGroups}
            </svg>
        </UncontrolledReactSVGPanZoom>
    )
}
