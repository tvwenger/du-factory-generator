import { Container, isContainer } from "./container"
import { MAX_INDUSTRY_LINKS, PerSecond } from "./graph"
import { Industry } from "./industry"
import { Item } from "./items"
import { TransferContainer } from "./transfer-container"
import { shortenName } from "./utils"

/**
 * TransferUnits take an item from several inputs and deposit them into a single
 * output.
 */
export class TransferUnit {
    inputs: Set<Container> = new Set()
    output: Container | TransferContainer
    // the transfer rate from each input
    transferRates: Map<Container, PerSecond> = new Map()
    // if this element has changed
    changed = true
    // flag if this transferUnit is not necessary because the containers are merged
    merged = false

    /**
     * Create a new TransferUnit
     * @param id Identifier
     * @param item Item to move
     * @param output Output container
     */
    constructor(readonly id: string, readonly item: Item, output: Container | TransferContainer) {
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
    removeInput(node: Container) {
        this.inputs.delete(node)
        node.removeConsumer(this)
        this.changed = true
        node.changed = true
    }

    /**
     * Add an input to this TransferUnit
     * @param node input container to add
     */
    addInput(node: Container) {
        this.inputs.add(node)
        node.addConsumer(this)
        this.changed = true
        node.changed = true

        if (!this.transferRates.has(node)) {
            this.transferRates.set(node, 0.0)
        }
    }

    /**
     * Set the output container
     * @param node Output container
     */
    setOutput(node: Container | TransferContainer) {
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
     * Check if we can add one more input container
     */
    get canAddIncomingLink(): boolean {
        return this.incomingLinkCount < MAX_INDUSTRY_LINKS
    }

    /**
     * Set the transfer rate from a given container
     * @param container container
     * @param rate new transfer rate
     */
    setTransferRate(container: Container, rate: PerSecond) {
        this.transferRates.set(container, rate)
    }

    /**
     * Increase the transfer rate from a given container by a given amount
     * @param container container
     * @param rate increase to transfer rate
     */
    increaseTransferRate(container: Container, rate: PerSecond) {
        this.transferRates.set(container, this.transferRates.get(container)! + rate)
    }

    /**
     * Calculate the rate at which an item is transferred from a given container
     * @param container Container to check
     * @param item Item to check
     */
    inflowRateFrom(container: Container, item: Item): PerSecond {
        if (!this.inputs.has(container)) {
            return 0
        }
        if (this.item !== item) {
            return 0
        }

        if (!this.transferRates.has(container)) {
            return 0
        }

        return this.transferRates.get(container)!
    }

    /**
     * Calculate the rate at which an item is added to a given container
     * @param container Container to check
     * @param item Item to check
     */
    outflowRateTo(container: Container | TransferContainer, item: Item): PerSecond {
        if (this.output !== container) {
            return 0
        }
        if (this.item !== item) {
            return 0
        }

        return Array.from(this.transferRates.values()).reduce(
            (total, current) => total + current,
            0,
        )
    }

    /**
     * The number of transfer units required to satisfy transfer rate
     */
    get number(): number {
        const outflowRate = Array.from(this.transferRates.values()).reduce(
            (total, current) => total + current,
            0,
        )
        const maxTransferRate = this.item.transferBatchSize / this.item.transferTime
        return Math.ceil(outflowRate / maxTransferRate)
    }
}

/**
 * Check if a given element is a TransferUnit
 * @param node element to check
 */
export function isTransferUnit(node: Industry | TransferUnit): node is TransferUnit {
    return node instanceof TransferUnit
}

/**
 * Check if a transfer unit transfers byproduct
 * @param node transfer unit to check
 */
export function isByproductTransferUnit(node: TransferUnit): boolean {
    // Check if any input containers store this transfer unit's item as byproduct
    return Array.from(node.inputs).some((input) => {
        if (input.recipe === undefined) {
            return false
        }
        return input.recipe.byproducts.some((byproduct) => byproduct.item === node.item)
    })
}

/**
 * Check if a transfer unit is a catalyst balancer
 * @param node transfer unit to check
 */
export function isCatalystBalancer(node: TransferUnit): boolean {
    // Check if this transfer unit is (B) or (D) such that (A) -> (B) -> (C) -> (D) -> (A)
    const consumers = Array.from(node.output.consumers)
    for (const consumer of consumers) {
        if (isContainer(consumer.output)) {
            if (Array.from(node.inputs).includes(consumer.output)) {
                return true
            }
        }
    }
    return false
}
