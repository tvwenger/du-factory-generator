/**
 * serialize.ts
 * Serialize and unserialize a factory object
 * lgfrbcsgo & Nikolaus - October 2020
 */

import {
    ContainerNode,
    TransferContainerNode,
    FactoryGraph,
    isContainerNode,
    isOutputNode,
    isIndustryNode,
    isTransferNode,
    isTransferContainerNode,
} from "./graph"
import { Craftable, Item, ITEMS } from "./items"

/**
 * Saved properties for each ContainerNode
 */
interface SaveContainerNode {
    id: string
    item: Item
    split: number
    outputRate: number | undefined
    maintainedOutput: number | undefined
    maintain: number
    containers: Item[]
    producerIndustries: number[]
    producerTransferUnits: number[]
    consumerIndustries: number[]
    consumerTransferUnits: number[]
}

/**
 * Saved properties for each IndustryNode
 */
interface SaveIndustryNode {
    id: string
    item: Item
    inputContainers: number[]
    inputTransferContainers: number[]
    output: number | undefined
}

/**
 * Saved properties for each TransferNode
 */
interface SaveTransferNode {
    id: string
    item: Item
    inputs: number[]
    rates: (number | undefined)[]
    outputContainerNode: number | undefined
    outputTransferContainerNode: number | undefined
}

/**
 * Saved properties for each TransferContainerNode
 */
interface SaveTransferContainerNode {
    id: string
    items: Item[]
    maintain: number[]
    containers: Item[]
    producers: number[]
    consumers: number[]
}

/**
 * Serialize a factory as a JSON string
 * @param factory the FactoryGraph to serialize
 */
export function serialize(factory: FactoryGraph): string {
    const factoryContainers = Array.from(factory.containers)
    const factoryIndustries = Array.from(factory.industries)
    const factoryTransferUnits = Array.from(factory.transferUnits)
    const factoryTransferContainers = Array.from(factory.transferContainers)

    const saveFactory = {
        containers: [] as SaveContainerNode[],
        industries: [] as SaveIndustryNode[],
        transferUnits: [] as SaveTransferNode[],
        transferContainers: [] as SaveTransferContainerNode[],
    }

    /**
     * Save ContainerNodes by replacing cyclic references with indicies
     */
    for (const container of factoryContainers) {
        const saveContainer: SaveContainerNode = {
            id: container.id,
            item: container.item,
            split: container.split,
            outputRate: isOutputNode(container) ? container.outputRate : undefined,
            maintainedOutput: isOutputNode(container) ? container.maintainedOutput : undefined,
            maintain: container.maintain,
            containers: container.containers,
            producerIndustries: Array.from(container.producers)
                .filter(isIndustryNode)
                .map((node) => factoryIndustries.indexOf(node))
                .sort(),
            producerTransferUnits: Array.from(container.producers)
                .filter(isTransferNode)
                .map((node) => factoryTransferUnits.indexOf(node))
                .sort(),
            consumerIndustries: Array.from(container.consumers)
                .filter(isIndustryNode)
                .map((node) => factoryIndustries.indexOf(node))
                .sort(),
            consumerTransferUnits: Array.from(container.consumers)
                .filter(isTransferNode)
                .map((node) => factoryTransferUnits.indexOf(node))
                .sort(),
        }
        saveFactory.containers.push(saveContainer)
    }

    /**
     * Save IndustryNodes by replacing cyclic references with indicies
     */
    for (const industry of factoryIndustries) {
        const saveIndustry: SaveIndustryNode = {
            id: industry.id,
            item: industry.item,
            inputContainers: Array.from(industry.inputs)
                .filter(isContainerNode)
                .map((node) => factoryContainers.indexOf(node))
                .sort(),
            inputTransferContainers: Array.from(industry.inputs)
                .filter(isTransferContainerNode)
                .map((node) => factoryTransferContainers.indexOf(node))
                .sort(),
            output:
                industry.output !== undefined
                    ? factoryContainers.indexOf(industry.output)
                    : undefined,
        }
        saveFactory.industries.push(saveIndustry)
    }

    /**
     * Save TransferNodes by replacing cyclic references with indicies
     */
    for (const transferUnit of factoryTransferUnits) {
        const inputs = Array.from(transferUnit.inputs)
            .map((node) => factoryContainers.indexOf(node))
            .sort()
        const rates = inputs.map((input) => transferUnit.rates.get(factoryContainers[input]))
        const saveTransferUnit: SaveTransferNode = {
            id: transferUnit.id,
            item: transferUnit.item,
            inputs: inputs,
            rates: rates,
            outputContainerNode:
                transferUnit.output !== undefined && isContainerNode(transferUnit.output)
                    ? factoryContainers.indexOf(transferUnit.output)
                    : undefined,
            outputTransferContainerNode:
                transferUnit.output !== undefined && isTransferContainerNode(transferUnit.output)
                    ? factoryTransferContainers.indexOf(transferUnit.output)
                    : undefined,
        }
        saveFactory.transferUnits.push(saveTransferUnit)
    }

    /**
     * Save TransferContainerNodes by replacing cyclic references with indicies
     */
    for (const transferContainer of factoryTransferContainers) {
        const items: Item[] = []
        const maintain: number[] = []
        for (const [key, value] of transferContainer.maintain.entries()) {
            items.push(key)
            maintain.push(value)
        }
        const saveTransferContainer: SaveTransferContainerNode = {
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

    return JSON.stringify(saveFactory, null, 4)
}

/**
 * De-serialize a JSON string representation of a FactoryGraph
 * @param serializedFactory the serialized FactoryGraph
 */
export function deserialize(serializedFactory: string): FactoryGraph {
    const factory = new FactoryGraph()
    const saveFactory = JSON.parse(serializedFactory)
    const factoryContainers: ContainerNode[] = []
    const factoryTransferContainers: TransferContainerNode[] = []

    // Unpack ContainerNodes
    for (const saveContainer of saveFactory.containers) {
        let container: ContainerNode
        const item = ITEMS[saveContainer.item.name as keyof typeof ITEMS]
        if (saveContainer.outputRate !== undefined) {
            container = factory.createOutput(
                item as Craftable,
                saveContainer.outputRate,
                saveContainer.maintainedOutput,
                saveContainer.id,
            )
        } else if (saveContainer.split !== 1.0) {
            container = factory.createSplitContainer(item, saveContainer.split, saveContainer.id)
        } else {
            container = factory.createContainer(item, saveContainer.id)
        }
        container.originalMaintain = saveContainer.maintain
        const containers = saveContainer.containers.map(
            (item: Item) => ITEMS[item.name as keyof typeof ITEMS],
        )
        container.originalContainers = containers
        factoryContainers.push(container)
    }

    // Unpack TransferContainerNodes
    for (const saveTransferContainer of saveFactory.transferContainers) {
        const items = saveTransferContainer.items.map(
            (item: Item) => ITEMS[item.name as keyof typeof ITEMS],
        )
        const transferContainer = factory.createTransferContainer(items, saveTransferContainer.id)
        factoryTransferContainers.push(transferContainer)
    }

    // Unpack IndustryNodes
    for (const saveIndustry of saveFactory.industries) {
        const item = ITEMS[saveIndustry.item.name as keyof typeof ITEMS]
        const industry = factory.createIndustry(item as Craftable, saveIndustry.id)

        // Add links
        for (const input of saveIndustry.inputContainers) {
            industry.takeFrom(factoryContainers[input])
        }
        for (const input of saveIndustry.inputTransferContainers) {
            industry.takeFrom(factoryTransferContainers[input])
        }
        industry.outputTo(factoryContainers[saveIndustry.output])
    }

    // Unpack TransferNodes
    for (const saveTransferUnit of saveFactory.transferUnits) {
        const item = ITEMS[saveTransferUnit.item.name as keyof typeof ITEMS]
        const transferUnit = factory.createTransferUnit(item, saveTransferUnit.id)

        // Add links
        for (const [input_i, input] of saveTransferUnit.inputs.entries()) {
            transferUnit.takeFrom(factoryContainers[input], saveTransferUnit.rates[input_i])
        }
        if (saveTransferUnit.outputContainerNode !== undefined) {
            transferUnit.outputTo(factoryContainers[saveTransferUnit.outputContainerNode])
        } else {
            transferUnit.outputTo(
                factoryTransferContainers[saveTransferUnit.outputTransferContainerNode],
            )
        }
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

    return factory
}
