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
    readonly consumers = new Set<IndustryNode>()

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
}

/**
 * Factory output node
 */
export class OutputNode extends ContainerNode {
    /**
     * Initialize a new OutputNode
     * @param item Item produced by this industry
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

    getEgress(): PerMinute {
        return super.getEgress() + this.outputRate
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

    output: ContainerNode | undefined

    constructor(readonly item: Craftable, readonly factory: FactoryGraph) {}

    /**
     * Add or replace input container for an item
     * @param container Input container
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
}

export class FactoryGraph {
    /**
     * Graph containing factory components (industries and containers).
     */
    containers = new Set<ContainerNode>()
    industries = new Set<IndustryNode>()

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
}
