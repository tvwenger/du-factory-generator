import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Button } from "antd"
import { UncontrolledReactSVGPanZoom } from "react-svg-pan-zoom"
import { FONTSIZE, FactoryVisualizationComponentProps } from "./render-factory"
import { FactoryInstruction } from "./generate-instructions"

const MAX_IMAGE_SIZE = 12500

/**
 * Component for visualizing factory graph as a large map
 * @param props {@link FactoryVisualizationComponentProps}
 */
export function FactoryMap({ instructions }: FactoryVisualizationComponentProps) {
    // get inner SVG
    const [innerSVG, width, height] = React.useMemo(() => generateInnerSVG(instructions), [
        instructions,
    ])

    function preparePNGDownload() {
        const canvas = document.createElement("canvas")
        let scale = 1.0
        let scaleWidth = width
        let scaleHeight = height
        if (scaleWidth > MAX_IMAGE_SIZE) {
            scaleHeight *= MAX_IMAGE_SIZE / scaleWidth
            scaleWidth *= MAX_IMAGE_SIZE / scaleWidth
        }
        if (scaleHeight > MAX_IMAGE_SIZE) {
            scaleWidth *= MAX_IMAGE_SIZE / scaleHeight
            scaleHeight *= MAX_IMAGE_SIZE / scaleHeight
        }
        canvas.width = scaleWidth
        canvas.height = scaleHeight
        const ctx = canvas.getContext("2d")!
        const svg = (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height={height}
                width={width}
                style={{ backgroundColor: "white" }}
            >
                {innerSVG}
            </svg>
        )
        const svgBlob = new Blob([renderToStaticMarkup(svg)], {
            type: "image/svg+xml;charset=utf-8",
        })
        const DOMURL = window.URL || window.webkitURL
        const svgURL = DOMURL.createObjectURL(svgBlob)
        const img = new Image()
        img.onload = () => {
            ctx.drawImage(img, 0, 0, scaleWidth, scaleHeight)
            DOMURL.revokeObjectURL(svgURL)
            triggerPNGDownload(canvas)
        }
        img.src = svgURL
    }

    function triggerPNGDownload(canvas: HTMLCanvasElement) {
        const imgURI = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = "factory-map.png"
        link.href = imgURI
        document.body.appendChild(link)
        link.click()
        link.remove()
        canvas.remove()
    }

    return (
        <React.Fragment>
            <Button onClick={preparePNGDownload}>Download Image as PNG</Button>
            <Button
                href={`data:image/svg+xml,${encodeURIComponent(
                    renderToStaticMarkup(
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height={height}
                            width={width}
                            style={{ backgroundColor: "white" }}
                        >
                            {innerSVG}
                        </svg>,
                    ),
                )}`}
                download="factory-map.svg"
            >
                Download Image as SVG
            </Button>
            <div style={{ border: "1px solid black", width: 0.9 * window.innerWidth + 2 }}>
                <UncontrolledReactSVGPanZoom
                    width={0.9 * window.innerWidth}
                    height={0.9 * window.innerHeight}
                >
                    <svg height={height} width={width}>
                        {innerSVG}
                    </svg>
                </UncontrolledReactSVGPanZoom>
            </div>
        </React.Fragment>
    )
}

/**
 * Generate SVG inner components, determine SVG dimensions
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
            <g key={instruction.name + "group"} transform={translate}>
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
            if (nextInstruction.section !== instruction.section) {
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
                        <tspan x="0" dy="1em">
                            {instruction.header1}
                        </tspan>
                        <tspan x="0" dy="1em">
                            {instruction.header2}
                        </tspan>
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
