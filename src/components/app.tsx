import * as React from "react"
import { Fragment, useMemo, useState } from "react"
import { Craftable, isCraftable, ITEMS } from "../items"
import { values } from "ramda"
import { ItemSelect } from "./item-select"
import { Button, Col, InputNumber, Row } from "antd"
import { buildFactory } from "../factory"
import { FactoryGraph } from "../graph"
var joint = require("jointjs")

/**
 * Root component of the app
 */
export function App() {
    const items = useMemo(() => values(ITEMS).filter(isCraftable), [ITEMS])

    const [selection, setSelection] = useState<Craftable[]>([])

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

    return (
        <Fragment>
            <ItemSelect items={items} value={selection} onChange={setSelection} />
            <Row>
                <Col span={6}>Item</Col>
                <Col span={2}>Assemblers</Col>
                <Col span={2}>Maintain</Col>
            </Row>
            {selection.map((item) => (
                <Row key={item.name}>
                    <Col span={6}>
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
            <Button type="primary" onClick={() => Graph(buildFactory(getRequirements()))}>
                Generate
            </Button>
        </Fragment>
    )
}

/**
 * Visualize factory graph
 */
export function Graph(factory: FactoryGraph) {
    console.log("Build factory")
    var graph = new joint.dia.Graph()
    var el = document.getElementById("graph")!
    var paper = new joint.dia.Paper({
        el: el,
        model: graph,
        width: el.clientWidth,
        height: el.clientHeight,
        gridSize: 1,
        interactive: false,
    })
    var isDragged = false
    var dragStartPosition = { x: 0, y: 0 }
    console.log(dragStartPosition)
    paper.on("blank:pointerdown", function (event: MouseEvent, x: number, y: number) {
        isDragged = true
        dragStartPosition = { x: x, y: y }
    })
    paper.on("cell:pointerup blank:pointerup", function (cellView: any, x: number, y: number) {
        isDragged = false
    })
    el.addEventListener("mousemove", function (event: MouseEvent) {
        if (isDragged)
            paper.translate(
                event.offsetX - dragStartPosition.x,
                event.offsetY - dragStartPosition.y,
            )
    })
    var x = 10
    var y = 10
    /** Loop over containers */
    for (const container of factory.containers) {
        /* Add container */
        var containerRect = new joint.shapes.standard.Rectangle({
            position: { x: x, y: y },
            size: { width: 50, height: 50 },
        })
        containerRect.attr({
            body: {
                fill: "white",
            },
            label: {
                text: container.item.name,
                fill: "blac",
            },
        })
        containerRect.addTo(graph)
        y += 60
        if (y > 600) {
            y = 10
            x += 60
        }
    }
}

/**
 * Hook for using a map as state.
 */
function useMap<Key, Value>() {
    const [map, setMap] = useState(new Map<Key, Value>())

    const setValue = (key: Key, value: Value) => {
        const newCounter = new Map(map)
        newCounter.set(key, value)
        setMap(newCounter)
    }

    return [map, setValue] as const
}
