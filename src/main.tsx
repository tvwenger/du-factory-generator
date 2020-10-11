import { items } from "./items"
import { buildFactory } from "./compute/factory"
import { enableMapSet } from "immer"
import * as React from "react"
import { Fragment } from "react"
import * as ReactDOM from "react-dom"
import { ContainerNode, MachineNode } from "./compute/graph"

enableMapSet()

class IdGenerator<T> {
    private idCache = new Map<T, number>()

    getId(entity: T): number {
        if (!this.idCache.has(entity)) {
            this.idCache.set(entity, this.idCache.size + 1)
        }
        return this.idCache.get(entity)!
    }
}

interface ContainerProps {
    container: ContainerNode
    idGenerator: IdGenerator<ContainerNode>
}

function Container(props: ContainerProps) {
    const content = Array.from(props.container.items.values()).map((item) => <p>{item.name}</p>)
    return (
        <Fragment>
            <h4>Container {props.idGenerator.getId(props.container)}</h4>
            {content}
        </Fragment>
    )
}

interface MachineProps {
    machine: MachineNode
    machineIdGenerator: IdGenerator<MachineNode>
    containerIdGenerator: IdGenerator<ContainerNode>
}

function Machine(props: MachineProps) {
    return (
        <Fragment>
            <h2>
                Machine {props.machineIdGenerator.getId(props.machine)}:{" "}
                {props.machine.recipe.product.item.name}
            </h2>
            <h3>Inputs</h3>
            {Array.from(props.machine.inputs.values()).map((container) => (
                <Container container={container} idGenerator={props.containerIdGenerator} />
            ))}
            <h3>Output</h3>
            <Container container={props.machine.output!} idGenerator={props.containerIdGenerator} />
        </Fragment>
    )
}

function App() {
    const assemblyMachines = new Map([
        [items.adjuster_l, 2],
        [items.vertical_booster_l, 2],
        [items.retro_rocket_brake_l, 2],
    ])
    const factory = buildFactory(assemblyMachines)
    const machineIdGenerator = new IdGenerator<MachineNode>()
    const containerIdGenerator = new IdGenerator<ContainerNode>()

    return (
        <Fragment>
            <h1>Factory Generator</h1>
            {Array.from(factory.machines).map((machine) => (
                <Machine
                    machine={machine}
                    containerIdGenerator={containerIdGenerator}
                    machineIdGenerator={machineIdGenerator}
                />
            ))}
        </Fragment>
    )
}

const rootElement = document.getElementById("root")
ReactDOM.render(<App />, rootElement)
