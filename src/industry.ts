import { Container, isContainer } from "./container"
import { PerSecond } from "./graph"
import { Item, Recipe, RECIPES } from "./items"
import { isTransferContainer, TransferContainer } from "./transfer-container"
import { TransferUnit } from "./transfer-unit"
import { shortenName } from "./utils"

/**
 * Industries consume ingredients from containers and produce an item and
 * byproducts to an output container.
 */
export class Industry {
    inputs: Set<Container | TransferContainer> = new Set()
    output: Container
    // Recipe of the item being produced
    recipe: Recipe
    // if this element has changed
    changed = true

    /**
     * Create a new Industry producing a given item to a given contianer
     * @param id Identifier
     * @param item Item to producer
     * @param output Output container
     */
    constructor(readonly id: string, readonly item: Item, output: Container) {
        this.recipe = RECIPES[item.name]
        this.output = output
        output.addProducer(this)
    }

    /**
     * Get this element's name
     */
    get name(): string {
        return `${shortenName(this.item.name)} ${this.id}`
    }

    /**
     * Remove an input container
     * @param node Input container to remove
     */
    removeInput(node: Container | TransferContainer) {
        this.inputs.delete(node)
        node.removeConsumer(this)
        this.changed = true
        node.changed = true
    }

    /**
     * Add an input container
     * @param node Input container
     */
    addInput(node: Container | TransferContainer) {
        this.inputs.add(node)
        node.addConsumer(this)
        this.changed = true
        node.changed = true
    }

    /**
     * Set the output container
     * @param node Output container
     */
    setOutput(node: Container) {
        this.output = node
        node.addProducer(this)
        this.changed = true
        node.changed = true
    }

    /**
     * Count the number of input containers
     */
    get incomingLinkCount(): number {
        return this.inputs.size
    }

    /**
     * Check if an industry has an input supplying a given item
     * @param item Item to check
     */
    isSuppliedWith(item: Item): boolean {
        for (const input of this.inputs) {
            if (isTransferContainer(input) && input.items.includes(item)) {
                return true
            }
            if (isContainer(input) && input.item === item) {
                return true
            }
        }
        return false
    }

    /**
     * Calculate the rate at which an ingredient is consumed
     * @param item Item to check
     */
    inflowRateOf(item: Item): PerSecond {
        for (const [ingredient, quantity] of this.recipe.ingredients.entries()) {
            if (ingredient === item) {
                return quantity / this.recipe.time
            }
        }
        return 0
    }

    /**
     * Calculate the rate at which an ingredient is consumed
     * in the steady state limit (after the factory has been running for some time)
     * @param item Item to check
     */
    steadyStateInflowRateOf(item: Item): PerSecond {
        // get actual egress of produced item from output container
        let outputEgress = this.output.steadyStateEgress(this.item)
        // estimate that each producer contributes equally
        let numProducers = this.output.producers.size
        for (const [ingredient, quantity] of this.recipe.ingredients.entries()) {
            if (ingredient === item) {
                return ((quantity / this.recipe.quantity) * outputEgress) / numProducers
            }
        }
        return 0
    }

    /**
     * Calculate the rate at which an ingredient is consumed from a given container
     * @param container Container to check
     * @param item Item to check
     */
    inflowRateFrom(container: Container | TransferContainer, item: Item): PerSecond {
        if (!this.inputs.has(container)) {
            return 0
        }
        if (isContainer(container) && container.item !== item) {
            return 0
        }
        if (isTransferContainer(container) && !container.items.includes(item)) {
            return 0
        }

        return this.inflowRateOf(item)
    }

    /**
     * Calculate the rate at which an ingredient is consumed from a given container
     * in the steady state limit (after the factory has been running for some time)
     * @param container Container to check
     * @param item The item
     */
    steadyStateInflowRateFrom(container: Container | TransferContainer, item: Item): PerSecond {
        if (!this.inputs.has(container)) {
            return 0
        }
        if (isContainer(container) && container.item !== item) {
            return 0
        }
        if (isTransferContainer(container) && !container.items.includes(item)) {
            return 0
        }

        return this.steadyStateInflowRateOf(item)
    }

    /**
     * Calculate the rate at which a given container is filled with a given item
     * @param container Container to check
     * @param item Item to check
     */
    outflowRateTo(container: Container, item: Item): PerSecond {
        if (this.output !== container) {
            return 0
        }

        if (this.item === item) {
            return this.recipe.quantity / this.recipe.time
        }

        for (const [byproduct, quantity] of this.recipe.byproducts.entries()) {
            if (byproduct === item) {
                return quantity / this.recipe.time
            }
        }

        return 0
    }
}

/**
 * Check if a given element is an Industry
 * @param node element to check
 */
export function isIndustry(node: Industry | TransferUnit): node is Industry {
    return node instanceof Industry
}
