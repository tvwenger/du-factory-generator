import * as React from "react"
import { Button } from "antd"
import { AppState } from "./app"
const example = require("../assets/example.png")

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
            <br />
            <h2>About</h2>
            This is a factory generator for&nbsp;
            <a href="https://www.dualuniverse.game/">Dual Universe</a>. Given a set of items to
            build, this tool will determine a factory plan from raw ores to the final products. If
            you encouter any problems or would like to request new features, please submit an{" "}
            <a href="https://github.com/lgfrbcsgo/du-factory-generator/issues">issue on Github</a>,
            or <a href="https://discord.gg/gXSWKqVnHx">join our Discord server</a> and look for
            Nikolaus.
            <h2>Instructions: Starting a new factory</h2>
            <ul>
                <li>Click "Start a New Factory."</li>
                <li>
                    Select all items that you would like to produce in the factory, then click
                    "Next"
                </li>
                <li>
                    Enter the requested production rate of each item, as well as the quantity you
                    would like to maintain in the output container(s), then click "Next"
                </li>
                <li>
                    Wait while your factory plan is generated. This can take a while (up to a few
                    minutes) for large factories. Once complete, you will see a list of the required
                    industries, containers, and schematics for your factory.
                </li>
                <li>
                    Click "Factory Map" to see an interactive schematic of the entire factory, which
                    you can download in PNG format (low-resolution) or SVG format (high-resolution).
                </li>
                <li>
                    Click "Building Instructions" to see a step-by-step plan to build the factory.
                </li>
                <li>
                    Click "Download Factory as JSON" to save the factory to a file, which you can
                    then use as a starting point for future additions to the factory.
                </li>
            </ul>
            <b>Note:</b> You can also select the factory production list using a comma separated
            values (CSV) file. Create a plain text file formatted like:
            <pre>Item Name, Number Produced per Day, Maintain Value</pre>. For example:
            <pre>
                Container S, 10, 50
                <br />
                Container M, 10, 50
                <br />
                Container L, 2, 10
            </pre>
            <a href="https://raw.githubusercontent.com/lgfrbcsgo/du-factory-generator/master/item_list.csv">
                Here is a link
            </a>
            &nbsp;to a blank CSV file with all available item names.
            <h2>Instructions: Starting from an existing factory</h2>
            <ul>
                <li>Click "Start From Existing Factory."</li>
                <li>Upload the factory JSON file.</li>
                <li>
                    You will be shown the current outputs of the factory. Select new items that you
                    would like to produce in the factory, and add existing items if you would like
                    to produce more of them, then click "Next"
                </li>
                <li>
                    Enter the requested production rate, as well as the additional quantity you
                    would like to maintain in the output container(s), then click "Next"
                </li>
                <li>Visualize and save the factory as before</li>
            </ul>
            <h2>Factory Instruction Example</h2>
            <img src={example.default} width="600px" />
            <ul>
                <li>
                    The text above each row shows the produced item type (e.g., "Uncommon LED").
                </li>
                <li>
                    The leftmost arrows show the incoming links to the industries. Each link is
                    named by the container contents (e.g., Hydrogen) and the identifier (e.g., "C0")
                </li>
                <li>
                    The circles are industries, the diamonds are transfer units, and the text inside
                    indicates the industry type (i.e., "Che" for "Chemical Industry M"). Multiple
                    industries can output to a single container. The text above the circle (e.g.,
                    "P0") is the identifier for the industry or transfer unit.
                </li>
                <li>
                    The green text above the arrow (e.g., "25/min") is the production rate of all
                    industries and the output rate of all transfer units outputing to the container.
                </li>
                <li>
                    The squares show the containers, and the text inside indicates the required
                    container size (i.e., "L" for "Container L"). Some outputs may require multiple
                    containers connected via a Container Hub (e.g., "XL+M" requires a "Container XL"
                    and "Container M" connected via a "Container Hub"). The text above the square
                    (e.g., D0) is the indentifier for the container. The text below the square is
                    the required maintain value.
                </li>
                <li>
                    The red text above the arrow (e.g., "12/day") is the consumption rate of all
                    industries or transfer units consuming from the container.
                </li>
                <li>
                    The rightmost arrows show the consumers from the container. Each link is named
                    by the produced item (e.g., "Aluminium") and the identifier (e.g., "P0").
                </li>
                <li>
                    <b>Dashed Arrows and Labels:</b> Dashed arrows indicate byproducts that are
                    transfered out via the labeled transfer units.
                </li>
                <li>
                    <b>Blue Boxes and Text:</b> A blue border around a container represents a
                    factory "output". This is an item that you requested your factory to produce.
                </li>
                <li>
                    <b>Filled Circles and Boxes:</b> When you start from an existing factory, some
                    industries, transfer units, and containers will be filled. This is to highlight
                    new entities or entities that have been changed from the existing factory. No
                    existing links are removed, but there may be new industries, new links, a
                    different maintain amount, or a different container size.
                </li>
                <li>
                    <b>Transfer Containers:</b> Some recipes require more than seven ingredients
                    (the industry incoming link limit). In this case, there will be a transfer
                    container that holds more than one item type and is fed by transfer units. The
                    maintain value for each item is shown to the bottom-right of each transfer unit.
                </li>
            </ul>
        </React.Fragment>
    )
}
