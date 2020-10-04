import { determineComputationOrder } from "./computation-order"
import { findRecipe, Recipe } from "../recipes"
import { isOre, Item, Ore } from "../items"
import { ContainerNode, FactoryGraph, MachineNode } from "./graph"
import { simulate_annealing } from "./simulated-annealing"
import { Draft, produce } from "immer"

export function buildFactory(products: Map<Exclude<Item, Ore>, number>): FactoryGraph {
    const graph = initGraph(products)

    const computationOrder = determineComputationOrder(new Set(products.keys()))
    console.log(computationOrder)

    for (const item of computationOrder) {
        console.log(item)
        if (isOre(item)) {
            addInputContainers(graph, item)
        } else {
            addProducers(graph, item)
        }
    }

    return graph
}

function initGraph(products: Map<Exclude<Item, Ore>, number>): FactoryGraph {
    const graph = new FactoryGraph()

    for (const [item, machineCount] of products) {
        for (let i = 0; i < Math.ceil(machineCount); i++) {
            const recipe = findRecipe(item)

            const machine = new MachineNode(recipe, 1)
            graph.add(machine)

            const container = new ContainerNode()
            graph.add(container)
            machine.outputInto(container)
        }
    }

    return graph
}

function addInputContainers(graph: FactoryGraph, item: Ore): void {
    for (const consumer of graph.getConsumers(item)) {
        const container = new ContainerNode()
        graph.add(container)
        consumer.takeFrom(container, item)
    }
}

function addProducers(graph: FactoryGraph, item: Exclude<Item, Ore>): void {
    const recipe = findRecipe(item)
    const result = simulate_annealing(
        makeInitialStates(graph, item),
        mutateLinks(recipe),
        computeEnergy(recipe),
        15,
        0.001,
        (temp) => temp - 0.001,
    )

    for (const state of result) {
        if (state.futureConsumers.size === 0) {
            continue
        }

        graph.add(state.container)
        for (const consumer of state.futureConsumers) {
            consumer.takeFrom(state.container, item)
        }

        const ingress = state.container.getIngress(item)
        const egress = state.container.getEgress(item)
        const netIngress = ingress - egress

        const utilisation = Math.max(
            0,
            -netIngress / (recipe.product.quantity / recipe.processingTime),
        )

        const neededMachines = Math.ceil(utilisation)

        for (let i = 0; i < neededMachines; i++) {
            const machine = new MachineNode(recipe, utilisation / neededMachines)
            graph.add(machine)
            machine.outputInto(state.container)
        }
    }
}

interface OptimizerState {
    containerExistsAlready: boolean
    container: ContainerNode
    futureConsumers: Set<MachineNode>
}

function makeInitialStates(graph: FactoryGraph, item: Exclude<Item, Ore>): OptimizerState[] {
    const consumers = graph.getConsumers(item)
    const containers = graph.getContainers(item)

    const oldStates: OptimizerState[] = Array.from(containers).map((container) => ({
        containerExistsAlready: true,
        container,
        futureConsumers: new Set(),
    }))

    const newStates: OptimizerState[] = Array.from(consumers).map((consumer) => ({
        containerExistsAlready: false,
        container: new ContainerNode(),
        futureConsumers: new Set([consumer]),
    }))

    return [...oldStates, ...newStates]
}

function computeEnergy(recipe: Recipe) {
    const item = recipe.product.item
    const machineThroughput = recipe.product.quantity / recipe.processingTime

    return (states: OptimizerState[]): number => {
        let energy = 0
        for (const state of states) {
            if (state.futureConsumers.size > 0 && !state.containerExistsAlready) {
                energy++ // cost for additional container
            }

            const currentIngress = state.container.getIngress(item)
            const currentEgress = state.container.getEgress(item)
            const futureEgress = Array.from(state.futureConsumers)
                .map((node) => node.getIntake(item))
                .reduce((a, b) => a + b, 0)

            const netIngress = currentIngress - currentEgress - futureEgress
            const neededMachines = -netIngress / machineThroughput

            if (neededMachines > 0) {
                energy += Math.ceil(neededMachines) // cost for additional machines
            } else {
                energy += -neededMachines // cost for wasted machines
            }
        }
        return energy
    }
}

function mutateLinks(recipe: Recipe) {
    return produce((states: Draft<OptimizerState[]>) => {
        const consumer = removeRandomConsumer(states)
        if (consumer) {
            addToRandomContainer(states, consumer, recipe)
        }
    })
}

function removeRandomConsumer(states: OptimizerState[]): MachineNode | undefined {
    const possibleStates = states.filter(
        (containerState) => containerState.futureConsumers.size > 0,
    )

    const state = chooseRandom(possibleStates)
    if (!state) {
        return
    }

    const consumer = chooseRandom(Array.from(state.futureConsumers))!
    state.futureConsumers.delete(consumer)

    return consumer
}

function addToRandomContainer(states: OptimizerState[], consumer: MachineNode, recipe: Recipe) {
    const item = recipe.product.item
    const machineThroughput = recipe.product.quantity / recipe.processingTime

    const possibleStates = states.filter((containerState) => {
        const outgoingLinkCount =
            1 + containerState.container.outgoingLinkCount + containerState.futureConsumers.size

        const currentIngress = containerState.container.getIngress(item)
        const currentEgress = containerState.container.getEgress(item)
        const futureEgress =
            consumer.getIntake(item) +
            Array.from(containerState.futureConsumers)
                .map((node) => node.getIntake(item))
                .reduce((a, b) => a + b, 0)

        const netIngress = currentIngress - currentEgress - futureEgress
        const neededMachines = Math.ceil(Math.max(0, -netIngress / machineThroughput))

        const incomingLinkCount = containerState.container.incomingLinkCount + neededMachines

        return outgoingLinkCount <= 10 && incomingLinkCount <= 10
    })

    const state = chooseRandom(possibleStates)
    if (!state) {
        return
    }

    state.futureConsumers.add(consumer)
}

function chooseRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) {
        return undefined
    }
    return arr[Math.floor(Math.random() * arr.length)]
}
