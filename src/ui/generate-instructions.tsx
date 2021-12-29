import { DumpRoute, FactoryGraph, isProductionNode } from "../graph"
import { Item } from "../items"
import { CATEGORY_ORDER, TIER_ORDER } from "./render-factory"
import { TransferContainerInstruction } from "./transfer-container-instruction"
import { NodeInstruction } from "./node-instruction"
import { MergedNodeInstruction } from "./merge-node-instruction"
import { OreInstruction } from "./ore-instruction"
import { FactoryElement } from "../utils"

export type FactoryInstruction =
    | NodeInstruction
    | MergedNodeInstruction
    | TransferContainerInstruction
    | OreInstruction

/**
 * If an item name contains a terminal XS, S, M, L, or XL, replace
 * that with A, B, C, D, or E to support sorting
 * @param name the name to fix
 */
function replaceSizeInName(name: string) {
    name = name.replace(" XS", " A")
    name = name.replace(" S", " B")
    name = name.replace(" M", " C")
    name = name.replace(" L", " D")
    name = name.replace(" XL", " E")
    return name
}

/**
 * Sorting function to sort factory elements or items by name, considering XS, S, M, L, XL
 * @param a First node
 * @param b Second node
 */
export function sortName(a: FactoryElement | Item, b: FactoryElement | Item): number {
    let aName = replaceSizeInName(a.name)
    let bName = replaceSizeInName(b.name)
    return aName.localeCompare(bName, "en", { numeric: true })
}

/**
 * Generate the instruction set required to build a factory, in visualization order
 * @param factory the Factory graph
 * @param showDifferences if true, highlight changed nodes
 */
export function generateInstructions(
    factory: FactoryGraph,
    showDifferences: boolean,
): FactoryInstruction[] {
    const instructions: FactoryInstruction[] = []
    let section = 0

    // loop over category
    for (const category of CATEGORY_ORDER) {
        // Check if any transfer containers supply an industry in this category
        const transferContainers = Array.from(factory.transferContainers).filter((node) =>
            Array.from(node.consumers).some((consumer) => consumer.item.category === category),
        )
        // Sort by name
        transferContainers.sort((a, b) => sortName(a, b))

        // Add transferContainer instructions
        for (const container of transferContainers) {
            instructions.push(new TransferContainerInstruction(container, showDifferences, section))
        }
        section += 1

        // loop over tier
        for (const tier of TIER_ORDER) {
            // Get nodes
            const nodes = Array.from(factory.nodes.values()).filter(
                (node) => node.item.category === category && node.item.tier === tier,
            )
            // Sort by name
            nodes.sort((a, b) => sortName(a.item, b.item))

            // Loop over nodes
            for (const node of nodes) {
                // Split nodes into instruction groups. A single instruction group will be
                // one of the following:
                // 0. No dumps, group all relays into a single instruction (e.g., ores)
                // 1. One or more dumps feeding a single relay container or
                // 2. One dump feeding one or more relay containers
                const dumpGroups: DumpRoute[][] = []
                if (isProductionNode(node)) {
                    for (const dumpRoute of node.dumpRoutes) {
                        // skip if this dump route is already grouped
                        let skip = false
                        for (const dumpGroup of dumpGroups) {
                            if (dumpGroup.includes(dumpRoute)) {
                                skip = true
                            }
                        }
                        if (skip) {
                            continue
                        }

                        // single dump feeds multiple relays
                        if (dumpRoute.relayRoutes.length > 1) {
                            dumpGroups.push([dumpRoute])
                            continue
                        }

                        // Get all dump routes that feed this relay
                        const dumpGroup = []
                        for (const checkDumpRoute of node.dumpRoutes) {
                            if (checkDumpRoute.relayRoutes.includes(dumpRoute.relayRoutes[0])) {
                                dumpGroup.push(checkDumpRoute)
                            }
                        }
                        dumpGroups.push(dumpGroup)
                    }
                } else {
                    dumpGroups.push([])
                }

                // Loop over dump groups
                for (const dumpGroup of dumpGroups) {
                    if (dumpGroup.length === 0) {
                        instructions.push(
                            new OreInstruction(
                                node,
                                showDifferences,
                                section,
                                category,
                                "Tier " + tier,
                            ),
                        )
                    } else if (dumpGroup.length === 1 && dumpGroup[0].container.merged) {
                        instructions.push(
                            new MergedNodeInstruction(
                                dumpGroup[0].relayRoutes[0].container,
                                showDifferences,
                                section,
                                category,
                                "Tier " + tier,
                            ),
                        )
                    } else {
                        instructions.push(
                            new NodeInstruction(
                                node,
                                dumpGroup,
                                showDifferences,
                                section,
                                category,
                                "Tier " + tier,
                            ),
                        )
                    }
                }
            }
            section += 1
        }
    }
    return instructions
}
