import { Container } from "./container"
import { MAX_CONTAINER_LINKS, PerSecond } from "./graph"
import { Industry } from "./industry"
import { ContainerElement, CONTAINERS_ASCENDING_BY_CAPACITY, Item, Quantity } from "./items"
import { findRecipe } from "./recipes"
import { isByproductTransferUnit, isTransferUnit, TransferUnit } from "./transfer-unit"

/**
 * TransferContainers store multiple items to feed industries that
 * require more than MAX_INDUSTRY_LINKS ingredients
 */
export class TransferContainer {
    readonly producers = new Set<TransferUnit>()
    readonly consumers = new Set<Industry>()
    // if this element has changed
    changed = true

    /**
     * Create a new TransferContainer
     * @param id Identifier
     * @param items Items to store
     */
    constructor(readonly id: string, readonly items: Item[]) {}

    /**
     * Get this element's name
     */
    get name(): string {
        return `Trans Container ${this.id}`
    }

    /**
     * Count the number of producers
     */
    get incomingLinkCount(): number {
        return this.producers.size
    }

    /**
     * Count the number of consumers
     */
    get outgoingLinkCount(): number {
        return this.consumers.size
    }

    /**
     * Check if this container can support an additional incoming link
     */
    get canAddIncomingLink(): boolean {
        return this.incomingLinkCount < MAX_CONTAINER_LINKS
    }

    /**
     * Check if this container can support an additional incoming link
     */
    get canAddOutgoingLink(): boolean {
        return this.outgoingLinkCount < MAX_CONTAINER_LINKS
    }

    /**
     * Add a producer to this container
     * @param node Producer to add
     */
    addProducer(node: TransferUnit) {
        this.producers.add(node)
        this.changed = true
        node.changed = true
    }

    /**
     * Remove a consumer from this container
     * @param node Consumer to remove
     */
    removeConsumer(node: Industry) {
        this.consumers.delete(node)
        this.changed = true
        node.changed = true
    }

    /**
     * Add a consumer from this container
     * @param node Consumer to add
     */
    addConsumer(node: Industry) {
        this.consumers.add(node)
        this.changed = true
        node.changed = true
    }

    /**
     * Calculate the rate at which this container is filled with a given item
     * @param item Item to check
     */
    ingress(item: Item): PerSecond {
        return Array.from(this.producers)
            .map((node) => node.outflowRateTo(this, item))
            .reduce((totalIngress, ingressFrom) => totalIngress + ingressFrom, 0)
    }

    /**
     * Calculate the rate at which this container is emptied of a given item
     * @param item Item to check
     */
    egress(item: Item): PerSecond {
        return Array.from(this.consumers)
            .map((node) => node.inflowRateFrom(this, item))
            .reduce((totalEgress, egressTo) => totalEgress + egressTo, 0)
    }

    /**
     * Return the required maintain value of a given item to satisfy all consumers
     * @param item Item for which to calculate maintain value
     */
    maintain(item: Item): Quantity {
        if (!this.items.includes(item)) {
            return 0
        }

        let maintain = 0
        for (const consumer of this.consumers) {
            // Skip byproduct transfer units
            if (isTransferUnit(consumer) && isByproductTransferUnit(consumer)) {
                continue
            }

            if (isTransferUnit(consumer)) {
                // For transfer units, get the maintain value of the transfer unit output
                // divided by the number of transfer unit inputs
                if (isTransferContainer(consumer.output)) {
                    maintain += Math.ceil(
                        consumer.output.maintain(item) / consumer.incomingLinkCount,
                    )
                } else {
                    maintain += Math.ceil(consumer.output.maintain / consumer.incomingLinkCount)
                }
            } else {
                // For industries, get the required input
                for (const ingredient of findRecipe(consumer.item).ingredients) {
                    if (ingredient.item === item) {
                        maintain += ingredient.quantity
                    }
                }
            }
        }
        return maintain
    }

    /**
     * Return the required containers (size)s to hold the maintain values
     */
    get containers(): ContainerElement[] {
        if (CONTAINERS_ASCENDING_BY_CAPACITY.length < 1) {
            throw new Error("CONTAINERS_ASCENDING_BY_CAPACITY is empty")
        }
        let remainingCapacity = 0
        const maintain = this.maintain
        for (const item of this.items) {
            remainingCapacity += this.maintain(item) * item.volume
        }
        const requiredContainers: ContainerElement[] = []
        while (remainingCapacity > 0) {
            let foundContainer = false
            for (const container of CONTAINERS_ASCENDING_BY_CAPACITY) {
                if (remainingCapacity <= container.capacity) {
                    requiredContainers.push(container)
                    remainingCapacity += -container.capacity
                    foundContainer = true
                    break
                }
            }
            if (!foundContainer) {
                // Add one large container
                requiredContainers.push(
                    CONTAINERS_ASCENDING_BY_CAPACITY[CONTAINERS_ASCENDING_BY_CAPACITY.length - 1],
                )
                remainingCapacity += -CONTAINERS_ASCENDING_BY_CAPACITY[
                    CONTAINERS_ASCENDING_BY_CAPACITY.length - 1
                ].capacity
            }
        }
        return requiredContainers
    }
}

/**
 * Check if a given element is a TransferContainer
 * @param node element to check
 */
export function isTransferContainer(
    node: Container | TransferContainer,
): node is TransferContainer {
    return node instanceof TransferContainer
}
