/**
 * ui/render-factory.ts
 * React component for visualizing a factory graph
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Button } from "antd"
import { UncontrolledReactSVGPanZoom } from "react-svg-pan-zoom"
import { saveSvgAsPng } from "save-svg-as-png"
import { isContainerNode, isTransferContainerNode } from "../graph"
import { FactoryInstruction } from "./factory-instruction"
import { FONTSIZE, FactoryVisualizationComponentProps } from "./render-factory"

/**
 * Component for visualizing factory graph as a large map
 * @param props {@link FactoryVisualizationComponentProps}
 */
export function FactoryMap({ instructions }: FactoryVisualizationComponentProps) {
    // download state
    const [downloadPNG, setDownloadPNG] = React.useState(false)

    // get inner SVG
    const [innerSVG, width, height] = React.useMemo(() => generateInnerSVG(instructions), [
        instructions,
    ])

    if (downloadPNG) {
        return (
            <FactoryMapDownload
                innerSVG={innerSVG}
                width={width}
                height={height}
                setDownloadPNG={setDownloadPNG}
            />
        )
    }
    return (
        <React.Fragment>
            <Button onClick={() => setDownloadPNG(true)}>Download Image</Button>
            <UncontrolledReactSVGPanZoom width={800} height={600}>
                <svg height={height} width={width}>
                    {innerSVG}
                </svg>
            </UncontrolledReactSVGPanZoom>
        </React.Fragment>
    )
}

/**
 * Properties of the FactoryMapDownload component
 */
export interface FactoryMapDownloadProps {
    // factory inner SVG elements
    innerSVG: JSX.Element

    // SVG size
    height: number
    width: number

    // Change parent state
    setDownloadPNG: (state: boolean) => void
}

/**
 * Component for downloading the full map
 * @param props {@link FactoryMapDownloadProps}
 */
export function FactoryMapDownload({
    innerSVG,
    height,
    width,
    setDownloadPNG,
}: FactoryMapDownloadProps) {
    React.useEffect(() => {
        saveSvgAsPng(document.getElementById("factory-map-svg")!, "factory-map.png")
    }, [])

    return (
        <React.Fragment>
            <Button onClick={() => setDownloadPNG(false)}>Interactive Factory Map</Button>
            <svg
                height={height}
                width={width}
                style={{ backgroundColor: "white" }}
                id="factory-map-svg"
            >
                {innerSVG}
            </svg>
        </React.Fragment>
    )
}

/**
 * Generate SVG inner components
 * @param instructions the Factory instructions
 */
export function generateInnerSVG(
    instructions: FactoryInstruction[],
): [JSX.Element, number, number] {
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

    const element = (
        <React.Fragment>
            <marker id="arrowhead" markerWidth="5" markerHeight="4" refX="0" refY="2" orient="auto">
                <polygon points="0 0, 5 2, 0 4" />
            </marker>
            {elements}
        </React.Fragment>
    )

    return [element, max_x, max_y]
}
