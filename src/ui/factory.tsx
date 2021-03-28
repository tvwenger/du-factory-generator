import * as React from "react"
import { Craftable, isCraftable, ITEMS } from "../items"
import { values } from "ramda"
import { useMap, AppState } from "./app"
import { Button, Upload, Row, Col } from "antd"
import { FactorySelect } from "./factory-select"
import { FactoryCount } from "./factory-count"
import { FactoryGraph, PerSecond } from "../graph"
import { FactoryVisualization } from "./render-factory"
import { deserialize } from "../serialize"
import { findRecipe, Recipe } from "../recipes"
import { FactoryInstruction } from "./generate-instructions"

export enum FactoryState {
    UPLOAD = "upload",
    SELECT = "select",
    COUNT = "count",
    RENDER = "render",
    ERROR = "error",
}

/**
 * Properties of the Factory component
 */
interface FactoryProps {
    /**
     * Set the parent application state
     * @param state the AppState
     */
    setAppState: (state: AppState) => void

    // Starting factory state
    startFactoryState: FactoryState
}

/**
 * Factory component
 * @param props {@link FactoryProps}
 */
export function Factory({ setAppState, startFactoryState }: FactoryProps) {
    // all possible craftable items
    const items = React.useMemo(() => values(ITEMS).filter(isCraftable), [ITEMS])
    // current and previous factory state
    const [factoryState, setFactoryState] = React.useState<FactoryState>(startFactoryState)
    // error message
    const [errorMessage, setErrorMessage] = React.useState<string>()
    //  factory building instructions instructions
    const [factoryInstructions, setFactoryInstructions] = React.useState<FactoryInstruction[]>([])
    // produced items, industry count, and maintain count
    const [selection, setSelection] = React.useState<Craftable[]>([])
    const [productionRate, setProductionRate, setProductionRateMap] = useMap<Craftable, PerSecond>()
    const [maintainValue, setMaintainValue, setMaintainValueMap] = useMap<Craftable, number>()
    // the recipes for all produced items
    const recipes = React.useMemo(
        () => new Map<Craftable, Recipe>(selection.map((item) => [item, findRecipe(item)])),
        [selection],
    )
    // the FactoryGraph and a flag to show differences
    const [showDifferences, setShowDifferences] = React.useState<boolean>(false)
    const [startingFactory, setStartingFactory] = React.useState<FactoryGraph>()
    const [factory, setFactory] = React.useState<FactoryGraph>()
    // parse the production rate and maintain values, generate requirements
    const getProductionRate = (item: Craftable) =>
        productionRate.get(item) || recipes.get(item)!.product.quantity / recipes.get(item)!.time
    const getMaintainValue = (item: Craftable) =>
        maintainValue.get(item) || Math.ceil(getProductionRate(item) * 24 * 3600)
    const getRequirements = () =>
        new Map<Craftable, { rate: PerSecond; maintain: number }>(
            selection.map((item) => [
                item,
                { rate: getProductionRate(item), maintain: getMaintainValue(item) },
            ]),
        )

    switch (factoryState) {
        default:
            return (
                <React.Fragment>
                    <Button onClick={() => setAppState(AppState.HOME)}>Back</Button>
                    <ExistingFactorySummary factory={startingFactory} />
                    <FactorySelect
                        setFactoryState={setFactoryState}
                        items={items}
                        selection={selection}
                        setSelection={setSelection}
                        setProductionRateMap={setProductionRateMap}
                        setMaintainValueMap={setMaintainValueMap}
                    />
                </React.Fragment>
            )
        case FactoryState.UPLOAD:
            return (
                <React.Fragment>
                    <Button onClick={() => setAppState(AppState.HOME)}>Back</Button>
                    <br />
                    <Upload
                        accept=".json"
                        showUploadList={false}
                        beforeUpload={(file) => {
                            const reader = new FileReader()
                            reader.onload = () => {
                                const factoryJSON = reader.result as string
                                const uploadedFactory = deserialize(factoryJSON)
                                setStartingFactory(uploadedFactory)
                                // create another copy to be modified
                                const uploadedFactoryCopy = deserialize(factoryJSON)
                                setFactory(uploadedFactoryCopy)
                                setShowDifferences(true)
                                setStartingFactory(uploadedFactory)
                                setFactoryState(FactoryState.SELECT)
                            }
                            reader.readAsText(file)
                            // skip upload
                            return false
                        }}
                    >
                        <h2>Start from an Existing Factory</h2>
                        <ul>
                            <li>Upload a JSON file previously generated by this tool</li>
                        </ul>
                        <Button type="primary">Upload Factory JSON</Button>
                    </Upload>
                </React.Fragment>
            )
        case FactoryState.COUNT:
            return (
                <React.Fragment>
                    <Button onClick={() => setFactoryState(FactoryState.SELECT)}>Back</Button>
                    <ExistingFactorySummary factory={startingFactory} />
                    <FactoryCount
                        selection={selection}
                        recipes={recipes}
                        setFactoryState={setFactoryState}
                        setErrorMessage={setErrorMessage}
                        setProductionRate={setProductionRate}
                        getProductionRate={getProductionRate}
                        setMaintainValue={setMaintainValue}
                        getMaintainValue={getMaintainValue}
                        getRequirements={getRequirements}
                        factory={factory}
                        setFactory={setFactory}
                        setFactoryInstructions={setFactoryInstructions}
                        showDifferences={showDifferences}
                    />
                </React.Fragment>
            )
        case FactoryState.RENDER:
            return (
                <FactoryVisualization
                    factory={factory}
                    setFactory={setFactory}
                    startingFactory={startingFactory}
                    setFactoryState={setFactoryState}
                    instructions={factoryInstructions!}
                />
            )
        case FactoryState.ERROR:
            return (
                <React.Fragment>
                    <Button onClick={() => setFactoryState(FactoryState.COUNT)}>Back</Button>
                    <h2>
                        <div id="error">Factory Error</div>
                    </h2>
                    {errorMessage} <br />
                    <div id="error">Please report this to the developers!</div>
                </React.Fragment>
            )
    }
}

/**
 * Properties of the ExistingFactorySummary component
 */
interface ExistingFactorySummaryProps {
    // the factory graph
    factory: FactoryGraph | undefined
}

/**
 * ExistingFactoryFactory component
 * @param props {@link ExistingFactorySummaryProps}
 */
export function ExistingFactorySummary({ factory }: ExistingFactorySummaryProps) {
    if (factory === undefined) {
        return <React.Fragment></React.Fragment>
    }

    const elements = []
    for (const output of factory.containers) {
        if (output.outputRate > 0) {
            let productionRate = output.outputRate
            let unit = "second"
            if (productionRate < 1.0) {
                productionRate *= 60.0
                unit = "minute"
            }
            if (productionRate < 1.0) {
                productionRate *= 60.0
                unit = "hour"
            }
            if (productionRate < 1.0) {
                productionRate *= 24.0
                unit = "day"
            }
            // round to 2 decimals
            productionRate = Math.round(productionRate * 100) / 100
            const element = (
                <Row key={output.name}>
                    <Col span={3}>{output.item.name}</Col>
                    <Col span={2}>{productionRate + " / " + unit}</Col>
                    <Col span={2}>{output.maintainedOutput}</Col>
                </Row>
            )
            elements.push(element)
        }
    }

    if (elements.length > 0) {
        return (
            <React.Fragment>
                <h2>Existing Factory Production</h2>
                <Row>
                    <Col span={3}>Item</Col>
                    <Col span={2}>Production Rate</Col>
                    <Col span={2}>Maintain</Col>
                </Row>
                {elements}
            </React.Fragment>
        )
    }
    return <React.Fragment></React.Fragment>
}
