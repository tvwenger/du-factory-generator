/**
 * factory.ts
 * Generate a factory graph using a recursive algorithm.
 * lgfrbcsgo & Nikolaus - October 2020
 */

import { items, Item, Ore, isOre } from "./items"
import { findRecipe } from "./recipes"
import { ContainerNode, FactoryGraph, IndustryNode, PerMinute } from "./graph"

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
        let container: ContainerNode | undefined = undefined
        if (containers.length > 0) {
            /*  Use existing ore container */
            container = containers[0]
        } else {
            /* Create new ore container */
            container = new ContainerNode(item)
            factory.addContainer(container)
        }
        return container
    }
    /** Increase egress of existing container if possible. No need to increase production of dependencies */
    for (const container of containers) {
        if (
            container.getEgress() + rate <= container.getIngress() &&
            container.outgoingLinkCount < 10
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
        if (container.incomingLinkCount + count <= 10 && container.outgoingLinkCount < 10) {
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
 * Generate a new factory graph that supplies a given number of assemblers
 * for a given set of products
 * @param requirements Products and number of assemblers
 */
export function buildFactory(requirements: Map<Exclude<Item, Ore>, number>): FactoryGraph {
    const factory = new FactoryGraph()
    for (const [item, count] of requirements) {
        console.log(item.name)
        /* Recursively build this product and all required components */
        const recipe = findRecipe(item)
        const rate = (count * recipe.product.quantity) / recipe.time
        const container = buildDependencies(factory, item, rate)
    }
    return factory
}
