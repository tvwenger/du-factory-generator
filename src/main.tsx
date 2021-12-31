import * as React from "react"
import * as ReactDOM from "react-dom"
import "antd/dist/antd.css"
import { App } from "./ui/app"
import CookieConsent from "react-cookie-consent"

const rootElement = document.getElementById("root")
const content = (
    <React.Fragment>
        <App />
        <CookieConsent>This website uses cookies to enhance the user experience.</CookieConsent>
    </React.Fragment>
)
ReactDOM.render(content, rootElement)
