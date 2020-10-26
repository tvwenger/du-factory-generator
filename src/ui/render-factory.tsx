import * as React from "react"
import { UncontrolledReactSVGPanZoom } from "react-svg-pan-zoom"
import { FactoryGraph } from "../graph"

export interface FactoryVisiualizationProps {
    factory: FactoryGraph
}

export function FactoryVisiualization({ factory }: FactoryVisiualizationProps) {
    const rects: JSX.Element[] = []

    let x = 10
    let y = 10
    /** Loop over containers */
    for (const container of factory.containers) {
        const rect = (
            <g key={container.name}>
                <rect x={x} y={y} width={50} height={50} fill="blue"></rect>
                <text x={x} y={y} fill="black" fontSize="10">
                    {container.name}
                </text>
            </g>
        )
        rects.push(rect)
        y += 60
        if (y > 600) {
            y = 10
            x += 60
        }
    }

    return (
        <UncontrolledReactSVGPanZoom width={1000} height={1000}>
            <svg height={500} width={500}>
                {rects}
            </svg>
        </UncontrolledReactSVGPanZoom>
    )
}
