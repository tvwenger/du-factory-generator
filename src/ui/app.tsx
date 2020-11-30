import * as React from "react"
import { Button } from "antd"
import { Info } from "./info"
import { Factory, FactoryState } from "./factory"

export enum AppState {
    HOME = "home",
    INFO = "info",
    NEWFACTORY = "newFactory",
    OLDFACTORY = "oldFactory",
}

/**
 * Main application component
 */
export function App() {
    const [appState, setAppState] = React.useState<AppState>(AppState.HOME)

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
        case AppState.NEWFACTORY:
            content = <Factory setAppState={setAppState} startFactoryState={FactoryState.SELECT} />
            break
        case AppState.OLDFACTORY:
            content = <Factory setAppState={setAppState} startFactoryState={FactoryState.UPLOAD} />
            break
    }

    return content
}

/**
 * Hook for using a map as state.
 */
export function useMap<Key, Value>() {
    const [map, setMap] = React.useState(new Map<Key, Value>())
    const setValue = (key: Key, value: Value) => {
        const newCounter = new Map(map)
        newCounter.set(key, value)
        setMap(newCounter)
    }
    return [map, setValue, setMap] as const
}
