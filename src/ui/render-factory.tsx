import * as React from "react"
import { Button, Row, Col } from "antd"
import { Category, Tier, Item, CONTAINERS_ASCENDING_BY_CAPACITY } from "../items"
import { FactoryGraph } from "../graph"
import { FactoryState } from "./factory"
import { serialize } from "../serialize"
import { FactoryInstruction, sortName } from "./generate-instructions"
import { FactoryMap } from "./factory-map"
import { Container } from "../container"
import { TransferContainer } from "../transfer-container"
const example = require("../assets/example.png")

enum VisualizationState {
    LIST = "list",
    INSTRUCTIONS = "instructions",
    MAP = "map",
}

// order that the factory is visualized
export const CATEGORY_ORDER = [
    Category.ORE,
    Category.PURE,
    Category.CATALYST,
    Category.PRODUCT,
    Category.STRUCTURAL_PART,
    Category.INTERMEDIARY_PART,
    Category.COMPLEX_PART,
    Category.EXCEPTIONAL_PART,
    Category.FUNCTIONAL_PART,
    Category.SCRAP,
    Category.PURE_HONEYCOMB,
    Category.PRODUCT_HONEYCOMB,
    Category.FUEL,
    Category.WARP_CELLS,
    Category.AMMO,
    Category.COMBAT_ELEMENT,
    Category.FURNITURE_AND_APPLIANCES_ELEMENT,
    Category.INDUSTRY_AND_INFRASTRUCTURE_ELEMENT,
    Category.PILOTING_ELEMENT,
    Category.PLANET_ELEMENT,
    Category.SYSTEMS_ELEMENT,
]

export const TIER_ORDER = [
    Tier.GAS,
    Tier.BASIC,
    Tier.UNCOMMON,
    Tier.ADVANCED,
    Tier.RARE,
    Tier.EXOTIC,
]

// industry labels
export const INDUSTRYLABELS: { [key: string]: string } = {
    "Assembly Line XS": "XS",
    "Assembly Line S": "S",
    "Assembly Line M": "M",
    "Assembly Line L": "L",
    "Assembly Line XL": "XL",
    "3D Printer M": "3D",
    "Chemical Industry M": "Che",
    "Electronics Industry M": "Ele",
    "Glass Furnace M": "Gla",
    "Metalwork Industry M": "Met",
    "Recycler M": "Rec",
    "Refiner M": "Ref",
    "Smelter M": "Sme",
}

// Full tier names
const TIER = ["", "", "", "Uncommon ", "Advanced ", "Rare "]

// Abbreviated tier labels
export const TIERLABELS: { [key: number]: string } = {
    0: "",
    1: "",
    2: "",
    3: "Unc ",
    4: "Adv ",
    5: "Rare ",
}

// container labels
export const CONTAINERLABELS: { [key: string]: string } = {
    "Container XS": "XS",
    "Container S": "S",
    "Container M": "M",
    "Container L": "L",
    "Container XL": "XL",
}

// The size (in pixels) of a node item in the visualization
export const SIZE = 60

// The size (in pt) of the font
export const FONTSIZE = 10

// Spacing between link lines
export const LINKSPACING = 1.1 * FONTSIZE

/**
 * Generate string representation of required container size(s)
 */
export function containerLabel(container: Container | TransferContainer) {
    let labels = []

    // Loop over container sizes from large to small
    if (CONTAINERS_ASCENDING_BY_CAPACITY.length < 1) {
        throw new Error("CONTAINERS_ASCENDING_BY_CAPACITY is empty")
    }
    for (let i = CONTAINERS_ASCENDING_BY_CAPACITY.length - 1; i >= 0; i--) {
        const containerCount = container.containers.reduce(
            (total, current) =>
                current === CONTAINERS_ASCENDING_BY_CAPACITY[i].name ? total + 1 : total,
            0,
        )
        if (containerCount > 1) {
            labels.push(containerCount + CONTAINERLABELS[CONTAINERS_ASCENDING_BY_CAPACITY[i].name])
        } else if (containerCount > 0) {
            labels.push(CONTAINERLABELS[CONTAINERS_ASCENDING_BY_CAPACITY[i].name])
        }
    }
    return labels.join("+")
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
     * Set the factory
     * @param factory the FactoryGraph
     */
    setFactory: (factory: FactoryGraph | undefined) => void

    // the starting factory graph
    startingFactory: FactoryGraph | undefined

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
    setFactory,
    startingFactory,
    setFactoryState,
    instructions,
}: FactoryVisualizationProps) {
    // The state of the visualization
    const [visualizationState, setVisualizationState] = React.useState<VisualizationState>()
    // Flag to show the legend
    const [showLegend, setShowLegend] = React.useState<boolean>(false)

    let content = null
    switch (visualizationState) {
        default:
            // get count of industry, schematic, and container types
            const industryCount = new Map<string, number>()
            let totalIndustries = 0
            const containerCount = new Map<string, number>()
            let totalContainers = 0
            const schematicCount = new Map<Item, number>()

            if (factory !== undefined) {
                Array.from(factory.industries).map((node) => {
                    const industry = TIER[node.item.tier] + node.recipe.industry
                    totalIndustries += 1
                    if (industryCount.has(industry)) {
                        industryCount.set(industry, industryCount.get(industry)! + 1)
                    } else {
                        industryCount.set(industry, 1)
                    }
                    if (schematicCount.has(node.item)) {
                        schematicCount.set(node.item, schematicCount.get(node.item)! + 1)
                    } else {
                        schematicCount.set(node.item, 1)
                    }
                })
                industryCount.set(
                    "Transfer Unit",
                    Array.from(factory.transferUnits)
                        .filter((transferUnit) => !transferUnit.merged)
                        .map((transferUnit) => transferUnit.number)
                        .reduce((total, current) => total + current, 0),
                )
                totalIndustries += Array.from(factory.transferUnits).filter(
                    (transferUnit) => !transferUnit.merged,
                ).length

                Array.from(factory.containers)
                    .filter((container) => !container.merged)
                    .map((container) => {
                        for (const containerSize of container.containers) {
                            totalContainers += 1
                            if (containerCount.has(containerSize)) {
                                containerCount.set(
                                    containerSize,
                                    containerCount.get(containerSize)! + 1,
                                )
                            } else {
                                containerCount.set(containerSize, 1)
                            }
                        }
                    })
                Array.from(factory.transferContainers).map((container) => {
                    for (const containerSize of container.containers) {
                        totalContainers += 1
                        if (containerCount.has(containerSize)) {
                            containerCount.set(
                                containerSize,
                                containerCount.get(containerSize)! + 1,
                            )
                        } else {
                            containerCount.set(containerSize, 1)
                        }
                    }
                })
            }

            content = (
                <React.Fragment>
                    <Button onClick={() => setVisualizationState(VisualizationState.INSTRUCTIONS)}>
                        Building Instructions
                    </Button>
                    <Button onClick={() => setVisualizationState(VisualizationState.MAP)}>
                        Factory Map
                    </Button>
                    <br />
                    <h2>Factory Industries ({totalIndustries}):</h2>
                    <Row>
                        <Col span={4}>Industry Type</Col>
                        <Col span={4}>Count</Col>
                    </Row>
                    {Array.from(industryCount)
                        .sort()
                        .map(([key, value]) => (
                            <Row key={key}>
                                <Col span={4}>{key}</Col>
                                <Col span={4}>{value}</Col>
                            </Row>
                        ))}
                    <h2>Factory Containers ({totalContainers}):</h2>
                    <Row>
                        <Col span={4}>Container Type</Col>
                        <Col span={4}>Count</Col>
                    </Row>
                    {Array.from(containerCount)
                        .sort()
                        .map(([key, value]) => (
                            <Row key={key}>
                                <Col span={4}>{key}</Col>
                                <Col span={4}>{value}</Col>
                            </Row>
                        ))}
                    <h2>Factory Schematics:</h2>
                    <Row>
                        <Col span={4}>Item</Col>
                        <Col span={4}>Count</Col>
                    </Row>
                    {Array.from(schematicCount)
                        .sort((a, b) => sortName(a[0], b[0]))
                        .map(([key, value]) => (
                            <Row key={key.name}>
                                <Col span={4}>{key.name}</Col>
                                <Col span={4}>{value}</Col>
                            </Row>
                        ))}
                </React.Fragment>
            )
            break
        case VisualizationState.INSTRUCTIONS:
            content = (
                <React.Fragment>
                    <Button onClick={() => setVisualizationState(VisualizationState.LIST)}>
                        Factory Summary
                    </Button>
                    <Button onClick={() => setVisualizationState(VisualizationState.MAP)}>
                        Factory Map
                    </Button>
                    {showLegend && (
                        <React.Fragment>
                            <Button onClick={() => setShowLegend(false)}>Hide Legend</Button>
                            <br />
                            <img src={example.default} width="600px" />
                        </React.Fragment>
                    )}
                    {!showLegend && (
                        <Button onClick={() => setShowLegend(true)}>Show Legend</Button>
                    )}
                    <br />
                    <FactoryInstructions instructions={instructions} />
                </React.Fragment>
            )
            break
        case VisualizationState.MAP:
            content = (
                <React.Fragment>
                    <Button onClick={() => setVisualizationState(VisualizationState.LIST)}>
                        Factory Summary
                    </Button>
                    <Button onClick={() => setVisualizationState(VisualizationState.INSTRUCTIONS)}>
                        Building Instructions
                    </Button>
                    {showLegend && (
                        <React.Fragment>
                            <Button onClick={() => setShowLegend(false)}>Hide Legend</Button>
                            <br />
                            <img src={example.default} width="600px" />
                        </React.Fragment>
                    )}
                    {!showLegend && (
                        <Button onClick={() => setShowLegend(true)}>Show Legend</Button>
                    )}
                    <br />
                    <FactoryMap instructions={instructions} />
                </React.Fragment>
            )
            break
    }

    return (
        <React.Fragment>
            <ul>
                <li>Factory Summary: List the required industries, containers, and schematics</li>
                <li>
                    Download Factory as JSON: Save the factory to a file and start new factory
                    additions from the current state
                </li>
                <li>Building Instructions: Step-by-step instructions for building the factory</li>
                <li>Factory Map: Visualize the entire factory plan at once</li>
            </ul>
            <Button
                onClick={() => {
                    setFactory(startingFactory)
                    setFactoryState(FactoryState.COUNT)
                }}
            >
                Back
            </Button>
            <Button
                href={`data:text/json;charset=utf-8,${encodeURIComponent(serialize(factory!))}`}
                download="factory.json"
            >
                Download Factory as JSON
            </Button>
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
            <br />
            {step < instructions.length - 1 && (
                <Button onClick={() => setStep(step + 1)}>Next Step</Button>
            )}
            {step > 0 && <Button onClick={() => setStep(step - 1)}>Previous Step</Button>}
            <br />
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
        </React.Fragment>
    )
}
