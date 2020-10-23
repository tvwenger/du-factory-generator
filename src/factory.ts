/**
 * factory.ts
 * Generate a factory graph using a recursive algorithm.
 * lgfrbcsgo & Nikolaus - October 2020
 */

import { Craftable, isOre, Item, CATALYSTS, isCatalyst } from "./items"
import { findRecipe } from "./recipes"
import {
    ContainerNode,
    FactoryGraph,
    PerMinute,
    TransferNode,
    MAX_CONTAINER_LINKS,
    isIndustryNode,
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

    /* Return a new container for each catalyst */
    if (isCatalyst(item)) {
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
        /* Ore containers have no byproducts, */
        if (isOre(container.item)) {
            continue
        }
        const recipe = findRecipe(container.item)
        for (const byproduct of recipe.byproducts) {
            // Skip catalysts
            if (isCatalyst(byproduct.item)) {
                continue
            }
            /* Check if byproduct is already being consumed */
            let isConsumed = false
            for (const consumer of container.consumers) {
                if (consumer.item === byproduct.item) {
                    isConsumed = true
                }
            }
            if (isConsumed) {
                continue
            }
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

/**
 * Handle the production and transfer of catalysts
 * @param factory the FactoryGraph
 * */
function handleCatalysts(factory: FactoryGraph): void {
    // Loop over catalyst types
    for (const catalyst of CATALYSTS) {
        // Get all catalyst containers that don't already have an input link
        const catalystContainers = Array.from(factory.containers)
            .filter((node) => node.item === catalyst)
            .filter((node) => node.incomingLinkCount == 0)

        // Create a map of containers holding a catalyst byproduct, and
        // all containers from which that catalyst byproduct originated
        const catalystFlow: Map<ContainerNode, ContainerNode[]> = new Map()
        for (const container of catalystContainers) {
            const consumers = Array.from(container.consumers)
            if (consumers.length !== 1) {
                console.log(container)
                throw new Error("Catalyst container does not have one consumer?")
            }
            if (consumers[0].output === undefined) {
                console.log(consumers[0])
                throw new Error("Catalyst consumer has no output?")
            }
            if (catalystFlow.has(consumers[0].output)) {
                catalystFlow.set(
                    consumers[0].output,
                    catalystFlow.get(consumers[0].output)!.concat([container]),
                )
            } else {
                catalystFlow.set(consumers[0].output, [container])
            }
        }

        // Get transfer nodes already moving this catalyst
        const transferUnits = factory.getTransferUnits(catalyst)

        // Loop over containers holding byproduct and try to add an existing
        // transfer unit. Otherwise, create a new transfer unit
        for (const [endingContainer, startingContainers] of catalystFlow) {
            let transferUnit: TransferNode | undefined

            // Check for existing transfer unit
            for (const checkTransferUnit of transferUnits) {
                if (checkTransferUnit.output === undefined) {
                    console.log(checkTransferUnit)
                    throw new Error("Transfer unit has no output?")
                }
                if (
                    checkTransferUnit.canAddIncomingLinks(1) &&
                    checkTransferUnit.output.canAddOutgoingLinks(startingContainers.length)
                ) {
                    transferUnit = checkTransferUnit
                    break
                }
            }

            // Create new transfer unit if necessary
            if (transferUnit === undefined) {
                transferUnit = factory.createTransferUnit(catalyst)
                const container = factory.createContainer(catalyst)
                transferUnit.outputTo(container)
            }

            // Remove starting containers, link transfer unit output back to industries
            for (const container of startingContainers) {
                const consumers = Array.from(container.consumers)
                if (consumers.length !== 1) {
                    console.log(container)
                    throw new Error("Catalyst container does not have one consumer?")
                }
                consumers[0].inputs.delete(container)
                factory.containers.delete(container)
                if (transferUnit.output === undefined) {
                    console.log(transferUnit)
                    throw new Error("Transfer unit has no output?")
                }
                consumers[0].takeFrom(transferUnit.output)
            }

            // Link industry output to transfer unit
            transferUnit.takeFrom(endingContainer)
        }

        // Get all catalyst containers that don't already have a producing industry
        const containers = Array.from(factory.getContainers(catalyst)).filter(
            (node) => !Array.from(node.producers).some(isIndustryNode),
        )

        const recipe = findRecipe(catalyst)
        for (const container of containers) {
            // Add one industry to produce catalyst for this container
            const industry = factory.createIndustry(catalyst)
            industry.outputTo(container)
            // Build ingredients
            for (const ingredient of recipe.ingredients) {
                const inputs = produce(ingredient.item, ingredient.quantity / recipe.time, factory)
                for (const input of inputs) {
                    industry.takeFrom(input)
                }
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
    // Handle catalyst production
    handleCatalysts(factory)
    /* Sanity check for errors in factory */
    factory.sanityCheck()
    return factory
}
