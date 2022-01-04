import * as React from "react"
import { Button, Row, Col, InputNumber, Upload, Divider, Space } from "antd"
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
    const [uploaded, setUploaded] = React.useState<boolean>(false)

    return (
        <React.Fragment>
            <h2>Set Ore Prices</h2>
            <Divider orientation="left">Instructions</Divider>
            <ul>
                <li>Ore prices are stored as a cookie in your browser.</li>
                <li>At the bottom of this page, you can download the ore prices as a JSON file.</li>
                <li>You may upload a JSON file that was previously exported from this page.</li>
            </ul>
            <Divider orientation="left">Upload</Divider>
            <Space>
                <Upload
                    accept=".json"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        const reader = new FileReader()
                        reader.onload = () => {
                            const result = reader.result as string
                            parseOrePricesJSON(result, props.setOrePrices)
                            setUploaded(true)
                        }
                        reader.readAsText(file)
                        // skip upload
                        return false
                    }}
                >
                    <Button>Upload Ore Prices JSON</Button>
                </Upload>
                {uploaded && "Upload successful!"}
            </Space>
            <Divider orientation="left">Update Ore Prices</Divider>
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
            <br />
            <Space>
                <Button
                    type="primary"
                    onClick={() => {
                        // save to localStorage
                        localStorage.setItem("orePrices", JSON.stringify(props.orePrices))
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
            </Space>
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
            <Col span={2}>
                <label>{props.item}</label>
            </Col>
            <Col span={2}>
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
