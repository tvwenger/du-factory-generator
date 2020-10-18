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
    IndustryNode,
    OutputNode,
    PerMinute,
    TransferNode,
    isTransferNode,
} from "./graph"

/**
 * Add to the a factory graph all nodes required to produce and store a given item
 * produced at a given rate. Recursively call this function to produce all ingredients.
 * @param factory FactoryGraph to be modified
 * @param item Item to be built
 * @param rate Rate at which to build the product
 */
export function buildDependencies(
    factory: FactoryGraph,
    item: Item,
    rate: PerMinute,
): ContainerNode {
    /** Get containers holding this product */
    const containers = Array.from(factory.getContainers(item))
    /** If ingredient is an ore, link from new or existing ore container */
    if (isOre(item)) {
        let output: ContainerNode | undefined = undefined
        for (const container of containers) {
            if (container.outgoingLinkCount < 10) {
                output = container
            }
        }
        if (output === undefined) {
            /* Create new ore container */
            output = new ContainerNode(item)
            factory.addContainer(output)
        }
        return output
    }
    /** Increase egress of existing container if possible. No need to increase production of dependencies */
    for (const container of containers) {
        if (
            container.getEgress() + rate <= container.getIngress() &&
            container.canAddOutgoingLinks(1)
        ) {
            return container
        }
    }
    let output: ContainerNode | undefined = undefined
    /** Add more producers if possible */
    const recipe = findRecipe(item)
    for (const container of containers) {
        /** Required number of additional producers */
        const count = Math.ceil(
            (rate + (container.getEgress() - container.getIngress())) /
                (recipe.product.quantity / recipe.time),
        )
        if (container.canAddIncomingLinks(count) && container.canAddOutgoingLinks(1)) {
            output = container
        }
    }
    /** Create a new container if necessary */
    if (output === undefined) {
        output = new ContainerNode(item)
        factory.addContainer(output)
    }
    /** Add new producers */
    const count = Math.ceil(
        (rate + (output.getEgress() - output.getIngress())) /
            (recipe.product.quantity / recipe.time),
    )
    for (let i = 0; i < count; i++) {
        const industry = new IndustryNode(item)
        industry.outputTo(output)
        factory.addIndustry(industry)
        /** Build dependencies recursively */
        for (const ingredient of recipe.ingredients) {
            const input = buildDependencies(
                factory,
                ingredient.item,
                ingredient.quantity / recipe.time,
            )
            industry.takeFrom(input, ingredient.item)
        }
    }
    return output
}

/**
 * Add transfer units to remove byproducts from industry outputs
 * @param factory the FactoryGraph
 */
export function handleByproducts(factory: FactoryGraph) {
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
                        output = new ContainerNode(byproduct.item)
                        factory.addContainer(output)
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
        console.log(item.name)
        /* Recursively build this product and all required components */
        const recipe = findRecipe(item)
        const rate = (count * recipe.product.quantity) / recipe.time
        const container = buildDependencies(factory, item, rate)
        /* Create factory output node */
        const output = new OutputNode(item, rate, maintain)
        output.takeFrom(container, item)
        factory.addOutput(output)
    }
    /* Add transfer units to relocate byproducts */
    handleByproducts(factory)
    return factory
}
