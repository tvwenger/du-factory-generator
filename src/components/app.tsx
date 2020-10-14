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

    const [counter, setCount] = useMap<Craftable, number>()

    const getCount = (item: Craftable) => counter.get(item) || 1

    const getRequirements = () => new Map(selection.map((item) => [item, getCount(item)]))

    return (
        <Fragment>
            <ItemSelect items={items} value={selection} onChange={setSelection} />
            <Row>
                {selection.map((item) => (
                    <Col span={6} key={item.name}>
                        <label>{item.name}</label>
                        <InputNumber
                            min={1}
                            value={getCount(item)}
                            onChange={(value) => setCount(item, Number(value))}
                        />
                    </Col>
                ))}
            </Row>
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
