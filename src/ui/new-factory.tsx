import * as React from "react"
import { Craftable, isCraftable, ITEMS } from "../items"
import { values } from "ramda"
import { ItemSelect } from "./item-select"
import { useMap } from "./app"
import { Button, Row, Col, InputNumber } from "antd"
import { buildFactory } from "../factory"
import { FactoryGraph } from "../graph"
import { FactoryVisualGraph } from "./render-factory"

enum NewFactoryStep {
    SELECT = "select",
    COUNT = "count",
    RENDER = "render",
}

export function NewFactory() {
    const [factory, setFactory] = React.useState<FactoryGraph>()
    const [factoryVisualGraph, setFactoryVisualGraph] = React.useState<FactoryVisualGraph>()
    const [factoryStep, setFactoryStep] = React.useState<NewFactoryStep>(NewFactoryStep.SELECT)
    const items = React.useMemo(() => values(ITEMS).filter(isCraftable), [ITEMS])
    const [selection, setSelection] = React.useState<Craftable[]>([])
    const [industryCounter, setIndustryCount] = useMap<Craftable, number>()
    const [maintainCounter, setMaintainCount] = useMap<Craftable, number>()
    const getIndustryCount = (item: Craftable) => industryCounter.get(item) || 1
    const getMaintainCount = (item: Craftable) => maintainCounter.get(item) || 1
    const getRequirements = () =>
        new Map<Craftable, { count: number; maintain: number }>(
            selection.map((item) => [
                item,
                { count: getIndustryCount(item), maintain: getMaintainCount(item) },
            ]),
        )

    let content = null
    switch (factoryStep) {
        case NewFactoryStep.COUNT:
            content = (
                <React.Fragment>
                    <h2>Select production quantity:</h2>
                    <Row>
                        <Col span={3}>Item</Col>
                        <Col span={2}>Assemblers</Col>
                        <Col span={2}>Maintain</Col>
                    </Row>
                    {selection.map((item) => (
                        <Row key={item.name}>
                            <Col span={3}>
                                <label>{item.name}</label>
                            </Col>
                            <Col span={2}>
                                <InputNumber
                                    min={1}
                                    value={getIndustryCount(item)}
                                    onChange={(value) => setIndustryCount(item, Number(value))}
                                />
                            </Col>
                            <Col span={2}>
                                <InputNumber
                                    min={1}
                                    value={getMaintainCount(item)}
                                    onChange={(value) => setMaintainCount(item, Number(value))}
                                />
                            </Col>
                        </Row>
                    ))}
                    <Button
                        type="primary"
                        onClick={() => {
                            setFactory(buildFactory(getRequirements()))
                            setFactoryVisualGraph(new FactoryVisualGraph(factory))
                            factoryVisualGraph.render()
                            setFactoryStep(NewFactoryStep.RENDER)
                        }}
                    >
                        Next
                    </Button>
                </React.Fragment>
            )
            break

        case NewFactoryStep.RENDER:
            content = (
                <React.Fragment>
                    <Button onClick={() => setFactoryStep(NewFactoryStep.COUNT)}>Back</Button>
                </React.Fragment>
            )
            break

        default:
            content = (
                <React.Fragment>
                    <h2>Select elements to build:</h2>
                    <ItemSelect items={items} value={selection} onChange={setSelection} />
                    <Button onClick={() => setFactoryStep(NewFactoryStep.COUNT)}>Next</Button>
                </React.Fragment>
            )
            break
    }

    return content
}
