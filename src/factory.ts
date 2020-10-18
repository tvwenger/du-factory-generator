/**
 * factory.ts
 * Generate a factory graph using a recursive algorithm.
 * lgfrbcsgo & Nikolaus - October 2020
 */

import { Craftable, isOre, Item } from "./items"
import { findRecipe } from "./recipes"
import { ContainerNode, FactoryGraph, PerMinute } from "./graph"

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
        if (
            container.getEgress() + rate <= container.getIngress() &&
            container.outgoingLinkCount < 10
        ) {
            return container
        }
    }

    const recipe = findRecipe(item)

    // Search for containers which can accommodate extra producers
    const inputContainer = containers.find((container) => {
        const additionalMachines = Math.ceil(
            (rate + (container.getEgress() - container.getIngress())) /
            (recipe.product.quantity / recipe.time),
        )
        return (
            container.incomingLinkCount + additionalMachines <= 10 &&
            container.outgoingLinkCount < 10
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
 * @param factory FactoryGraph to be modified
 * @param output Container which has insufficient ingress
 */
function satisfyContainerEgress(factory: FactoryGraph, output: ContainerNode): void {
    if (isOre(output.item)) {
        return
    }

    const recipe = findRecipe(output.item)

    // figure out the needed additional industries
    const additionalIndustries = Math.ceil(
        (output.getEgress() - output.getIngress()) / (recipe.product.quantity / recipe.time),
    )

    // sanity check that this container as enough incoming links left
    if (additionalIndustries + output.incomingLinkCount > 10) {
        throw new Error(
            `Egress of ${output.getEgress()} ${output.item} per minute cannot be satisfied.`,
        )
    }

    for (let i = 0; i < additionalIndustries; i++) {
        const industry = factory.createIndustry(output.item)
        industry.outputTo(output)

        // Build dependencies recursively
        for (const ingredient of recipe.ingredients) {
            const input = findInputContainer(
                factory,
                ingredient.item,
                ingredient.quantity / recipe.time,
            )
            industry.takeFrom(input)

            // Try to satisfy the updated egress of the container
            satisfyContainerEgress(factory, input)
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
        const rate = (count * recipe.product.quantity) / recipe.time

        // Create factory output node
        const container = factory.createOutput(item, rate, maintain)
        satisfyContainerEgress(factory, container)
    }
    return factory
}
