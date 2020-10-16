/**
 * factory.ts
 * Generate a factory graph using a recursive algorithm.
 * lgfrbcsgo & Nikolaus - October 2020
 */

import { Craftable, isOre, Item, ITEMS } from "./items"
import { findRecipe } from "./recipes"
import {
    ContainerNode,
    FactoryGraph,
    IndustryNode,
    OutputNode,
    PerMinute,
    ContainerVolume,
    isOutputNode,
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
 * Set the maintain values and container sizes for each container in the factory
 * @param factory FactoryGraph to update
 */
export function updateContainers(factory: FactoryGraph) {
    for (const container of factory.containers) {
        /* Maintain value is sum of required components for all consumers */
        container.maintain = 0
        for (const consumer of container.consumers) {
            for (const ingredient of findRecipe(consumer.item).ingredients) {
                if (ingredient.item === container.item) {
                    container.maintain += ingredient.quantity
                }
            }
            /* If consumer is an OutputNode, maintain OutputNode requirement */
            if (isOutputNode(consumer) && consumer.item === container.item) {
                container.maintain += consumer.maintain
            }
        }
        /* Get required container size to store maintain */
        const maintainVolume = container.maintain * container.item.volume
        for (const [size, volume] of ContainerVolume) {
            if (maintainVolume < volume) {
                container.size = size
            }
        }
    }
}

/**
 * Generate a new factory graph that supplies a given number of assemblers
 * for a given set of products
 * @param requirements Products and number of assemblers
 */
export function buildFactory(requirements: Map<Craftable, [number, number]>): FactoryGraph {
    const factory = new FactoryGraph()
    for (const [item, [count, maintain]] of requirements) {
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
    /* Set container maintain levels and sizes */
    updateContainers(factory)
    return factory
}
