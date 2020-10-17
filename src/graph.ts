/**
 * graph.ts
 * Define the factory graph and its components
 * lgfrbcsgo & Nikolaus - October 2020
 */
import {
    ContainerElement,
    CONTAINERS_ASCENDING_BY_CAPACITY,
    Craftable,
    Item,
    Quantity,
} from "./items"
import { findRecipe } from "./recipes"

export type PerMinute = number

/**
 * Container holding components. A set of producers is filling
 * this container, and a set of consumers is drawing from this container.
 */
export class ContainerNode {
    readonly producers = new Set<IndustryNode>()
    readonly consumers = new Set<ConsumerNode>()

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
     * Return the required maintain value to store the required components for all consumers
     */
    get maintain(): Quantity {
        let maintain = 0
        for (const consumer of this.consumers) {
            if (consumer instanceof IndustryNode) {
                for (const ingredient of findRecipe(consumer.item).ingredients) {
                    if (ingredient.item === this.item) {
                        maintain += ingredient.quantity
                    }
                }
            }
            /* If consumer is an OutputNode, maintain OutputNode requirement */
            if (consumer instanceof OutputNode && consumer.item === this.item) {
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

/**
 * Node that consumes product. Either an industry or a factory output.
 */
interface ConsumerNode {
    /**
     * Add or replace input container for an item
     * @param container Input container
     */
    takeFrom(container: ContainerNode): void

    /**
     * Return the consumption rate of a given item
     * @param item Item for which the consumption rate is calculated
     */
    getInput(item: Item): PerMinute
}

/**
 * Factory output node
 */
export class OutputNode implements ConsumerNode {

    input: ContainerNode | undefined

    /**
     * Initialize a new OutputNode
     * @param item Item produced by this industry
     * @param rate Required production rate
     * @param maintain The number of items to maintain
     */
    constructor(readonly item: Craftable, readonly rate: PerMinute, readonly maintain: Quantity) {
    }

    /**
     * @see {@link ConsumerNode#getInput}
     */
    getInput(item: Item): PerMinute {
        if (item === this.item) {
            return this.rate
        }
        return 0
    }

    /**
     * @see {@link ConsumerNode#takeFrom}
     */
    takeFrom(container: ContainerNode): void {
        this.input = container
        container.consumers.add(this)
    }
}

/**
 * Industry producing components. Draws inputs from a set of containers, and outputs
 * to a single container.
 */
export class IndustryNode implements ConsumerNode {
    readonly inputs = new Map<Item, ContainerNode>()

    output: ContainerNode | undefined

    constructor(readonly item: Craftable) {}

    /**
     * @see {@link ConsumerNode#takeFrom}
     */
    takeFrom(container: ContainerNode) {
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
     * @see {@link ConsumerNode#getInput}
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
}

export class FactoryGraph {
    /**
     * Graph containing factory components (industries and containers).
     */
    containers = new Set<ContainerNode>()
    industries = new Set<IndustryNode>()
    outputs = new Set<OutputNode>()

    /**
     * Add an industry to the factory graph
     * @see {@link IndustryNode}
     */
    createIndustry(item: Craftable): IndustryNode {
        const industry = new IndustryNode(item)
        this.industries.add(industry)
        return industry
    }

    /**
     * Add a container to the factory graph
     * @see {@link ContainerNode}
     */
    createContainer(item: Item): ContainerNode {
        const container = new ContainerNode(item)
        this.containers.add(container)
        return container
    }

    /**
     * Add an output node to the factory graph
     * @see {@link OutputNode}
     */
    createOutput(item: Craftable, rate: PerMinute, maintain: Quantity): OutputNode {
        const output = new OutputNode(item, rate, maintain)
        this.outputs.add(output)
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
