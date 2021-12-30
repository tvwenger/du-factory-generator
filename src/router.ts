import { FactoryNode, ProductionNode, DumpRoute, RelayRoute } from "./graph"
import { isCatalyst, isGas, isOre, getRecipe } from "./items"
import { MAX_CONTAINER_LINKS } from "./graph"

/**
 * Route a node's relay containers
 * @param node Node to route
 */
export function generateRelayRoutes(node: FactoryNode) {
    // delta to avoid rounding errors
    const delta = 1.0e-8

    // maximum number of supported transfer units, considering byproducts
    let maxTransferNumber = MAX_CONTAINER_LINKS
    if (!isOre(node.item)) {
        maxTransferNumber =
            MAX_CONTAINER_LINKS - getRecipe(node.item, node.factory.talentLevels).byproducts.size
    }

    // maximum rate supported by transfer units
    const maxTransferRate =
        (maxTransferNumber * node.item.transferBatchSize) / node.item.transferTime

    // Satisfy all consumers
    for (const consumer of node.consumers) {
        // Get consuming industries that need node item
        let industries = consumer.getIndustriesNeeding(node.item)

        // Add to existing route if links are available
        for (const relayRoute of node.relayRoutes) {
            // skip output nodes
            if (relayRoute.container.outputRate > 0) {
                continue
            }

            const addIndustries = Math.min(
                industries.length,
                relayRoute.container.outgoingLinksFree,
            )
            for (let i = 0; i < addIndustries; i++) {
                industries[i].addInput(relayRoute.container)
                relayRoute.transferUnit.increaseRequiredTransferRate(
                    industries[i].inflowRateOf(node.item),
                )
                // check that the number of transfer units can be supported
                // by the relay container incoming link limit as well as the
                // dump container outgoing link limit, considering byproducts
                if (
                    relayRoute.container.incomingLinksFree < 0 ||
                    relayRoute.transferUnit.number > maxTransferNumber
                ) {
                    industries[i].removeInput(relayRoute.container)
                    relayRoute.transferUnit.decreaseRequiredTransferRate(
                        industries[i].inflowRateOf(node.item),
                    )
                }
            }
            industries = consumer.getIndustriesNeeding(node.item)
        }

        // Add new relays if necessary
        let lastLength = industries.length
        while (industries.length > 0) {
            // Create container and transfer unit
            const container = node.factory.createRelayContainer(node.item)
            const transferUnit = node.factory.createTransferUnit(node.item, container)

            // Add industries
            const addIndustries = Math.min(industries.length, container.outgoingLinksFree)
            for (let i = 0; i < addIndustries; i++) {
                industries[i].addInput(container)
                transferUnit.increaseRequiredTransferRate(industries[i].inflowRateOf(node.item))
                // check that the number of transfer units can be supported
                // by the relay container incoming link limit as well as the
                // dump container outgoing link limit, considering byproducts
                if (container.incomingLinksFree < 0 || transferUnit.number > maxTransferNumber) {
                    industries[i].removeInput(container)
                    transferUnit.decreaseRequiredTransferRate(industries[i].inflowRateOf(node.item))
                }
            }
            industries = consumer.getIndustriesNeeding(node.item)
            if (industries.length == lastLength) {
                throw new Error("Recursion error in relay route assignment")
            }
            lastLength = industries.length

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
        let rateDiff = node.outputRate - node.outputRelaysRate
        let maintainDiff = node.maintainedOutput - node.outputRelaysMaintain

        // increase output rate of existing relays if any
        for (const route of node.outputRelays) {
            const increaseRate = Math.min(rateDiff, maxTransferRate - route.container.outputRate)
            let increaseMaintain = maintainDiff
            if (rateDiff > 0) {
                increaseMaintain = (maintainDiff * increaseRate) / rateDiff
            }
            route.container.setOutputRate(route.container.outputRate + increaseRate)
            route.container.setMaintainedOutput(route.container.maintainedOutput + increaseMaintain)
            route.transferUnit.increaseRequiredTransferRate(increaseRate)
            rateDiff = rateDiff - increaseRate
            maintainDiff = maintainDiff - increaseMaintain
        }

        // Add new output relays as necessary
        let lastRateDiff = rateDiff
        while (rateDiff > delta) {
            const container = node.factory.createRelayContainer(node.item)
            const transferUnit = node.factory.createTransferUnit(node.item, container)

            const increaseRate = Math.min(rateDiff, maxTransferRate)
            let increaseMaintain = maintainDiff
            increaseMaintain = (maintainDiff * increaseRate) / rateDiff
            container.setOutputRate(increaseRate)
            container.setMaintainedOutput(increaseMaintain)
            transferUnit.increaseRequiredTransferRate(increaseRate)
            const relayRoute: RelayRoute = {
                container,
                transferUnit,
            }
            node.relayRoutes.push(relayRoute)
            rateDiff = rateDiff - increaseRate
            maintainDiff = maintainDiff - increaseMaintain
            if (Math.abs(rateDiff - lastRateDiff) < delta) {
                throw new Error("Recursion error in output relay assignment")
            }
            lastRateDiff = rateDiff
        }
    }
}

/**
 * Route a node's dump containers
 * @param node Node to route
 * @param singleGas if True, only create one industry for new gas nodes
 */
export function generateDumpRoutes(node: ProductionNode, singleGas: boolean) {
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
        if (isCatalyst(node.item) || (isGas(node.item) && singleGas)) {
            let found = false
            for (const dumpRoute of node.dumpRoutes) {
                if (dumpRoute.container.canAddOutgoingLinks(relayRoute.transferUnit.number)) {
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

                // New egress we require
                let newEgress = Math.min(newIngress + currentSurplus, relayEgress)

                // New industries we require
                const newIndustries = Math.min(
                    Math.ceil((newEgress - currentSurplus) / node.rate),
                    dumpRoute.container.incomingLinksFree,
                )
                newEgress = Math.min(currentSurplus + newIndustries * node.rate, relayEgress)
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
            // skip if this dump route cannot support relay
            if (!dumpRoute.container.canAddOutgoingLinks(relayRoute.transferUnit.number)) {
                continue
            }

            // if node dump route is feeding a relay that is supplied by more than
            // one dump route, then we cannot add any new routes to node dump container
            const splitDump = dumpRoute.relayRoutes.some((checkRelayRoute) =>
                node.dumpRoutes.some(
                    (checkDumpRoute) =>
                        checkDumpRoute !== dumpRoute &&
                        checkDumpRoute.relayRoutes.includes(checkRelayRoute),
                ),
            )
            if (splitDump) {
                continue
            }

            // if node relay container is already fed by a dump container and node dump
            // container isn't one of the dump containers feeding node relay, then we
            // can't add a different existing dump container to node relay
            const splitRelay = node.dumpRoutes.some(
                (checkDumpRoute) =>
                    checkDumpRoute !== dumpRoute && checkDumpRoute.relayRoutes.includes(relayRoute),
            )
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
                const newEgress = Math.min(currentSurplus + newIndustries * node.rate, relayEgress)
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
        let lastEgress = relayEgress
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
            if (Math.abs(relayEgress - lastEgress) < delta) {
                throw new Error("Recursion error in output relay assignments")
            }
            lastEgress = relayEgress
        }
    }
}
