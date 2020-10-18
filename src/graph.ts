/**
 * graph.ts
 * Define the factory graph and its components
 * lgfrbcsgo & Nikolaus - October 2020
 */
import {
    Craftable,
    Item,
    Quantity,
    ContainerElement,
    CONTAINERS_ASCENDING_BY_CAPACITY,
    isOre,
    ITEMS,
} from "./items"
import { findRecipe } from "./recipes"

/** Maximum number of incoming/outgoing container links */
var MAX_CONTAINER_LINKS = 10
/** Maximum number of incoming industry links */
var MAX_INDUSTRY_LINKS = 7

export type PerMinute = number

export class ContainerNode {
    /**
     * Container holding components. A set of producers is filling
     * this container, and a set of consumers is drawing from this container.
     */
    readonly producers = new Set<IndustryNode | TransferNode>()
    readonly consumers = new Set<ConsumerNode | TransferNode>()

    /**
     * Initialize a new ContainerNode
     * @param item Item stored in this container
     */
    constructor(readonly item: Item) {}

    /**
     * Return the number of producers filling this container
     */
    get incomingLinkCount(): number {
        return this.producers.size
    }

    /**
     * Return the number of consumers drawing from this container
     */
    get outgoingLinkCount(): number {
        return this.consumers.size
    }

    /**
     * Return the rate at which the producers are filling this container.
     */
    getIngress(): PerMinute {
        return Array.from(this.producers)
            .map((producer) => producer.getOutput(this.item))
            .reduce((totalIngress, ingress) => totalIngress + ingress, 0)
    }

    /**
     * Return the rate at which the consumers are drawing from this container.
     */
    getEgress(): PerMinute {
        return Array.from(this.consumers)
            .map((producer) => producer.getInput(this.item))
            .reduce((totalEgress, egress) => totalEgress + egress, 0)
    }

    /**
     * Check if a container can support additional incoming links
     * @param count Number of new incoming links
     */
    canAddIncomingLinks(count: number) {
        return this.incomingLinkCount + count <= MAX_CONTAINER_LINKS
    }

    /**
     * Check if a container can support additional outgoing links
     * @param count Number of new outgoing links
     */
    canAddOutgoingLinks(count: number) {
        /* Ore containers have no byproducts */
        if (isOre(this.item)) {
            return this.outgoingLinkCount + count <= MAX_CONTAINER_LINKS
        }
        /* Get byproducts stored in this container */
        const recipe = findRecipe(this.item)
        let reservedByproductLinks = recipe.byproducts.length
        for (const byproduct of recipe.byproducts) {
            /* Check if this container already has a consumer for this byproduct */
            for (const consumer of this.consumers) {
                if (consumer.item === byproduct.item) {
                    reservedByproductLinks += -1
                }
            }
        }
        return this.outgoingLinkCount + count + reservedByproductLinks <= MAX_CONTAINER_LINKS
    }

    /**
     * Return the required maintain value to store the required components for all consumers
     */
    get maintain(): Quantity {
        let maintain = 0
        for (const consumer of this.consumers) {
            /* Skip transfer units */
            if (isTransferNode(consumer)) {
                continue
            }
            for (const ingredient of findRecipe(consumer.item).ingredients) {
                if (ingredient.item === this.item) {
                    maintain += ingredient.quantity
                }
            }
            /* If consumer is an OutputNode, maintain OutputNode requirement */
            if (isOutputNode(consumer) && consumer.item === this.item) {
                maintain += consumer.maintain
            }
        }
        return maintain
    }

    /**
     * Return the required container (size) to hold the maintain value
     */
    get container(): ContainerElement {
        if (CONTAINERS_ASCENDING_BY_CAPACITY.length < 1) {
            throw new Error("CONTAINERS_ASCENDING_BY_CAPACITY is empty")
        }
        const requiredCapacity = this.maintain * this.item.volume
        let requiredContainer: ContainerElement = CONTAINERS_ASCENDING_BY_CAPACITY[0]
        for (const checkContainer of CONTAINERS_ASCENDING_BY_CAPACITY) {
            if (requiredCapacity <= checkContainer.capacity) {
                requiredContainer = checkContainer
            }
        }
        return requiredContainer
    }
}

export class ConsumerNode {
    /**
     * Node that consumes product. Industry or Output
     */
    readonly inputs: Map<Item, ContainerNode> = new Map()

    /**
     * Initialize a new ConsumerNode
     * @param item Item produced by this industry
     */
    constructor(readonly item: Craftable) {}

    /**
     * Add input container for an item
     * @param container Input container
     * @param item Input container's contents
     */
    takeFrom(container: ContainerNode, item: Item) {
        this.inputs.set(item, container)
        container.consumers.add(this)
    }

    /**
     * Return the consumption rate of a given item
     * @param item Item for which the consumption rate is calculated
     */
    getInput(item: Item): PerMinute {
        let quantity = 0
        const recipe = findRecipe(this.item)
        for (const ingredient of recipe.ingredients) {
            if (ingredient.item === item) {
                quantity += ingredient.quantity
            }
        }
        return quantity / recipe.time
    }

    /**
     * Return the number of inputs to this industry
     */
    get incomingLinkCount(): number {
        return this.inputs.size
    }

    /**
     * Check if a industry can support additional incoming links
     * @param count Number of new incoming links
     */
    canAddIncomingLinks(count: number) {
        return this.incomingLinkCount + count <= MAX_INDUSTRY_LINKS
    }
}

export class OutputNode extends ConsumerNode {
    /**
     * Factory output node
     */

    /**
     * Initialize a new OutputNode
     * @param item Item produced by this industry
     * @param rate Required production rate
     */
    constructor(readonly item: Craftable, readonly rate: PerMinute, readonly maintain: Quantity) {
        super(item)
    }

    /**
     * Return the consumption rate of this output
     * @param item Must be this node's item
     */
    getInput(item: Item): PerMinute {
        if (item === this.item) {
            return this.rate
        }
        return 0
    }
}

/**
 * OutputNode type guard
 * @param node Node to check
 */
export function isOutputNode(node: ConsumerNode): node is OutputNode {
    return node instanceof OutputNode
}

export class IndustryNode extends ConsumerNode {
    /**
     * Industry producing components. Draws inputs from a set of containers, and outputs
     * to a single container.
     */
    output: ContainerNode | undefined
    industry: Item | undefined

    /**
     * Initialize a new OutputNode
     * @param item Item produced by this industry
     * @param rate Required production rate
     */
    constructor(readonly item: Craftable) {
        super(item)
        this.industry = findRecipe(item).industry
    }

    /**
     * Add or replace output container
     * @param container Output container
     */
    outputTo(container: ContainerNode) {
        if (this.output) {
            this.output.producers.delete(this)
        }
        this.output = container
        container.producers.add(this)
    }

    /**
     * Return the production rate of a given item
     * @param item Item for which the production rate is calculated
     */
    getOutput(item: Item): PerMinute {
        let quantity = 0
        const recipe = findRecipe(this.item)
        for (const produced of [...recipe.byproducts, recipe.product]) {
            if (item === produced.item) {
                quantity += produced.quantity
            }
        }
        return quantity / recipe.time
    }
}

export class TransferNode {
    /**
     * Transfer Unit moving components. Draws inputs from a set of containers, and outputs
     * to a single container.
     */
    readonly inputs: ContainerNode[] = []
    output: ContainerNode | undefined

    /**
     * Initialize a new TransferNode
     * @param item Item produced by this industry
     */
    constructor(readonly item: Item) {}

    /**
     * Add or replace input container for an item
     * @param container Input container
     * @param item Input container's contents
     */
    takeFrom(container: ContainerNode, item: Item) {
        this.inputs.push(container)
        container.consumers.add(this)
    }

    /**
     * Add or replace output container
     * @param container Output container
     */
    outputTo(container: ContainerNode) {
        if (this.output) {
            this.output.producers.delete(this)
        }
        this.output = container
        container.producers.add(this)
    }

    /**
     * Return the inflow rate of a given item
     * For a transfer unit, this is the production rate of all producers
     * adding to the input containers of this node
     * @param item Item for which the production rate is calculated
     */
    /**
     * Return the consumption rate of a given item
     * @param item Item for which the consumption rate is calculated
     */
    getInput(item: Item): PerMinute {
        let rate = 0
        for (const container of this.inputs) {
            for (const producer of container.producers) {
                rate += producer.getOutput(item)
            }
        }
        return rate
    }

    /**
     * Return the production rate of a given item
     * For a transfer unit, this is the same as the inflow rate
     * @param item Item for which the production rate is calculated
     */
    getOutput(item: Item): PerMinute {
        return this.getInput(item)
    }

    /**
     * Return the number of inputs to this transfer unit
     */
    get incomingLinkCount(): number {
        return this.inputs.length
    }

    /**
     * Check if a transfer unit can support additional incoming links
     * @param count Number of new incoming links
     */
    canAddIncomingLinks(count: number) {
        return this.incomingLinkCount + count <= MAX_INDUSTRY_LINKS
    }
}

/**
 * TransferNode type guard
 * @param node Node to check
 */
export function isTransferNode(node: ConsumerNode | TransferNode): node is TransferNode {
    return node instanceof TransferNode
}

export class FactoryGraph {
    /**
     * Graph containing factory components (industries and containers).
     */
    containers = new Set<ContainerNode>()
    industries = new Set<IndustryNode>()
    transferUnits = new Set<TransferNode>()
    outputs = new Set<OutputNode>()

    /**
     * Add an industry to the factory graph
     * @param industry Industry to add
     */
    addIndustry(industry: IndustryNode) {
        this.industries.add(industry)
    }

    /**
     * Add a transfer unit to the factory graph
     * @param transfer Industry to add
     */
    addTransferUnit(transfer: TransferNode) {
        this.transferUnits.add(transfer)
    }

    /**
     * Add a container to the factory graph
     * @param container Container to add
     */
    addContainer(container: ContainerNode) {
        this.containers.add(container)
    }

    /**
     * Add an output node to the factory graph
     * @param node ConsumerNode to add
     */
    addOutput(node: OutputNode) {
        this.outputs.add(node)
    }

    /**
     * Return the set of all consumers of a given item
     * @param item Item for which to find the consumers
     */
    getConsumers(item: Item): Set<ConsumerNode> {
        return new Set(
            Array.from(this.industries).filter(
                (node) =>
                    findRecipe(node.item).ingredients.some(
                        (ingredient) => ingredient.item === item,
                    ) ||
                    (isOutputNode(node) && node.item == item),
            ),
        )
    }

    /**
     * Return the set of all transfer units of a given item
     * @param item Item for which to find the consumers
     */
    getTransferUnits(item: Item): Set<TransferNode> {
        return new Set(Array.from(this.transferUnits).filter((node) => node.item === item))
    }

    /**
     * Return the set of all containers holding a given item
     * @param item Item for which to find the containers
     */
    getContainers(item: Item): Set<ContainerNode> {
        return new Set(Array.from(this.containers).filter((node) => node.item === item))
    }

    /**
     * Return the set of all products produced or stored in this factory
     */
    getProducts(): Set<Item> {
        return new Set(Array.from(this.containers).map((node) => node.item))
    }

    /**
     * Return a Map of factory output items and production rates
     */
    getOutputs(): Map<Item, PerMinute> {
        let outputMap = new Map<Item, PerMinute>()
        for (const output of this.outputs) {
            outputMap.set(output.item, output.getInput(output.item))
        }
        return outputMap
    }
}
