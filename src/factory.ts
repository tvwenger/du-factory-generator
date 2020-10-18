/**
 * factory.ts
 * Generate a factory graph using a recursive algorithm.
 * lgfrbcsgo & Nikolaus - October 2020
 */

import { Craftable, isOre, Item } from "./items"
import { findRecipe } from "./recipes"
import { ContainerNode, FactoryGraph, PerMinute, TransferNode } from "./graph"

/**
 * Search for a container which either
 * - has enough excess ingress, or
 * - has enough incoming links left for additional industries
 * to be able to satisfy additional egress.
 * If none is found, create a new container.
 * @param factory FactoryGraph to be modified
 * @param item Item whose demand needs to be satisfied
 * @param rate Rate of the extra demand
 */
function findInputContainer(factory: FactoryGraph, item: Item, rate: PerMinute): ContainerNode {
    // If ingredient is an ore, create new ore container
    if (isOre(item)) {
        return factory.createContainer(item)
    }

    // Get containers holding this product
    const containers = Array.from(factory.getContainers(item))

    // Search for containers which have excess ingress
    for (const container of containers) {
        if (container.egress + rate <= container.ingress && container.canAddOutgoingLinks(1)) {
            return container
        }
    }

    const recipe = findRecipe(item)

    // Search for containers which can accommodate extra producers
    const inputContainer = containers.find((container) => {
        const additionalMachines = Math.ceil(
            (rate + (container.egress - container.ingress)) /
                (recipe.product.quantity / recipe.time),
        )
        return (
            container.canAddIncomingLinks(additionalMachines) &&
            container.canAddOutgoingLinks(1)
        )
    })

    // Create a new container if necessary
    if (inputContainer) {
        return inputContainer
    } else {
        return factory.createContainer(item)
    }
}

/**
 * Add to the a factory graph all nodes required to satisfy the insufficient ingress of the given
 * container.
 * Recursively call this function to produce all ingredients.
 * @param output Container which has insufficient ingress
 */
function satisfyContainerEgress(output: ContainerNode): void {
    if (isOre(output.item)) {
        return
    }

    const recipe = findRecipe(output.item)

    // figure out the needed additional industries
    const additionalIndustries = Math.ceil(
        (output.egress - output.ingress) / (recipe.product.quantity / recipe.time),
    )

    // sanity check that this container as enough incoming links left
    if (additionalIndustries + output.incomingLinkCount > 10) {
        throw new Error(`Egress of ${output.egress} ${output.item} per minute cannot be satisfied.`)
    }

    for (let i = 0; i < additionalIndustries; i++) {
        const industry = output.factory.createIndustry(output.item)
        industry.outputTo(output)

        // Build dependencies recursively
        for (const ingredient of recipe.ingredients) {
            const input = findInputContainer(
                output.factory,
                ingredient.item,
                ingredient.quantity / recipe.time,
            )
            industry.takeFrom(input)

            // Try to satisfy the updated egress of the container
            satisfyContainerEgress(input)
        }
    }
}

/**
 * Add transfer units to remove byproducts from industry outputs
 * @param factory the FactoryGraph
 */
function handleByproducts(factory: FactoryGraph) {
    /* Loop over all factory containers */
    for (const container of factory.containers) {
        /* Ore containers have no byproducts */
        if (isOre(container.item)) {
            continue
        }
        const recipe = findRecipe(container.item)
        for (const byproduct of recipe.byproducts) {
            /* Check if byproduct is already being consumed */
            let isConsumed = false
            for (const consumer of container.consumers) {
                if (consumer.item === byproduct.item) {
                    isConsumed = true
                }
            }
            if (!isConsumed) {
                /* Check if there is already a transfer unit for this item */
                let transfer: TransferNode | undefined
                const itemTransfers = factory.getTransferUnits(byproduct.item)
                for (const itemTransfer of itemTransfers) {
                    if (itemTransfer.canAddIncomingLinks(1)) {
                        transfer = itemTransfer
                    }
                }
                /* Create a new transfer unit if necessary */
                if (transfer === undefined) {
                    transfer = new TransferNode(byproduct.item)
                    factory.addTransferUnit(transfer)
                    /* Find an output container that has space for an incoming link */
                    let output: ContainerNode | undefined
                    const itemContainers = factory.getContainers(byproduct.item)
                    for (const itemContainer of itemContainers) {
                        if (itemContainer.canAddIncomingLinks(1)) {
                            output = itemContainer
                        }
                    }
                    /* Create a new container if necessary */
                    if (output === undefined) {
                        output = factory.createContainer(byproduct.item)
                    }
                    transfer.outputTo(output)
                }
                transfer.takeFrom(container, byproduct.item)
            }
        }
    }
}

/**
 * Generate a new factory graph that supplies a given number of assemblers
 * for a given set of products
 * @param requirements Products and number of assemblers
 */
export function buildFactory(
    requirements: Map<Craftable, { count: number; maintain: number }>,
): FactoryGraph {
    const factory = new FactoryGraph()
    for (const [item, { count, maintain }] of requirements) {
        const recipe = findRecipe(item)
        const rate = recipe.product.quantity / recipe.time

        for (let i = 0; i < count; i++) {
            // Create factory output node
            const container = factory.createOutput(item, rate, maintain)
            satisfyContainerEgress(container)
        }
    }
    /* Add transfer units to relocate byproducts */
    handleByproducts(factory)
    return factory
}
