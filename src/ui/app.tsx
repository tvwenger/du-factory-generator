import * as React from "react"
import { Button } from "antd"
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

    // Scroll to top on render
    React.useEffect(() => {
        window.scrollTo(0, 0)
    })

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
                    <ul>
                        <li>Start a New Factory: Set up a new factory from scratch</li>
                        <li>
                            Start From Existing Factory: Start from a factory previously generated
                            by this tool
                        </li>
                    </ul>
                    <Button onClick={() => setAppState(AppState.SETTALENTS)}>
                        {talentState === TalentState.SET ? "Update Talents" : "Set Talents"}
                    </Button>
                    {talentState === TalentState.SET
                        ? "Talents are set"
                        : "Talents have not been set"}
                    <br />
                    <br />
                    <Button onClick={() => setAppState(AppState.SETOREPRICES)}>
                        {orePricesState === OrePricesState.SET
                            ? "Update Ore Prices"
                            : "Set Ore Prices"}
                    </Button>
                    {orePricesState === OrePricesState.SET
                        ? "Ore prices are set"
                        : "Ore prices have not been set"}
                    <br />
                    <br />
                    <Button type="primary" onClick={() => setAppState(AppState.NEWFACTORY)}>
                        Start a New Factory
                    </Button>
                    <Button onClick={() => setAppState(AppState.OLDFACTORY)}>
                        Start from Existing Factory
                    </Button>
                    <Button onClick={() => setAppState(AppState.INFO)}>Help Information</Button>
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
                    startFactoryState={FactoryState.TALENTS}
                />
            )
            break
        case AppState.OLDFACTORY:
            content = (
                <Factory
                    setAppState={setAppState}
                    talentLevels={talentLevels}
                    startFactoryState={FactoryState.UPLOAD}
                />
            )
            break
    }

    return content
}
