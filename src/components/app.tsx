import * as React from "react"
import { Fragment, useMemo, useState } from "react"
import { Craftable, isCraftable, ITEMS } from "../items"
import { values } from "ramda"
import { ItemSelect } from "./item-select"
import { Button, Col, InputNumber, Row } from "antd"
import { buildFactory } from "../factory"

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
            <Button type="primary" onClick={() => console.log(buildFactory(getRequirements()))}>
                Generate
            </Button>
        </Fragment>
    )
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
