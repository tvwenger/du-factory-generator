import * as React from "react"
import { Button, Row, Col, Table, Space, Divider, Popover } from "antd"
import { Category, Tier, Item, CONTAINERS_ASCENDING_BY_CAPACITY, getRequiredOres } from "../items"
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
    "Expanded Container XL": "EXL",
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

    // Items selected to build
    selection: Item[]

    // ore prices
    orePrices: { [key: string]: number }
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
    selection,
    orePrices,
}: FactoryVisualizationProps) {
    // The state of the visualization
    const [visualizationState, setVisualizationState] = React.useState<VisualizationState>()
    // Flag to show the legend
    const [showLegend, setShowLegend] = React.useState<boolean>(false)

    // Scroll to top on render
    React.useEffect(() => {
        window.scrollTo(0, 0)
    })

    let content = null
    switch (visualizationState) {
        default:
            // get count of industry, schematic, and container types
            const industryCount: { [key: string]: number } = {}
            let totalIndustries = 0
            const containerCount: { [key: string]: number } = {}
            let totalContainers = 0
            const schematicCount: { [key: string]: number } = {}

            // Get ore values
            const requiredOres: { [key: string]: { [key: string]: number } } = {}
            const oreValues: { [key: string]: number } = {}

            if (factory !== undefined) {
                Array.from(factory.industries).map((node) => {
                    const industry = TIER[node.item.tier] + node.recipe.industry
                    totalIndustries += 1
                    if (industryCount[industry] === undefined) {
                        industryCount[industry] = 0
                    }
                    industryCount[industry] += 1
                    if (schematicCount[node.item.name] === undefined) {
                        schematicCount[node.item.name] = 0
                    }
                    schematicCount[node.item.name] += 1
                })
                industryCount["Transfer Unit"] = Array.from(factory.transferUnits)
                    .filter((transferUnit) => !transferUnit.merged)
                    .map((transferUnit) => transferUnit.number)
                    .reduce((total, current) => total + current, 0)
                totalIndustries += Array.from(factory.transferUnits).filter(
                    (transferUnit) => !transferUnit.merged,
                ).length

                Array.from(factory.containers)
                    .filter((container) => !container.merged)
                    .map((container) => {
                        // count container hubs
                        if (container.containers.length > 1) {
                            if (containerCount["Container Hub"] === undefined) {
                                containerCount["Container Hub"] = 0
                            }
                            containerCount["Container Hub"] += 1
                        }
                        for (const containerSize of container.containers) {
                            totalContainers += 1
                            if (containerCount[containerSize] === undefined) {
                                containerCount[containerSize] = 0
                            }
                            containerCount[containerSize] += 1
                        }
                    })
                Array.from(factory.transferContainers).map((container) => {
                    for (const containerSize of container.containers) {
                        totalContainers += 1
                        if (containerCount[containerSize] === undefined) {
                            containerCount[containerSize] = 0
                        }
                        containerCount[containerSize] += 1
                    }
                })

                // get ore requirements per item
                selection.map((item) => {
                    const ores = getRequiredOres(item, requiredOres, factory.talentLevels)
                    requiredOres[item.name] = ores
                })

                // get ore values per item
                selection.map((item) => {
                    oreValues[item.name] = 0
                    Object.keys(requiredOres[item.name]).map((ore, index) => {
                        oreValues[item.name] += orePrices[ore] * requiredOres[item.name][ore]
                    })
                })
            }

            // Save industry table columns and data
            const industryColumns = [
                {
                    title: "Industry",
                    dataIndex: "industry",
                    key: "industry",
                },
                {
                    title: "Count",
                    dataIndex: "count",
                    key: "count",
                },
            ]
            const industryData: {}[] = []
            Object.keys(industryCount)
                .sort()
                .map((key) =>
                    industryData.push({
                        key: industryData.length,
                        industry: key,
                        count: industryCount[key],
                    }),
                )

            // Save container table columns and data
            const containerColumns = [
                {
                    title: "Container",
                    dataIndex: "container",
                    key: "container",
                },
                {
                    title: "Count",
                    dataIndex: "count",
                    key: "count",
                },
            ]
            const containerData: {}[] = []
            Object.keys(containerCount)
                .sort()
                .map((key) =>
                    containerData.push({
                        key: containerData.length,
                        container: key,
                        count: containerCount[key],
                    }),
                )

            // Save schematic table columns and data
            const schematicColumns = [
                {
                    title: "Schematic",
                    dataIndex: "schematic",
                    key: "schematic",
                },
                {
                    title: "Count",
                    dataIndex: "count",
                    key: "count",
                },
            ]
            const schematicData: {}[] = []
            Object.keys(schematicCount)
                .sort()
                .map((key) =>
                    schematicData.push({
                        key: schematicData.length,
                        schematic: key,
                        count: schematicCount[key],
                    }),
                )

            // Save ore value table columns and data
            const oreValueColumns = [
                {
                    title: "Item",
                    dataIndex: "item",
                    key: "item",
                    render: (value: string) => {
                        const content = (
                            <div>
                                {Object.keys(requiredOres[value]).map((ore) => (
                                    <p key={ore}>
                                        {ore +
                                            ": " +
                                            Math.round(requiredOres[value][ore]) +
                                            " @ " +
                                            Math.round(orePrices[ore]) +
                                            " quanta/L = " +
                                            Math.round(requiredOres[value][ore] * orePrices[ore]) +
                                            " quanta"}
                                    </p>
                                ))}
                            </div>
                        )
                        return (
                            <Popover
                                placement="topLeft"
                                title={value}
                                content={content}
                                trigger="hover"
                            >
                                <a>{value}</a>
                            </Popover>
                        )
                    },
                },
                {
                    title: "Ore Value",
                    dataIndex: "value",
                    key: "value",
                    render: (value: number) => {
                        if (isNaN(value)) {
                            return "Ore prices not set"
                        }
                        return value
                    },
                },
            ]
            const oreValueData: {}[] = []
            Object.keys(oreValues)
                .sort()
                .map((key) =>
                    oreValueData.push({
                        key: oreValueData.length,
                        item: key,
                        value: Math.round(oreValues[key]),
                    }),
                )

            content = (
                <React.Fragment>
                    <Space>
                        <Button
                            onClick={() => setVisualizationState(VisualizationState.INSTRUCTIONS)}
                        >
                            Building Instructions
                        </Button>
                        <Button onClick={() => setVisualizationState(VisualizationState.MAP)}>
                            Factory Map
                        </Button>
                    </Space>
                    <Row gutter={16}>
                        <Col span={6}>
                            <h2>Industries ({totalIndustries})</h2>
                            <Table
                                columns={industryColumns}
                                dataSource={industryData}
                                pagination={false}
                            />
                        </Col>
                        <Col span={6}>
                            <h2>Containers ({totalContainers})</h2>
                            <Table
                                columns={containerColumns}
                                dataSource={containerData}
                                pagination={false}
                            />
                        </Col>
                        <Col span={6}>
                            <h2>Schematics</h2>
                            <Table
                                columns={schematicColumns}
                                dataSource={schematicData}
                                pagination={false}
                            />
                        </Col>
                        <Col span={6}>
                            <h2>Ore Values</h2>
                            <Table
                                columns={oreValueColumns}
                                dataSource={oreValueData}
                                pagination={false}
                            />
                        </Col>
                    </Row>
                </React.Fragment>
            )
            break
        case VisualizationState.INSTRUCTIONS:
            content = (
                <React.Fragment>
                    <Space>
                        <Button onClick={() => setVisualizationState(VisualizationState.LIST)}>
                            Factory Summary
                        </Button>
                        <Button onClick={() => setVisualizationState(VisualizationState.MAP)}>
                            Factory Map
                        </Button>
                        {showLegend && (
                            <Button onClick={() => setShowLegend(false)}>Hide Legend</Button>
                        )}
                        {!showLegend && (
                            <Button onClick={() => setShowLegend(true)}>Show Legend</Button>
                        )}
                    </Space>
                    {showLegend && (
                        <React.Fragment>
                            <br />
                            <img src={example.default} width="600px" />
                        </React.Fragment>
                    )}
                    <br />
                    <FactoryInstructions instructions={instructions} />
                </React.Fragment>
            )
            break
        case VisualizationState.MAP:
            content = (
                <React.Fragment>
                    <Space>
                        <Button onClick={() => setVisualizationState(VisualizationState.LIST)}>
                            Factory Summary
                        </Button>
                        <Button
                            onClick={() => setVisualizationState(VisualizationState.INSTRUCTIONS)}
                        >
                            Building Instructions
                        </Button>
                        {showLegend && (
                            <Button onClick={() => setShowLegend(false)}>Hide Legend</Button>
                        )}
                        {!showLegend && (
                            <Button onClick={() => setShowLegend(true)}>Show Legend</Button>
                        )}
                    </Space>
                    {showLegend && (
                        <React.Fragment>
                            <br />
                            <img src={example.default} width="600px" />
                        </React.Fragment>
                    )}
                    <br />
                    <FactoryMap instructions={instructions} />
                </React.Fragment>
            )
            break
    }

    return (
        <React.Fragment>
            <Button
                onClick={() => {
                    setFactory(startingFactory)
                    setFactoryState(FactoryState.COUNT)
                }}
            >
                Back
            </Button>
            <h2>Factory Generator Results</h2>
            <Divider orientation="left">Instructions</Divider>
            <ul>
                <li>
                    Factory Summary: List the required industries, containers, schematics, and raw
                    ore values of produced items.
                </li>
                <li>Download Factory as JSON: Save the factory to a file.</li>
                <li>Building Instructions: Step-by-step instructions for building the factory.</li>
                <li>Factory Map: Visualize the entire factory plan at once.</li>
            </ul>
            <Button
                href={`data:text/json;charset=utf-8,${encodeURIComponent(serialize(factory!))}`}
                download="factory.json"
            >
                Download Factory as JSON
            </Button>
            <br />
            <br />
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
