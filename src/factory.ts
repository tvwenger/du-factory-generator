/**
 * factory.ts
 * Generate a factory graph using a recursive algorithm.
 * lgfrbcsgo & Nikolaus - October 2020
 */

import { Craftable, isOre, Item } from "./items"
import { findRecipe } from "./recipes"
import {
    ContainerNode,
    FactoryGraph,
    PerMinute,
    TransferNode,
    OutputNode,
    MAX_CONTAINER_LINKS,
} from "./graph"

/**
 * Add to the factory graph all nodes required to increase production of an item by a given rate.
 * Recursively call this function to produce all ingredients.
 * @param item Item to produce
 * @param rate Rate of increased production
 * @param factory the FactoryGraph
 */
function produce(item: Item, rate: PerMinute, factory: FactoryGraph): ContainerNode[] {
    /* Get containers already storing this item */
    const containers = factory.getContainers(item)

    /* Return a container(s) for ores, or create a new one(s) */
    if (isOre(item)) {
        for (const container of containers) {
            if (container.canAddOutgoingLinks(1)) {
                return [container]
            }
        }
        return [factory.createContainer(item)]
    }

    /* Increase egress of existing container if possible */
    for (const container of containers) {
        if (container.egress + rate < container.ingress && container.canAddOutgoingLinks(1)) {
            return [container]
        }
    }

    /* Create producers to existing container if possible */
    const recipe = findRecipe(item)
    let outputs: ContainerNode[] = []
    let additionalIndustries = 0
    for (const container of containers) {
        additionalIndustries = Math.ceil(
            (rate + container.egress - container.ingress) / (recipe.product.quantity / recipe.time),
        )
        if (
            container.canAddIncomingLinks(additionalIndustries) &&
            container.canAddOutgoingLinks(1)
        ) {
            outputs.push(container)
            break
        }
    }

    /* Create a new output container(s) if necessary */
    if (outputs.length === 0) {
        // The maximum number of required industries
        additionalIndustries = Math.ceil(rate / (recipe.product.quantity / recipe.time))

        // Add split containers if maxAdditionalIndustries exceeds limit
        if (additionalIndustries > MAX_CONTAINER_LINKS) {
            const numContainers = Math.ceil(additionalIndustries / MAX_CONTAINER_LINKS)
            const evenLinks = Math.ceil(additionalIndustries / numContainers)
            let linksRemaining = additionalIndustries
            for (let i = 0; i < numContainers; i++) {
                const numLinks = Math.min(evenLinks, linksRemaining)
                const split = numLinks / additionalIndustries
                outputs.push(factory.createSplitContainer(item, split))
                linksRemaining += -numLinks
            }
        } else {
            outputs.push(factory.createContainer(item))
        }
    }

    for (let i = 0; i < additionalIndustries; i++) {
        const industry = factory.createIndustry(item)
        industry.outputTo(outputs[i % outputs.length])
        /* Build dependencies recursively */
        for (const ingredient of recipe.ingredients) {
            const inputs = produce(ingredient.item, ingredient.quantity / recipe.time, factory)
            for (const input of inputs) {
                industry.takeFrom(input)
            }
        }
    }
    return outputs
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
                    transfer = factory.createTransferUnit(byproduct.item)
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
                transfer.takeFrom(container)
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
        // Add an output node
        const output = factory.createOutput(item, rate * count, maintain)

        for (let i = 0; i < count; i++) {
            // Add industry, output to OutputNode
            const industry = factory.createIndustry(item)
            industry.outputTo(output)
            // Build ingredients
            for (const ingredient of recipe.ingredients) {
                const inputs = produce(ingredient.item, ingredient.quantity / recipe.time, factory)
                for (const input of inputs) {
                    industry.takeFrom(input)
                }
            }
        }
    }
    /* Add transfer units to relocate byproducts */
    handleByproducts(factory)
    /* Sanity check for errors in factory */
    factory.sanityCheck()
    return factory
}
