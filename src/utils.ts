import { Container } from "./container"
import { FactoryGraph, isProductionNode, MAX_CONTAINER_LINKS } from "./graph"
import { Industry } from "./industry"
import { isOre } from "./items"
import { TransferContainer } from "./transfer-container"
import {
    isByproductTransferUnit,
    isCatalystBalancer,
    isTransferUnit,
    TransferUnit,
} from "./transfer-unit"

export type FactoryElement = Container | TransferContainer | Industry | TransferUnit

/**
 * Shorten an item name to support the element name length in game
 * @param name Original name
 */
export function shortenName(name: string): string {
    name = name.replace("Uncommon", "Unc")
    name = name.replace("Advanced", "Adv")
    name = name.replace("Anti-Matter", "AntiM")
    name = name.replace("Anti-Gravity", "AntiG")
    name = name.replace("-", "")
    return name
}

/**
 * Run some sanity checks on the factory
 * @param factory the factory graph
 */
export function sanityCheck(factory: FactoryGraph) {
    // delta to avoid rounding errors
    const delta = 1.0e-8

    // Check that no containers exceed link limits
    for (const container of factory.containers) {
        if (container.incomingLinkCount > MAX_CONTAINER_LINKS) {
            console.log(container)
            throw new Error("Container exceeds incoming link limit")
        }
        if (container.outgoingLinkCount > MAX_CONTAINER_LINKS) {
            console.log(container)
            throw new Error("Container exceeds outgoing link limit")
        }
    }
    for (const container of factory.transferContainers) {
        if (container.incomingLinkCount > MAX_CONTAINER_LINKS) {
            console.log(container)
            throw new Error("TransferContainer exceeds incoming link limit")
        }
        if (container.outgoingLinkCount > MAX_CONTAINER_LINKS) {
            console.log(container)
            throw new Error("TransferContainer exceeds outgoing link limit")
        }
    }

    // Check that the egress of each container is satisfied
    for (const container of factory.containers) {
        if (isOre(container.item)) {
            continue
        }
        if (container.egress(container.item) > container.ingress(container.item) + delta) {
            console.log(container)
            console.log("Egress: " + container.egress(container.item))
            console.log("Ingress: " + container.ingress(container.item))
            throw new Error("Container egress exceeds ingress")
        }
    }
    for (const container of factory.transferContainers) {
        for (const item of container.items) {
            if (container.egress(item) > container.ingress(item) + delta) {
                console.log(container)
                console.log("Egress: " + container.egress(item))
                console.log("Ingress: " + container.ingress(item))
                throw new Error("Container egress exceeds ingress")
            }
        }
    }

    // Check that required transfer rate is satisfied
    for (const transferUnit of factory.transferUnits) {
        // skip ore transfer units
        if (isOre(transferUnit.item)) {
            continue
        }

        // get actual transfer rate
        let transferRate = 0.0
        for (const [container, rate] of transferUnit.transferRates) {
            transferRate += rate
        }
        if (transferUnit.requiredTransferRate - transferRate > delta) {
            console.log(transferUnit)
            console.log("Required transfer rate: " + transferUnit.requiredTransferRate)
            console.log("Actual transfer rate: " + transferRate)
            throw new Error("Transfer Unit required transfer rate not satisfied")
        }
    }
}

/**
 * Merge dump and relay containers where possible
 * @param factory the factory graph
 */
export function mergeFactory(factory: FactoryGraph) {
    for (const node of factory.nodes.values()) {
        if (!isProductionNode(node)) {
            // Remove ore node transfer unit
            const containerChanged = node.relayRoutes[0].container.changed
            node.relayRoutes[0].transferUnit.merged = true
            node.relayRoutes[0].container.removeProducer(node.relayRoutes[0].transferUnit)
            node.relayRoutes[0].container.changed = containerChanged
            continue
        }

        // Check the transfer unit of each relay route.
        for (const relayRoute of node.relayRoutes) {
            // If this relay route is fed by only a single dump route,
            // and if that dump route only feeds this relay route, then we can
            // merge
            const dumpRoutes = node.dumpRoutes.filter((dumpRoute) =>
                dumpRoute.relayRoutes.includes(relayRoute),
            )

            if (dumpRoutes.length === 1 && dumpRoutes[0].relayRoutes.length === 1) {
                const dumpContainer = dumpRoutes[0].container
                const relayContainer = relayRoute.container
                const transferUnit = relayRoute.transferUnit

                // Check that relayContainer can support all of the dumpContainer's
                // incoming links (-1, since the relay container will no longer have
                // the merged transfer unit)
                if (!relayContainer.canAddIncomingLinks(dumpContainer.incomingLinkCount - 1)) {
                    continue
                }

                // Check that relayContainer can support all of the dumpContainer's
                // outgoing links (-1, since we are excluding the merged transfer unit)
                if (!relayContainer.canAddOutgoingLinks(dumpContainer.outgoingLinkCount - 1)) {
                    continue
                }

                // do not count merging as a change
                const relayContainerChanged = relayContainer.changed

                // remove transfer unit producer and consumer
                relayContainer.removeProducer(transferUnit)
                dumpContainer.removeConsumer(transferUnit)

                // Take all inputs to the dump container and route them to the relay container
                for (const producer of dumpContainer.producers) {
                    const producerChanged = producer.changed
                    dumpContainer.removeProducer(producer)
                    producer.setOutput(relayContainer)
                    producer.changed = producerChanged
                }
                // Take all outputs from the dump container and route them to the relay container
                for (const consumer of dumpContainer.consumers) {
                    const consumerChanged = consumer.changed
                    consumer.removeInput(dumpContainer)
                    consumer.addInput(relayContainer)
                    consumer.changed = consumerChanged
                }
                relayContainer.changed = relayContainerChanged

                // flag dump container and transfer unit as merged
                dumpContainer.merged = true
                transferUnit.merged = true
            }
        }
    }
}

/**
 * Unmerge dump and relay containers where possible
 * @param factory the factory graph
 */
export function unmergeFactory(factory: FactoryGraph) {
    for (const node of factory.nodes.values()) {
        if (!isProductionNode(node)) {
            // Unmerge ore transfer unit
            node.relayRoutes[0].transferUnit.merged = false
            node.relayRoutes[0].container.addProducer(node.relayRoutes[0].transferUnit)
            node.relayRoutes[0].container.changed = false
            continue
        }

        // Check the transfer unit of each relay route.
        for (const relayRoute of node.relayRoutes) {
            if (!relayRoute.transferUnit.merged) {
                continue
            }

            const dumpRoutes = node.dumpRoutes.filter((dumpRoute) =>
                dumpRoute.relayRoutes.includes(relayRoute),
            )

            if (dumpRoutes.length !== 1) {
                console.log(node)
                throw new Error("Merged node has more than one dump route")
            }

            const dumpContainer = dumpRoutes[0].container
            const relayContainer = relayRoute.container
            const transferUnit = relayRoute.transferUnit

            // move all producers except transfer unit from relay container to dump container
            for (const producer of relayContainer.producers) {
                if (producer === transferUnit) {
                    continue
                }
                relayContainer.removeProducer(producer)
                producer.setOutput(dumpContainer)
                producer.changed = false
            }

            // move all byproduct consumers to dump container
            for (const consumer of relayContainer.consumers) {
                if (
                    isTransferUnit(consumer) &&
                    (isByproductTransferUnit(consumer) || isCatalystBalancer(consumer))
                ) {
                    consumer.removeInput(relayContainer)
                    consumer.addInput(dumpContainer)
                    consumer.changed = false
                }
            }

            // add transfer unit
            transferUnit.addInput(dumpContainer)

            relayContainer.changed = false
            dumpContainer.changed = false
            transferUnit.changed = false

            dumpContainer.merged = false
            transferUnit.merged = false
        }
    }
}
