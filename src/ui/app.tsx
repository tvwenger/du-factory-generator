import * as React from "react"
import { Button, Space, Row, Col, Divider } from "antd"
import { Info } from "./info"
import { Factory, FactoryState } from "./factory"
import { SetTalents, parseTalentLevelJSON } from "./set-talents"
import { SetOrePrices, parseOrePricesJSON } from "./set-ore-prices"

export enum AppState {
    HOME = "home",
    INFO = "info",
    SETTALENTS = "setTalents",
    SETOREPRICES = "setOrePrices",
    NEWFACTORY = "newFactory",
    OLDFACTORY = "oldFactory",
}

export enum TalentState {
    UNSET = "unset",
    SET = "set",
}

export enum OrePricesState {
    UNSET = "unset",
    SET = "set",
}

/**
 * Main application component
 */
export function App() {
    const [appState, setAppState] = React.useState<AppState>(AppState.HOME)
    const [talentState, setTalentState] = React.useState<TalentState>(TalentState.UNSET)
    const [talentLevels, setTalentLevels] = React.useState<{ [key: string]: number }>({})
    const [orePricesState, setOrePricesState] = React.useState<OrePricesState>(OrePricesState.UNSET)
    const [orePrices, setOrePrices] = React.useState<{ [key: string]: number }>({})

    // Parse talentLevel cookie JSON if present
    if (talentState === TalentState.UNSET) {
        const parts = document.cookie.split("talentLevels=")
        if (parts.length == 2) {
            const json = parts[1].split(";")[0]
            parseTalentLevelJSON(json, setTalentLevels)
            setTalentState(TalentState.SET)
        }
    }

    // Parse orePrices cookie JSON if present
    if (orePricesState === OrePricesState.UNSET) {
        const parts = document.cookie.split("orePrices=")
        if (parts.length == 2) {
            const json = parts[1].split(";")[0]
            parseOrePricesJSON(json, setOrePrices)
            setOrePricesState(OrePricesState.SET)
        }
    }

    let content = null
    switch (appState) {
        default:
            content = (
                <React.Fragment>
                    <h2>Welcome to the DU Factory Generator!</h2>
                    <Divider orientation="left">Instructions</Divider>
                    <ul>
                        <li>Set or update talents as necessary.</li>
                        <li>
                            Optional: set ore prices to calculate "ore values" of produced items.
                        </li>
                        <li>Start a New Factory: Set up a new factory from scratch.</li>
                        <li>
                            Start From Existing Factory: Start from a factory previously generated
                            by this tool.
                        </li>
                    </ul>
                    <Divider orientation="left">Preparation</Divider>
                    <Row style={{ marginBottom: 5 }}>
                        <Col span={3}>
                            <Button onClick={() => setAppState(AppState.SETTALENTS)}>
                                {talentState === TalentState.SET ? "Update Talents" : "Set Talents"}
                            </Button>
                        </Col>
                        <Col span={3}>
                            {talentState === TalentState.SET
                                ? "Talents are set"
                                : "Talents have not been set"}
                        </Col>
                    </Row>
                    <Row>
                        <Col span={3}>
                            <Button onClick={() => setAppState(AppState.SETOREPRICES)}>
                                {orePricesState === OrePricesState.SET
                                    ? "Update Ore Prices"
                                    : "Set Ore Prices"}
                            </Button>
                        </Col>
                        <Col span={3}>
                            {orePricesState === OrePricesState.SET
                                ? "Ore prices are set"
                                : "Ore prices have not been set"}
                        </Col>
                    </Row>
                    <Divider orientation="left">Generate Factory</Divider>
                    <Space>
                        <Button type="primary" onClick={() => setAppState(AppState.NEWFACTORY)}>
                            Start a New Factory
                        </Button>
                        <Button onClick={() => setAppState(AppState.OLDFACTORY)}>
                            Start from Existing Factory
                        </Button>
                        <Button onClick={() => setAppState(AppState.INFO)}>Help Information</Button>
                    </Space>
                </React.Fragment>
            )
            break
        case AppState.INFO:
            content = <Info setAppState={setAppState} />
            break
        case AppState.SETTALENTS:
            content = (
                <SetTalents
                    setAppState={setAppState}
                    talentLevels={talentLevels}
                    setTalentLevels={setTalentLevels}
                    setTalentState={setTalentState}
                />
            )
            break
        case AppState.SETOREPRICES:
            content = (
                <SetOrePrices
                    setAppState={setAppState}
                    orePrices={orePrices}
                    setOrePrices={setOrePrices}
                    setOrePricesState={setOrePricesState}
                />
            )
            break
        case AppState.NEWFACTORY:
            content = (
                <Factory
                    setAppState={setAppState}
                    talentLevels={talentLevels}
                    orePrices={orePrices}
                    startFactoryState={FactoryState.TALENTS}
                />
            )
            break
        case AppState.OLDFACTORY:
            content = (
                <Factory
                    setAppState={setAppState}
                    talentLevels={talentLevels}
                    orePrices={orePrices}
                    startFactoryState={FactoryState.UPLOAD}
                />
            )
            break
    }

    return content
}
