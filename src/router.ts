import { FactoryNode, ProductionNode, DumpRoute, RelayRoute } from "./graph"
import { isCatalyst, isGas } from "./items"

/**
 * Route a node's relay containers
 * @param node Node to route
 */
export function generateRelayRoutes(node: FactoryNode) {
    // Satisfy all consumers
    for (const consumer of node.consumers) {
        // Get consuming industries that need node item
        let industries = consumer.getIndustriesNeeding(node.item)

        // Add to existing route if links are available
        for (const relayRoute of node.relayRoutes) {
            const addIndustries = Math.min(
                industries.length,
                relayRoute.container.outgoingLinksFree,
            )
            for (let i = 0; i < addIndustries; i++) {
                industries[i].addInput(relayRoute.container)
            }
            industries = consumer.getIndustriesNeeding(node.item)
        }

        // Add new relays if necessary
        while (industries.length > 0) {
            // Create container and transfer unit
            const container = node.factory.createRelayContainer(node.item)
            const transferUnit = node.factory.createTransferUnit(node.item, container)

            // Add industries
            const addIndustries = Math.min(industries.length, container.outgoingLinksFree)
            for (let i = 0; i < addIndustries; i++) {
                industries[i].addInput(container)
            }
            industries = consumer.getIndustriesNeeding(node.item)

            // Add relay route
            const relayRoute: RelayRoute = {
                container,
                transferUnit,
            }
            node.relayRoutes.push(relayRoute)
        }
    }

    // Route the output relay
    if (node.outputRate > 0) {
        if (node.outputRelay === undefined) {
            // Create container and transfer Unit
            const container = node.factory.createRelayContainer(node.item)
            const transferUnit = node.factory.createTransferUnit(node.item, container)

            container.setOutputRate(node.outputRate)
            container.setMaintainedOutput(node.maintainedOutput)
            const relayRoute: RelayRoute = {
                container,
                transferUnit,
            }
            node.relayRoutes.push(relayRoute)
        } else {
            if (
                node.outputRate !== node.outputRelay.container.outputRate ||
                node.maintainedOutput != node.outputRelay.container.maintainedOutput
            ) {
                node.outputRelay.container.setOutputRate(node.outputRate)
                node.outputRelay.container.setMaintainedOutput(node.maintainedOutput)
            }
        }
    }
}

/**
 * Route a node's dump containers
 * @param node Node to route
 */
export function generateDumpRoutes(node: ProductionNode) {
    // delta to avoid rounding errors
    const delta = 1.0e-8

    // Try to satisfy all relays using existing dump -> relay links
    for (const relayRoute of node.getRelayRoutes()) {
        // Unsatisfied container egress
        let relayEgress =
            relayRoute.container.egress(node.item) - relayRoute.container.ingress(node.item)
        if (relayEgress <= delta) {
            continue
        }

        // If this is a catalyst or gas node, try to satisfy from an existing dump container
        if (isCatalyst(node.item) || isGas(node.item)) {
            let found = false
            for (const dumpRoute of node.dumpRoutes) {
                if (dumpRoute.container.canAddOutgoingLinks(1)) {
                    relayRoute.transferUnit.addInput(dumpRoute.container)
                    relayRoute.transferUnit.increaseTransferRate(dumpRoute.container, relayEgress)
                    dumpRoute.relayRoutes.push(relayRoute)
                    found = true
                }
            }
            if (!found) {
                // Create a new dump route with one industry
                const dumpContainer = node.factory.createDumpContainer(node.item)
                const industry = node.factory.createIndustry(node.item, dumpContainer)
                const dumpRoute: DumpRoute = {
                    relayRoutes: [relayRoute],
                    container: dumpContainer,
                    industries: [industry],
                }
                node.dumpRoutes.push(dumpRoute)
                relayRoute.transferUnit.addInput(dumpContainer)
                relayRoute.transferUnit.increaseTransferRate(dumpContainer, relayEgress)
            }
            continue
        }

        // Increase production to dump container that already feeds node relay, if possible
        for (const dumpRoute of node.dumpRoutes) {
            if (dumpRoute.relayRoutes.includes(relayRoute)) {
                // How much overproduction we currently have
                let currentSurplus =
                    dumpRoute.container.ingress(node.item) - dumpRoute.container.egress(node.item)

                // How much more ingress can we produce
                const newIngress = dumpRoute.container.incomingLinksFree * node.rate

                // New industries we require
                let newEgress = Math.min(newIngress + currentSurplus, relayEgress)

                // New industries we require
                const newIndustries = Math.min(
                    Math.ceil((newEgress - currentSurplus) / node.rate),
                    dumpRoute.container.incomingLinksFree,
                )
                newEgress = currentSurplus + newIndustries * node.rate
                for (let i = 0; i < newIndustries; i++) {
                    const industry = node.factory.createIndustry(node.item, dumpRoute.container)
                    dumpRoute.industries.push(industry)
                }

                relayRoute.transferUnit.increaseTransferRate(dumpRoute.container, newEgress)
            }
            relayEgress =
                relayRoute.container.egress(node.item) - relayRoute.container.ingress(node.item)
        }
        if (relayEgress <= delta) {
            continue
        }
    }

    // Try to satisfy all relays using existing dump containers
    for (const relayRoute of node.getRelayRoutes()) {
        // Unsatisfied container egress
        let relayEgress =
            relayRoute.container.egress(node.item) - relayRoute.container.ingress(node.item)
        if (relayEgress <= delta) {
            continue
        }

        // Add to existing route if possible
        for (const dumpRoute of node.dumpRoutes) {
            // skip if this dump route is full
            if (!dumpRoute.container.canAddOutgoingLinks(1)) {
                continue
            }

            // if node dump route is feeding a relay that is supplied by more than
            // one dump route, then we cannot add any new routes to node dump container
            let splitDump = false
            for (const checkRelayRoute of dumpRoute.relayRoutes) {
                for (const checkDumpRoute of node.dumpRoutes) {
                    if (checkDumpRoute === dumpRoute) {
                        continue
                    }
                    if (checkDumpRoute.relayRoutes.includes(checkRelayRoute)) {
                        splitDump = true
                        break
                    }
                }
                if (splitDump) {
                    break
                }
            }
            if (splitDump) {
                continue
            }

            // if node relay container is already fed by a dump container and node dump
            // container isn't one of the dump containers feeding node relay, then we
            // can't add a different existing dump container to node relay
            let splitRelay = false
            for (const checkDumpRoute of node.dumpRoutes) {
                if (checkDumpRoute === dumpRoute) {
                    continue
                }
                if (checkDumpRoute.relayRoutes.includes(relayRoute)) {
                    splitRelay = true
                    break
                }
            }
            if (splitRelay) {
                continue
            }

            // How much overproduction we currently have
            let currentSurplus =
                dumpRoute.container.ingress(node.item) - dumpRoute.container.egress(node.item)

            // How much more ingress can we produce
            const newIngress = dumpRoute.container.incomingLinksFree * node.rate

            if (newIngress + currentSurplus >= relayEgress) {
                // New industries we require
                const newIndustries = Math.min(
                    Math.ceil((relayEgress - currentSurplus) / node.rate),
                    dumpRoute.container.incomingLinksFree,
                )
                const newEgress = currentSurplus + newIndustries * node.rate
                for (let i = 0; i < newIndustries; i++) {
                    const industry = node.factory.createIndustry(node.item, dumpRoute.container)
                    dumpRoute.industries.push(industry)
                }

                dumpRoute.relayRoutes.push(relayRoute)
                relayRoute.transferUnit.addInput(dumpRoute.container)
                relayRoute.transferUnit.increaseTransferRate(dumpRoute.container, newEgress)
            }
            relayEgress =
                relayRoute.container.egress(node.item) - relayRoute.container.ingress(node.item)
        }

        // Create new dump route if necessary
        while (relayEgress > delta) {
            const dumpContainer = node.factory.createDumpContainer(node.item)

            const dumpRoute: DumpRoute = {
                relayRoutes: [relayRoute],
                container: dumpContainer,
                industries: [],
            }
            const newIndustries = Math.min(
                Math.ceil(relayEgress / node.rate),
                dumpContainer.incomingLinksFree,
            )
            const newEgress = Math.min(relayEgress, newIndustries * node.rate)
            for (let i = 0; i < newIndustries; i++) {
                const industry = node.factory.createIndustry(node.item, dumpContainer)
                dumpRoute.industries.push(industry)
            }
            node.dumpRoutes.push(dumpRoute)
            relayRoute.transferUnit.addInput(dumpContainer)
            relayRoute.transferUnit.increaseTransferRate(dumpContainer, newEgress)
            relayEgress =
                relayRoute.container.egress(node.item) - relayRoute.container.ingress(node.item)
        }
    }
}
