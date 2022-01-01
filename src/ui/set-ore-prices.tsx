import * as React from "react"
import { Button, Row, Col, InputNumber, Upload } from "antd"
import { ITEMS, isOre } from "../items"
import { AppState, OrePricesState } from "./app"

/**
 * Parse JSON and set ore prices
 */
export function parseOrePricesJSON(
    json: string,
    setOrePrices: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
) {
    const data = JSON.parse(json) as { [key: string]: number }
    for (const [item, price] of Object.entries(data)) {
        setOrePrices((prevState: { [key: string]: number }) => ({
            ...prevState,
            [item]: price,
        }))
    }
}

/**
 * Properties of the SetOrePrices component
 */
interface SetOrePricesProps {
    /**
     * Set the parent NewFactory state
     * @param state parent component state
     */
    setAppState: (state: AppState) => void

    // ore prices
    orePrices: { [key: string]: number }

    /**
     * Set the price for a given ore
     */
    setOrePrices: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>

    /**
     * Set the OrePricesState
     */
    setOrePricesState: (state: OrePricesState) => void
}

/**
 * Set ore prices
 * @param props {@link SetOrePricesProps}
 */
export function SetOrePrices(props: SetOrePricesProps) {
    // Scroll to top on render
    React.useEffect(() => {
        window.scrollTo(0, 0)
    })

    return (
        <React.Fragment>
            <h2>Set ore prices:</h2>
            <ul>
                <li>Ore prices are stored as a cookie in your browser.</li>
                <li>At the bottom of this page, you can download the ore prices as a JSON file.</li>
                <li>You may upload a JSON file that was previously exported from this page.</li>
            </ul>
            <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={(file) => {
                    const reader = new FileReader()
                    reader.onload = () => {
                        const result = reader.result as string
                        parseOrePricesJSON(result, props.setOrePrices)
                    }
                    reader.readAsText(file)
                    // skip upload
                    return false
                }}
            >
                <Button>Upload OrePrices JSON</Button>
            </Upload>
            <Row>
                <Col span={6}>Ore</Col>
                <Col span={3}>Price</Col>
            </Row>
            {Object.values(ITEMS)
                .filter(isOre)
                .map(function (item) {
                    // handle update of ore price
                    const setOrePrices = (value: number) => {
                        props.setOrePrices((prevState: { [key: string]: number }) => ({
                            ...prevState,
                            [item.name]: value,
                        }))
                    }
                    return (
                        <React.Fragment key={item.name}>
                            <MemorizedSetOrePricesRow
                                setOrePrices={setOrePrices}
                                item={item.name}
                                value={props.orePrices[item.name] || 0}
                            />
                        </React.Fragment>
                    )
                })}
            <Button
                type="primary"
                onClick={() => {
                    // save as cookie that expires in 365 days
                    const date = new Date()
                    date.setTime(date.getTime() + 365 * 24 * 3600000)
                    document.cookie =
                        "orePrices=" +
                        JSON.stringify(props.orePrices) +
                        "; expires=" +
                        date.toUTCString() +
                        "; path=/; SameSite=Lax"
                    props.setOrePricesState(OrePricesState.SET)
                    props.setAppState(AppState.HOME)
                }}
            >
                Confirm
            </Button>
            <Button
                href={`data:text/json;charset=utf-8,${encodeURIComponent(
                    JSON.stringify(props.orePrices),
                )}`}
                download="orePrices.json"
            >
                Download Ore Prices as JSON
            </Button>
        </React.Fragment>
    )
}

/**
 * Properties of the SetOrePricesRow
 */
interface SetOrePricesRowProps {
    setOrePrices: (value: number) => void
    item: string
    value: number
}

/**
 * Single row of the ore prices table
 */
function SetOrePricesRow(props: SetOrePricesRowProps) {
    return (
        <Row>
            <Col span={6}>
                <label>{props.item}</label>
            </Col>
            <Col span={3}>
                <InputNumber
                    min={0}
                    value={props.value}
                    onChange={(value: string | number | undefined) =>
                        props.setOrePrices(Number(value))
                    }
                />
            </Col>
        </Row>
    )
}
function sameRow(oldProps: SetOrePricesRowProps, newProps: SetOrePricesRowProps) {
    return oldProps.value === newProps.value
}
const MemorizedSetOrePricesRow = React.memo(SetOrePricesRow, sameRow)
