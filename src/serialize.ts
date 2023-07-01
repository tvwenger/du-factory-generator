import { Container, isContainer } from "./container"
import {
    FactoryGraph,
    FactoryNode,
    isProductionNode,
    ProductionNode,
    DumpRoute,
    RelayRoute,
} from "./graph"
import { Industry, isIndustry } from "./industry"
import { isOre, Item, ITEMS } from "./items"
import { isTransferContainer, TransferContainer } from "./transfer-container"
import { isTransferUnit, TransferUnit } from "./transfer-unit"

// Factory JSON version number
const VERSION = "5.0"

/**
 * Saved properties for each FactoryNode
 */
interface SaveFactoryNode {
    item: Item
    consumers: number[]
    outputRate: number
    maintainedOutput: number
    relayRouteContainers: number[]
    relayRouteTransferUnits: number[]
    dumpRouteRelays: number[][]
    dumpRouteContainers: number[]
    dumpRouteIndustries: number[][]
}

/**
 * Saved properties for each Container
 */
interface SaveContainer {
    id: string
    merged: boolean
    item: Item
    outputRate: number
    maintainedOutput: number
    maintain: number
    containers: string[]
    producerIndustries: number[]
    producerTransferUnits: number[]
    consumerIndustries: number[]
    consumerTransferUnits: number[]
}

/**
 * Saved properties for each TransferContainer
 */
interface SaveTransferContainer {
    id: string
    items: Item[]
    maintain: number[]
    containers: string[]
    producers: number[]
    consumers: number[]
}

/**
 * Saved properties for each Industry
 */
interface SaveIndustry {
    id: string
    industry: string
    item: Item
    inputContainers: number[]
    inputTransferContainers: number[]
    output: number
}

/**
 * Saved properties for each TransferUnit
 */
interface SaveTransferUnit {
    id: string
    merged: boolean
    item: Item
    inputs: number[]
    requiredTransferRate: number
    rates: number[]
    outputContainer: number | undefined
    outputTransferContainer: number | undefined
}

/**
 * Serialize a factory as a JSON string
 * @param factory the FactoryGraph to serialize
 */
export function serialize(factory: FactoryGraph): string {
    const factoryNodes = Array.from(factory.nodes.values())
    const factoryContainers = Array.from(factory.containers)
    const factoryIndustries = Array.from(factory.industries)
    const factoryTransferUnits = Array.from(factory.transferUnits)
    const factoryTransferContainers = Array.from(factory.transferContainers)

    const saveFactory = {
        version: VERSION,
        talentLevels: factory.talentLevels,
        nodes: [] as SaveFactoryNode[],
        containers: [] as SaveContainer[],
        transferContainers: [] as SaveTransferContainer[],
        industries: [] as SaveIndustry[],
        transferUnits: [] as SaveTransferUnit[],
    }

    /**
     * Save Containers by replacing cyclic references with indicies
     */
    for (const container of factoryContainers) {
        const saveContainer: SaveContainer = {
            id: container.id,
            merged: container.merged,
            item: container.item,
            outputRate: container.outputRate,
            maintainedOutput: container.maintainedOutput,
            maintain: container.maintain,
            containers: container.containers,
            producerIndustries: Array.from(container.producers)
                .filter(isIndustry)
                .map((node) => factoryIndustries.indexOf(node))
                .sort(),
            producerTransferUnits: Array.from(container.producers)
                .filter(isTransferUnit)
                .map((node) => factoryTransferUnits.indexOf(node))
                .sort(),
            consumerIndustries: Array.from(container.consumers)
                .filter(isIndustry)
                .map((node) => factoryIndustries.indexOf(node))
                .sort(),
            consumerTransferUnits: Array.from(container.consumers)
                .filter(isTransferUnit)
                .map((node) => factoryTransferUnits.indexOf(node))
                .sort(),
        }
        saveFactory.containers.push(saveContainer)
    }

    /**
     * Save Industries by replacing cyclic references with indicies
     */
    for (const industry of factoryIndustries) {
        const saveIndustry: SaveIndustry = {
            id: industry.id,
            item: industry.item,
            industry: industry.recipe.industry,
            inputContainers: Array.from(industry.inputs)
                .filter(isContainer)
                .map((node) => factoryContainers.indexOf(node))
                .sort(),
            inputTransferContainers: Array.from(industry.inputs)
                .filter(isTransferContainer)
                .map((node) => factoryTransferContainers.indexOf(node))
                .sort(),
            output: factoryContainers.indexOf(industry.output),
        }
        saveFactory.industries.push(saveIndustry)
    }

    /**
     * Save TransferUnits by replacing cyclic references with indicies
     */
    for (const transferUnit of factoryTransferUnits) {
        const saveTransferUnit: SaveTransferUnit = {
            id: transferUnit.id,
            merged: transferUnit.merged,
            item: transferUnit.item,
            inputs: Array.from(transferUnit.inputs).map((node) => factoryContainers.indexOf(node)),
            requiredTransferRate: transferUnit.requiredTransferRate,
            rates: Array.from(transferUnit.inputs).map(
                (input) => transferUnit.transferRates.get(input)!,
            ),
            outputContainer: isContainer(transferUnit.output)
                ? factoryContainers.indexOf(transferUnit.output)
                : undefined,
            outputTransferContainer: isTransferContainer(transferUnit.output)
                ? factoryTransferContainers.indexOf(transferUnit.output)
                : undefined,
        }
        saveFactory.transferUnits.push(saveTransferUnit)
    }

    /**
     * Save TransferContainers by replacing cyclic references with indicies
     */
    for (const transferContainer of factoryTransferContainers) {
        const items: Item[] = []
        const maintain: number[] = []
        for (const item of transferContainer.items) {
            items.push(item)
            maintain.push(transferContainer.maintain(item))
        }
        const saveTransferContainer: SaveTransferContainer = {
            id: transferContainer.id,
            items: items,
            maintain: maintain,
            containers: transferContainer.containers,
            producers: Array.from(transferContainer.producers)
                .map((node) => factoryTransferUnits.indexOf(node))
                .sort(),
            consumers: Array.from(transferContainer.consumers)
                .map((node) => factoryIndustries.indexOf(node))
                .sort(),
        }
        saveFactory.transferContainers.push(saveTransferContainer)
    }

    /**
     * Save FactoryNodes by replacing cyclic references with indicies
     */
    for (const node of factoryNodes) {
        const saveRelayContainers: number[] = []
        const saveRelayTransferUnits: number[] = []
        for (const relayRoute of node.getRelayRoutes()) {
            saveRelayContainers.push(factoryContainers.indexOf(relayRoute.container))
            saveRelayTransferUnits.push(factoryTransferUnits.indexOf(relayRoute.transferUnit))
        }

        const saveDumpRelays: number[][] = []
        const saveDumpContainers: number[] = []
        const saveDumpIndustries: number[][] = []
        if (isProductionNode(node)) {
            for (const dumpRoute of node.getDumpRoutes()) {
                saveDumpRelays.push(
                    dumpRoute.relayRoutes.map((relayRoute) =>
                        node.getRelayRoutes().indexOf(relayRoute),
                    ),
                )
                saveDumpContainers.push(factoryContainers.indexOf(dumpRoute.container))
                saveDumpIndustries.push(
                    dumpRoute.industries.map((industry) => factoryIndustries.indexOf(industry)),
                )
            }
        }

        const saveFactoryNode: SaveFactoryNode = {
            item: node.item,
            consumers: Array.from(node.consumers)
                .map((consumer) => factoryNodes.indexOf(consumer))
                .sort(),
            outputRate: node.outputRate,
            maintainedOutput: node.maintainedOutput,
            relayRouteContainers: saveRelayContainers,
            relayRouteTransferUnits: saveRelayTransferUnits,
            dumpRouteRelays: saveDumpRelays,
            dumpRouteContainers: saveDumpContainers,
            dumpRouteIndustries: saveDumpIndustries,
        }
        saveFactory.nodes.push(saveFactoryNode)
    }

    return JSON.stringify(saveFactory, null, 4)
}

/**
 * De-serialize a JSON string representation of a FactoryGraph
 * @param serializedFactory the serialized FactoryGraph
 */
export function deserialize(
    serializedFactory: string,
    talentLevels: { [key: string]: number },
): FactoryGraph {
    const saveFactory = JSON.parse(serializedFactory)
    if (saveFactory.version !== VERSION) {
        throw new Error("Invalid JSON version: " + saveFactory.version + ". Expected: " + VERSION)
    }
    // ensure that the talents used to generate the loaded factory
    // are no better than the current user's talents
    for (const [talent, level] of Object.entries(saveFactory.talentLevels)) {
        if (talentLevels[talent] === undefined || talentLevels[talent] < (level as number)) {
            throw new Error(
                "Your talent levels must match or exceed the talent levels used to generate the original factory.",
            )
        }
    }
    const factory = new FactoryGraph(talentLevels)

    const factoryContainers: Container[] = []
    const factoryTransferContainers: TransferContainer[] = []
    const factoryIndustries: Industry[] = []
    const factoryTransferUnits: TransferUnit[] = []
    const factoryNodes: FactoryNode[] = []

    // Unpack Containers
    for (const saveContainer of saveFactory.containers) {
        const item = ITEMS[saveContainer.item.name as keyof typeof ITEMS]
        const container = factory.createRelayContainer(item, saveContainer.id)
        container.merged = saveContainer.merged
        container.outputRate = saveContainer.outputRate
        container.maintainedOutput = saveContainer.maintainedOutput
        factoryContainers.push(container)
    }

    // Unpack TransferContainers
    for (const saveTransferContainer of saveFactory.transferContainers) {
        const items = saveTransferContainer.items.map(
            (item: Item) => ITEMS[item.name as keyof typeof ITEMS],
        )
        const transferContainer = factory.createTransferContainer(items, saveTransferContainer.id)
        factoryTransferContainers.push(transferContainer)
    }

    // Unpack Industries
    for (const saveIndustry of saveFactory.industries) {
        const item = ITEMS[saveIndustry.item.name as keyof typeof ITEMS]
        const industry = factory.createIndustry(
            item,
            factoryContainers[saveIndustry.output],
            saveIndustry.id,
        )

        // Add links
        for (const input of saveIndustry.inputContainers) {
            industry.addInput(factoryContainers[input])
        }
        for (const input of saveIndustry.inputTransferContainers) {
            industry.addInput(factoryTransferContainers[input])
        }

        factoryIndustries.push(industry)
    }

    // Unpack TransferUnits
    for (const saveTransferUnit of saveFactory.transferUnits) {
        const item = ITEMS[saveTransferUnit.item.name as keyof typeof ITEMS]
        let output: Container | TransferContainer =
            factoryContainers[saveTransferUnit.outputContainer]
        if (output === undefined) {
            output = factoryTransferContainers[saveTransferUnit.outputTransferContainer]
        }
        const transferUnit = factory.createTransferUnit(item, output, saveTransferUnit.id)
        transferUnit.merged = saveTransferUnit.merged
        transferUnit.requiredTransferRate = saveTransferUnit.requiredTransferRate

        // Add inputs and rates
        for (let i = 0; i < saveTransferUnit.inputs.length; i++) {
            transferUnit.addInput(factoryContainers[saveTransferUnit.inputs[i]])
            transferUnit.increaseTransferRate(
                factoryContainers[saveTransferUnit.inputs[i]],
                saveTransferUnit.rates[i],
            )
        }

        factoryTransferUnits.push(transferUnit)
    }

    // set changed=false for all loaded factory nodes
    for (const node of factory.containers) {
        node.changed = false
    }
    for (const node of factory.industries) {
        node.changed = false
    }
    for (const node of factory.transferUnits) {
        node.changed = false
    }
    for (const node of factory.transferContainers) {
        node.changed = false
    }

    // Add FactoryNodes
    for (const saveNode of saveFactory.nodes) {
        const item = ITEMS[saveNode.item.name as keyof typeof ITEMS]
        let node: FactoryNode
        if (isOre(item)) {
            node = factory.createOreNode(item)
        } else {
            node = factory.createProductionNode(item)
        }
        node.outputRate = saveNode.outputRate
        node.maintainedOutput = saveNode.maintainedOutput

        for (let i = 0; i < saveNode.relayRouteContainers.length; i++) {
            const relayRoute: RelayRoute = {
                container: factoryContainers[saveNode.relayRouteContainers[i]],
                transferUnit: factoryTransferUnits[saveNode.relayRouteTransferUnits[i]],
            }
            node.relayRoutes.push(relayRoute)
        }

        if (isProductionNode(node)) {
            for (let i = 0; i < saveNode.dumpRouteContainers.length; i++) {
                const dumpRoute: DumpRoute = {
                    relayRoutes: saveNode.dumpRouteRelays[i].map(
                        (idx: number) => node.relayRoutes[idx],
                    ),
                    container: factoryContainers[saveNode.dumpRouteContainers[i]],
                    industries: saveNode.dumpRouteIndustries[i].map(
                        (idx: number) => factoryIndustries[idx],
                    ),
                }
                node.dumpRoutes.push(dumpRoute)
            }
        }
        factoryNodes.push(node)
    }

    // Link nodes
    for (const [i, saveNode] of saveFactory.nodes.entries()) {
        for (const consumer of saveNode.consumers) {
            factoryNodes[i].addConsumer(factoryNodes[consumer] as ProductionNode)
        }
    }

    return factory
}
