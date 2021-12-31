import { MAX_CONTAINER_LINKS, PerSecond } from "./graph"
import { Industry, isIndustry } from "./industry"
import { CONTAINERS_ASCENDING_BY_CAPACITY, isCatalyst, Item, Quantity, Recipe } from "./items"
import { TransferContainer } from "./transfer-container"
import {
    isByproductTransferUnit,
    isCatalystBalancer,
    isTransferUnit,
    TransferUnit,
} from "./transfer-unit"
import { shortenName } from "./utils"

/**
 * A container stores a single item. A group of producers feed the
 * container, and a group of consumers draw from the container.
 */
export class Container {
    producers: Set<Industry | TransferUnit> = new Set()
    consumers: Set<Industry | TransferUnit> = new Set()
    // The recipe for the item stored in this container
    recipe: Recipe | undefined
    // The requested factory output rate
    outputRate: PerSecond = 0.0
    // Requested output storage
    maintainedOutput: Quantity = 0
    // if this element has changed
    changed = true
    // flag if this container is merged with another
    merged = false

    /**
     * Create a new Container
     * @param id Identifier
     * @param item The item to store
     * @param recipe Item recipe
     */
    constructor(readonly id: string, readonly item: Item, recipe: Recipe | undefined) {
        this.recipe = recipe
    }

    /**
     * Get this element's name
     */
    get name(): string {
        return `${shortenName(this.item.name)} ${this.id}`
    }

    /**
     * Count the number of producers
     */
    get incomingLinkCount(): number {
        return Array.from(this.producers)
            .map((producer) => (isTransferUnit(producer) ? producer.number : 1))
            .reduce((total, current) => total + current, 0)
    }

    /**
     * Count the number of consumers
     */
    get outgoingLinkCount(): number {
        return Array.from(this.consumers)
            .map((consumer) => (isTransferUnit(consumer) ? consumer.number : 1))
            .reduce((total, current) => total + current, 0)
    }

    /**
     * Number of incoming link slots available
     */
    get incomingLinksFree(): number {
        // need to reserve two incoming links for catalyst balancer if this is a catalyst container
        let numReserved = isCatalyst(this.item) ? 2 : 0
        return MAX_CONTAINER_LINKS - this.incomingLinkCount - numReserved
    }

    /**
     * Number of outgoing link slots available
     */
    get outgoingLinksFree(): number {
        // need to reserve one link per byproduct if this is a dump container
        let numReserved =
            isDumpContainer(this) && this.recipe !== undefined ? this.recipe.byproducts.size : 0
        // need to reserve two outgoing links for catalyst balancer if this is a catalyst container
        numReserved += isCatalyst(this.item) ? 2 : 0
        // need to reserve one link per catalyst if this is a dump container
        return MAX_CONTAINER_LINKS - this.outgoingLinkCount - numReserved
    }

    /**
     * Check that a given number of additional incoming links can be added
     * @param num Number of new links
     */
    canAddIncomingLinks(num: number): boolean {
        return this.incomingLinksFree >= num
    }

    /**
     * Check that a given number of additional outgoing links can be added
     * @param num Number of new links
     */
    canAddOutgoingLinks(num: number): boolean {
        return this.outgoingLinksFree >= num
    }

    /**
     * Set the output rate for this container
     * @param outputRate the new output rate
     */
    setOutputRate(outputRate: number) {
        this.outputRate = outputRate
        this.changed = true
    }

    /**
     * Set the maintained output for this container
     * @param maintainedOutput the new maintained output
     */
    setMaintainedOutput(maintainedOutput: number) {
        this.maintainedOutput = maintainedOutput
        this.changed = true
    }

    /**
     * Remove a producer to this container
     * @param node Producer to remove
     */
    removeProducer(node: Industry | TransferUnit) {
        this.producers.delete(node)
        this.changed = true
        node.changed = true
    }

    /**
     * Add a producer to this container
     * @param node Producer to add
     */
    addProducer(node: Industry | TransferUnit) {
        this.producers.add(node)
        this.changed = true
        node.changed = true
    }

    /**
     * Remove a consumer from this container
     * @param node Consumer to remove
     */
    removeConsumer(node: Industry | TransferUnit) {
        this.consumers.delete(node)
        this.changed = true
        node.changed = true
    }

    /**
     * Add a consumer from this container
     * @param node Consumer to add
     */
    addConsumer(node: Industry | TransferUnit) {
        this.consumers.add(node)
        this.changed = true
        node.changed = true
    }

    /**
     * Calculate the rate at which this container is filled with a given item
     * @param item The item
     */
    ingress(item: Item): PerSecond {
        return Array.from(this.producers)
            .map((node) => node.outflowRateTo(this, item))
            .reduce((totalIngress, ingressFrom) => totalIngress + ingressFrom, 0)
    }

    /**
     * Calculate the rate at which this container is emptied of a given item
     * @param item The item
     */
    egress(item: Item): PerSecond {
        let egress = 0
        if (this.item === item) {
            egress += this.outputRate
        }
        // ignore catalyst balancer egress
        egress += Array.from(this.consumers)
            .filter((node) => !isTransferUnit(node) || !isCatalystBalancer(node))
            .map((node) => node.inflowRateFrom(this, item))
            .reduce((totalEgress, egressTo) => totalEgress + egressTo, 0)
        return egress
    }

    /**
     * Calculate the rate at which this container is emptied of a given item
     * in the steady state limit (after the factory has been running for some time)
     * @param item The item
     */
    steadyStateEgress(item: Item): PerSecond {
        let egress = 0
        if (this.item === item) {
            egress += this.outputRate
        }
        // ignore catalyst balancer egress
        egress += Array.from(this.consumers)
            .filter((node) => !isTransferUnit(node) || !isCatalystBalancer(node))
            .map((node) => node.steadyStateInflowRateFrom(this, item))
            .reduce((totalEgress, egressTo) => totalEgress + egressTo, 0)
        return egress
    }

    /**
     * Return the required maintain value to store the required components for all consumers
     */
    get maintain(): Quantity {
        let maintain = this.maintainedOutput
        for (const consumer of this.consumers) {
            // Skip byproduct transfer units and catalyst balancers
            if (
                isTransferUnit(consumer) &&
                (isByproductTransferUnit(consumer) || isCatalystBalancer(consumer))
            ) {
                continue
            }

            if (isTransferUnit(consumer)) {
                // For transfer units, get the transfer batch size
                maintain += consumer.item.transferBatchSize
            } else {
                // For industries, get the required input
                for (const [ingredient, quantity] of consumer.recipe.ingredients.entries()) {
                    if (ingredient === this.item) {
                        maintain += quantity
                    }
                }
            }
        }
        return maintain
    }

    /**
     * Return the required containers (sizes) to hold the maintain value
     */
    get containers(): string[] {
        const requiredContainers: string[] = []
        let remainingCapacity = this.maintain * this.item.volume
        while (remainingCapacity > 0) {
            let foundContainer = false
            for (const container of CONTAINERS_ASCENDING_BY_CAPACITY) {
                if (remainingCapacity <= container.capacity) {
                    requiredContainers.push(container.name)
                    remainingCapacity += -container.capacity
                    foundContainer = true
                    break
                }
            }
            if (!foundContainer) {
                // Add one large container
                requiredContainers.push(
                    CONTAINERS_ASCENDING_BY_CAPACITY[CONTAINERS_ASCENDING_BY_CAPACITY.length - 1]
                        .name,
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
 * Check if a given element is a Container
 * @param node element to check
 */
export function isContainer(node: Container | TransferContainer): node is Container {
    return node instanceof Container
}

/**
 * Check if a container is a dump container
 * @param node container to check
 */
export function isDumpContainer(node: Container): boolean {
    // Dump containers have industry producers
    return Array.from(node.producers).some(isIndustry)
}
