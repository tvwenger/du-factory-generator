/**
 * graph.ts
 * Define the factory graph and its components
 * lgfrbcsgo & Nikolaus - October 2020
 */
import { Craftable, Item, Quantity, Liter } from "./items"
import { findRecipe } from "./recipes"

export type PerMinute = number
export enum ContainerSize {
    XS = "XS",
    S = "S",
    M = "M",
    L = "L",
}
/* Container volumes sorted from largest to smallest */
export const ContainerVolume = new Map<ContainerSize, Liter>([
    [ContainerSize.L, 128000],
    [ContainerSize.M, 64000],
    [ContainerSize.S, 8000],
    [ContainerSize.XS, 1000],
])

export class ContainerNode {
    /**
     * Container holding components. A set of producers is filling
     * this container, and a set of consumers is drawing from this container.
     */
    readonly producers = new Set<IndustryNode>()
    readonly consumers = new Set<ConsumerNode>()
    maintain: Quantity | undefined = undefined
    size: ContainerSize | undefined = undefined

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
}

export class ConsumerNode {
    /**
     * Node that consumes product. Either an industry or a factory output.
     */
    readonly inputs = new Map<Item, ContainerNode>()

    /**
     * Initialize a new ConsumerNode
     * @param item Item produced by this industry
     */
    constructor(readonly item: Craftable) {}

    /**
     * Add or replace input container for an item
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
    output: ContainerNode | undefined = undefined

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

export class FactoryGraph {
    /**
     * Graph containing factory components (industries and containers).
     */
    containers = new Set<ContainerNode>()
    industries = new Set<IndustryNode>()
    outputs = new Set<OutputNode>()

    /**
     * Add an industry to the factory graph
     * @param industry Industry to add
     */
    addIndustry(industry: IndustryNode) {
        this.industries.add(industry)
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
