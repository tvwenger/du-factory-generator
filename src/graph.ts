/**
 * graph.ts
 * Define the factory graph and its components
 * lgfrbcsgo & Nikolaus - October 2020
 */
import { Item, Ore } from "./items"
import { findRecipe } from "./recipes"

export type PerMinute = number
export type FactoryNode = ContainerNode | IndustryNode

export class ContainerNode {
    /**
     * Container holding components. A set of producers is filling
     * this container, and a set of consumers is drawing from this container.
     */
    readonly producers = new Set<IndustryNode>()
    readonly consumers = new Set<IndustryNode>()

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

export class IndustryNode {
    /**
     * Industry producing components. Draws inputs from a set of containers, and outputs
     * to a single container.
     */
    readonly inputs = new Map<Item, ContainerNode>()
    output: ContainerNode | undefined = undefined

    /**
     * Initialize a new IndustryNode
     * @param item Item produced by this industry
     * @param utilization Utilization fraction
     */
    constructor(readonly item: Exclude<Item, Ore>) {}

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
