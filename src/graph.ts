import { Container, isDumpContainer } from "./container"
import { Industry } from "./industry"
import { isGas, Item, Quantity, Recipe, getRecipe, isCraftable } from "./items"
import { generateDumpRoutes, generateRelayRoutes } from "./router"
import { TransferContainer } from "./transfer-container"
import { isByproductTransferUnit, TransferUnit } from "./transfer-unit"

export const MAX_CONTAINER_LINKS = 10
export const MAX_INDUSTRY_LINKS = 7

export type PerSecond = number

/**
 * RelayRoute holds the consuming nodes and the number of consuming industries
 */
export interface RelayRoute {
    container: Container
    transferUnit: TransferUnit
}

/**
 * DumpRoute holds the consuming relay routes and egress along each route
 */
export interface DumpRoute {
    relayRoutes: RelayRoute[]
    container: Container
    industries: Industry[]
}

/**
 * A node of the factory graph either stores raw materials or handles
 * the production of a single item.
 */
export class FactoryNode {
    // ProductionNodes consuming from this node
    consumers: Set<ProductionNode> = new Set()
    // Requested factory output of this item
    outputRate: PerSecond = 0
    // Requested maintain value
    maintainedOutput: Quantity = 0
    // Relay routing
    relayRoutes: RelayRoute[] = []
    isRelayRouted = false

    /**
     * Create a new FactoryNode which stores or produces a given item
     * @param factory the factory
     * @param item Item to store or produce in this FactoryNode
     */
    constructor(readonly factory: FactoryGraph, readonly item: Item) {}

    /**
     * Add a consumer to this FactoryNode
     * @param node consumer to add
     */
    addConsumer(node: ProductionNode) {
        this.consumers.add(node)
    }

    /**
     * Get this node's output relay(s)
     */
    get outputRelays(): RelayRoute[] {
        return this.relayRoutes.filter((route) => route.container.outputRate > 0)
    }

    /**
     * Get the total output rate of this node's output relay containers
     */
    get outputRelaysRate(): PerSecond {
        return this.outputRelays
            .map((relay) => relay.container.outputRate)
            .reduce((total, current) => total + current, 0)
    }

    /**
     * Get the total maintain value of this node's output relay containers
     */
    get outputRelaysMaintain(): Quantity {
        return this.outputRelays
            .map((relay) => relay.container.maintainedOutput)
            .reduce((total, current) => total + current, 0)
    }

    /**
     * Route the relay containers
     */
    getRelayRoutes(): RelayRoute[] {
        // Check if we've already routed this node
        if (this.isRelayRouted) {
            return this.relayRoutes
        }

        generateRelayRoutes(this)

        this.isRelayRouted = true
        return this.relayRoutes
    }
}

/**
 * A FactoryNode that only stores raw ores.
 */
class OreNode extends FactoryNode {
    /**
     * Create a new OreNode that stores a given item
     * @param factory the factory
     * @param item Ore to store
     */
    constructor(readonly factory: FactoryGraph, readonly item: Item) {
        super(factory, item)
    }
}

/**
 * Check if a given node is an OreNode
 * @param node Node to check
 */
export function isOreNode(node: FactoryNode): node is OreNode {
    return node instanceof OreNode
}

/**
 * A FactoryNode that produces an item
 */
export class ProductionNode extends FactoryNode {
    // Item's recipe
    recipe: Recipe
    // Dump container routing
    dumpRoutes: DumpRoute[] = []
    isDumpRouted = false

    /**
     * Create a new ProductionNode that produces a given item
     * @param factory the factory
     * @param item Item to produce
     */
    constructor(readonly factory: FactoryGraph, readonly item: Item) {
        super(factory, item)
        this.recipe = getRecipe(item, factory.talentLevels)
    }

    /**
     * Get production rate per industry
     */
    get rate(): PerSecond {
        return this.recipe.quantity / this.recipe.time
    }

    /**
     * Route the dump containers
     */
    getDumpRoutes(): DumpRoute[] {
        // Check if we've already routed this node
        if (this.isDumpRouted) {
            return this.dumpRoutes
        }

        generateDumpRoutes(this, true)

        this.isDumpRouted = true
        return this.dumpRoutes
    }

    /**
     * Return all industries not currently supplied by the given item
     */
    getIndustriesNeeding(item: Item): Industry[] {
        const industries: Industry[] = []
        for (const dumpRoute of this.getDumpRoutes()) {
            for (const industry of dumpRoute.industries) {
                if (!industry.isSuppliedWith(item)) {
                    industries.push(industry)
                }
            }
        }
        return industries
    }
}

/**
 * Check if a given node is a ProductionNode
 * @param node Node to check
 */
export function isProductionNode(node: FactoryNode): node is ProductionNode {
    return node instanceof ProductionNode
}

/**
 * The factory graph stores all nodes and elements in a factory
 */
export class FactoryGraph {
    nodes: Map<Item, FactoryNode> = new Map()
    containers: Set<Container> = new Set()
    industries: Set<Industry> = new Set()
    transferUnits: Set<TransferUnit> = new Set()
    transferContainers: Set<TransferContainer> = new Set()

    /**
     * Create a new FactoryGraph
     * @param talentLevels Talent levels
     */
    constructor(readonly talentLevels: { [key: string]: number }) {}

    /**
     * Return a node that stores or produces a given item
     * @param item Item to find
     */
    getNode(item: Item): FactoryNode | undefined {
        return this.nodes.get(item)
    }

    /**
     * Return the factory's OreNodes
     */
    get oreNodes(): OreNode[] {
        return Array.from(this.nodes.values()).filter(isOreNode)
    }

    /**
     * Return the factory's nodes storing gas
     */
    get gasNodes(): ProductionNode[] {
        return Array.from(this.nodes.values())
            .filter(isProductionNode)
            .filter((node) => isGas(node.item))
    }

    /**
     * Return all dump containers in the factory
     */
    get dumpContainers(): Container[] {
        return Array.from(this.containers).filter(isDumpContainer)
    }

    /**
     * Return all dump containers storing a given item
     * @param item Item to find
     */
    getDumpContainers(item: Item): Container[] {
        return Array.from(this.containers)
            .filter(isDumpContainer)
            .filter((node) => node.item === item)
    }

    /**
     * Return all relay containers storing a given item
     * @param item Item to find
     */
    getRelayContainers(item: Item): Container[] {
        return Array.from(this.containers)
            .filter((node) => !isDumpContainer(node))
            .filter((node) => node.item === item)
    }

    /**
     * Return all transfer units moving a given item
     * @param item Item to find
     */
    getTransferUnits(item: Item): TransferUnit[] {
        return Array.from(this.transferUnits).filter((node) => node.item === item)
    }

    /**
     * Return all byproduct transfer units moving a given item
     * @param item Item to find
     */
    getByproductTransferUnits(item: Item): TransferUnit[] {
        return Array.from(this.transferUnits)
            .filter(isByproductTransferUnit)
            .filter((node) => node.item === item)
    }

    /**
     * Return all industries producing a given item
     * @param item Item to find
     */
    getIndustries(item: Item): Industry[] {
        return Array.from(this.industries).filter((node) => node.item === item)
    }

    /**
     * Return the set of all transfer containers holding one or more of the
     * given items and no other items
     * @param items Items for which to find the TransferContainers
     */
    getTransferContainers(items: Set<Item>): Set<TransferContainer> {
        let transferContainers = Array.from(this.transferContainers)
        // Filter only those containing one or more of items
        transferContainers = transferContainers.filter((node) =>
            node.items.some((item) => Array.from(items).includes(item)),
        )
        // Filter out those containing anything not in items
        transferContainers = transferContainers.filter(
            (node) => !node.items.some((item) => !Array.from(items).includes(item)),
        )
        return new Set(transferContainers)
    }

    /**
     * Add an OreNode to the factory
     * @param item Ore stored in this node
     */
    createOreNode(item: Item): OreNode {
        const node = new OreNode(this, item)
        this.nodes.set(item, node)
        return node
    }

    /**
     * Add a ProductionNode to the factory
     * @param item Item to produce in this node
     */
    createProductionNode(item: Item): ProductionNode {
        const node = new ProductionNode(this, item)
        this.nodes.set(item, node)
        return node
    }

    /**
     * Add a relay container to the factory
     * @param item Item to store
     * @param id Identifier
     */
    createRelayContainer(item: Item, id?: string): Container {
        if (id === undefined) {
            const containers = this.getRelayContainers(item)
            id = `R${containers.length}`
        }
        let recipe = undefined
        if (isCraftable(item)) {
            recipe = getRecipe(item, this.talentLevels)
        }
        const container = new Container(id, item, recipe)
        this.containers.add(container)
        return container
    }

    /**
     * Add a dump container to the factory
     * @param item Item to store
     * @param id Identifier

     */
    createDumpContainer(item: Item, id?: string): Container {
        if (id === undefined) {
            const containers = this.getDumpContainers(item)
            id = `D${containers.length}`
        }
        let recipe = undefined
        if (isCraftable(item)) {
            recipe = getRecipe(item, this.talentLevels)
        }
        const container = new Container(id, item, recipe)
        this.containers.add(container)
        return container
    }

    /**
     * Add a transfer container to the factory
     * @param items Items to store
     */
    createTransferContainer(items: Item[], id?: string): TransferContainer {
        if (id === undefined) {
            id = `TC${this.transferContainers.size}`
        }
        const container = new TransferContainer(id, items)
        this.transferContainers.add(container)
        return container
    }

    /**
     * Add an Industry to the factory
     * @param item Item to produce
     * @param output Output container
     */
    createIndustry(item: Item, output: Container, id?: string): Industry {
        if (id === undefined) {
            const industries = this.getIndustries(item)
            id = `P${industries.length}`
        }
        const industry = new Industry(id, item, getRecipe(item, this.talentLevels), output)
        this.industries.add(industry)
        return industry
    }

    /**
     * Add a TransferUnit to the factory
     * @param item Item to move
     * @param output Output container
     */
    createTransferUnit(
        item: Item,
        output: Container | TransferContainer,
        id?: string,
    ): TransferUnit {
        if (id === undefined) {
            const transferUnits = this.getTransferUnits(item)
            id = `T${transferUnits.length}`
        }
        const transferUnit = new TransferUnit(id, item, output)
        this.transferUnits.add(transferUnit)
        return transferUnit
    }
}
