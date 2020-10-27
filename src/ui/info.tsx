/**
 * ui/info.ts
 * React component for displaying application information
 * lgfrbcsgo & Nikolaus - October 2020
 */

import * as React from "react"
import { Button } from "antd"
import { AppState } from "./app"

/**
 * Properties of the Info component
 */
export interface InfoProps {
    /**
     * Set the parent application state
     * @param state the AppState
     */
    setAppState: (state: AppState) => void
}

/**
 * Info component
 * @param props {@link InfoProps}
 */
export function Info({ setAppState }: InfoProps) {
    return (
        <React.Fragment>
            <Button onClick={() => setAppState(AppState.HOME)}>Back</Button>
            Here is some information about the application.
        </React.Fragment>
    )
}
