/**
 * graph.ts
 * Define the factory graph and its components
 * lgfrbcsgo & Nikolaus - October 2020
 */
import {
    ContainerElement,
    CONTAINERS_ASCENDING_BY_CAPACITY,
    Craftable,
    isOre,
    Item,
    Quantity,
} from "./items"
import { findRecipe, Recipe } from "./recipes"

/** Maximum number of incoming/outgoing container links */
const MAX_CONTAINER_LINKS = 10

/** Maximum number of incoming industry links */
const MAX_INDUSTRY_LINKS = 7

export type PerMinute = number

/**
 * Container holding components. A set of producers is filling
 * this container, and a set of consumers is drawing from this container.
 */
export class ContainerNode {
    readonly producers = new Set<IndustryNode | TransferNode>()
    readonly consumers = new Set<IndustryNode | TransferNode>()

    /**
     * Initialize a new ContainerNode
     * @param item Item stored in this container
     * @param factory The factory this container belongs to
     */
    constructor(readonly item: Item, readonly factory: FactoryGraph) {}

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
    get ingress(): PerMinute {
        return Array.from(this.producers)
            .map((producer) => {
                if (producer instanceof IndustryNode) {
                    return producer.getOutput(this.item)
                } else {
                    return producer.actualTransferRate
                }
            })
            .reduce((totalIngress, ingress) => totalIngress + ingress, 0)
    }

    /**
     * Return the rate at which the consumers are drawing from this container.
     */
    get egress(): PerMinute {
        return Array.from(this.consumers)
            .map((producer) => {
                if (producer instanceof IndustryNode) {
                    return producer.getInput(this.item)
                } else {
                    return producer.actualTransferRate
                }
            })
            .reduce((totalEgress, egress) => totalEgress + egress, 0)
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
}

/**
 * Factory output node
 */
export class OutputNode extends ContainerNode {
    /**
     * Initialize a new OutputNode
     * @param item Item stored in this container
     * @param outputRate Required production rate
     * @param maintainedOutput The number of items to maintain
     * @param factory The factory this output belongs to
     */
    constructor(
        item: Craftable,
        readonly outputRate: PerMinute,
        readonly maintainedOutput: Quantity,
        factory: FactoryGraph,
    ) {
        super(item, factory)
    }

    get egress(): PerMinute {
        return super.egress + this.outputRate
    }

    get maintain(): Quantity {
        return super.maintain + this.maintainedOutput
    }
}

/**
 * Industry producing components. Draws inputs from a set of containers, and outputs
 * to a single container.
 */
export class IndustryNode {
    readonly inputs = new Map<Item, ContainerNode>()
    readonly recipe: Recipe

    output: ContainerNode | undefined

    get industry() {
        return this.recipe.industry
    }

    get item(): Craftable {
        // TODO: remove cast then gases are craftable
        return this.recipe.product.item as Craftable
    }

    /**
     * Return the number of inputs to this industry
     */
    get incomingLinkCount(): number {
        return this.inputs.size
    }

    constructor(item: Craftable, readonly factory: FactoryGraph) {
        this.recipe = findRecipe(item)
    }

    /**
     * Add or replace input container for an item
     * @param container Input container
     */
    takeFrom(container: ContainerNode) {
        if (this.inputs.has(container.item)) {
            this.inputs.get(container.item)!.consumers.delete(this)
        }
        this.inputs.set(container.item, container)
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
     * Check if a industry can support additional incoming links
     * @param count Number of new incoming links
     */
    canAddIncomingLinks(count: number) {
        return this.incomingLinkCount + count <= MAX_INDUSTRY_LINKS
    }
}

export class TransferNode {
    /**
     * Transfer Unit moving components. Draws inputs from a set of containers, and outputs
     * to a single container.
     */
    readonly inputs = new Set<ContainerNode>()
    readonly transferRate = Infinity // TODO: transfer rate is not infinite
    output: ContainerNode | undefined

    /**
     * Return the number of inputs to this transfer unit
     */
    get incomingLinkCount(): number {
        return this.inputs.size
    }

    /**
     * Return the transfer rate of a given item
     */
    get actualTransferRate(): PerMinute {
        let rate = 0
        for (const container of this.inputs) {
            for (const producer of container.producers) {
                if (producer instanceof IndustryNode) {
                    rate += producer.getOutput(this.item)
                } else {
                    rate += producer.actualTransferRate
                }
            }
        }
        return Math.min(rate, this.transferRate)
    }

    /**
     * Initialize a new TransferNode
     * @param item Item produced by this industry
     * @param factory The factory which this transfer unit belongs to
     */
    constructor(readonly item: Item, readonly factory: FactoryGraph) {}

    /**
     * Add an input container for an item
     * @param container Input container
     */
    takeFrom(container: ContainerNode) {
        this.inputs.add(container)
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
export function isTransferNode(node: IndustryNode | TransferNode): node is TransferNode {
    return node instanceof TransferNode
}

/**
 * Graph containing factory components (industries and containers).
 */
export class FactoryGraph {
    containers = new Set<ContainerNode>()
    industries = new Set<IndustryNode>()
    transferUnits = new Set<TransferNode>()

    /**
     * Return the set of all products produced or stored in this factory
     */
    get products(): Set<Item> {
        return new Set(Array.from(this.containers).map((node) => node.item))
    }

    /**
     * Add an industry to the factory graph
     * @see {@link IndustryNode}
     */
    createIndustry(item: Craftable): IndustryNode {
        const industry = new IndustryNode(item, this)
        this.industries.add(industry)
        return industry
    }

    /**
     * Add a transfer unit to the factory graph
     * @see {@link TransferNode}
     */
    createTransferUnit(item: Item) {
        const transfer = new TransferNode(item, this)
        this.transferUnits.add(transfer)
        return transfer
    }

    /**
     * Add a container to the factory graph
     * @see {@link ContainerNode}
     */
    createContainer(item: Item): ContainerNode {
        const container = new ContainerNode(item, this)
        this.containers.add(container)
        return container
    }

    /**
     * Add an output node to the factory graph
     * @see {@link OutputNode}
     */
    createOutput(item: Craftable, outputRate: PerMinute, maintainedOutput: Quantity): OutputNode {
        const output = new OutputNode(item, outputRate, maintainedOutput, this)
        this.containers.add(output)
        return output
    }

    /**
     * Return the set of all consumers of a given item
     * @param item Item for which to find the consumers
     */
    getConsumers(item: Item): Set<IndustryNode> {
        return new Set(
            Array.from(this.industries).filter((node) =>
                findRecipe(node.item).ingredients.some((ingredient) => ingredient.item === item),
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
}
