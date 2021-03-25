import { Container } from "./container"
import {
    FactoryGraph,
    FactoryNode,
    MAX_CONTAINER_LINKS,
    MAX_INDUSTRY_LINKS,
    PerSecond,
} from "./graph"
import { CATALYSTS, Craftable, isGas, isOre, Item } from "./items"
import { findRecipe } from "./recipes"
import { generateDumpRoutes } from "./router"
import { isTransferContainer, TransferContainer } from "./transfer-container"
import { isTransferUnit } from "./transfer-unit"
import { sanityCheck, mergeFactory, unmergeFactory } from "./utils"

export enum FuelProductivity {
    ATMOSPHERIC_FUEL_PRODUCTIVITY = "Atmospheric Fuel Productivity", // +5% fuel
    SPACE_FUEL_PRODUCTIVITY = "Space Fuel Productivity",
    ROCKET_FUEL_PRODUCTIVITY = "Rocket Fuel Productivity",
}

export enum FuelRefining {
    FUEL_EFFICIENCY = "Fuel Efficiency", // +10% speed
    FUEL_REFINERY = "Fuel Refinery", // -2% ingredients
    ATMOSPHERIC_FUEL_REFINERY = "Atmospheric Fuel Refinery", // -3% ingredients
    SPACE_FUEL_REFINERY = "Space Fuel Refinery",
    ROCKET_FUEL_REFINERY = "Rocket Fuel Refinery",
}

export enum IntermediaryPartProductivity {
    BASIC_INTERMEDIARY_PART_PRODUCTIVITY = "Basic Intermediary Part Productivity", // +1 part
    UNCOMMON_INTERMEDIARY_PART_PRODUCTIVITY = "Uncommon Intermediary Part Productivity",
    ADVANCED_INTERMDIARY_PART_PRODUCTIVITY = "Advanced Intermediary Part Productivity",
}

export enum AdvancedAmmoProductivity {
    ADVANCED_AMMO_EFFICIENCY = "Advanced Ammo Efficiency", // -10% crafting time
    ADVANCED_AMMO_XS_PRODUCTIVITY = "Advanced Ammo XS Productivity", // +1 Ammo
    ADVANCED_AMMO_S_PRODUCTIVITY = "Advanced Ammo S Productivity",
    ADVANCED_AMMO_M_PRODUCTIVITY = "Advanced Ammo M Productivity",
    ADVANCED_AMMO_L_PRODUCTIVITY = "Advanced Ammo L Productivity",
}

export enum UncommonAmmoProductivity {
    UNCOMMON_AMMO_EFFICIENCY = "Uncommon Ammo Efficiency", // -10% crafting time
    UNCOMMON_AMMO_XS_PRODUCTIVITY = "Uncommon Ammo XS Productivity", // +1 Ammo
    UNCOMMON_AMMO_S_PRODUCTIVITY = "Uncommon Ammo S Productivity",
    UNCOMMON_AMMO_M_PRODUCTIVITY = "Uncommon Ammo M Productivity",
    UNCOMMON_AMMO_L_PRODUCTIVITY = "Uncommon Ammo L Productivity",
}

export enum ComplexPartsManufacturer {
    BASIC_COMPLEX_PART_EFFICIENCY = "Basic Complex Part Efficiency", // -10% crafting time
    UNCOMMON_COMPLEX_PART_EFFICIENCY = "Uncommon Complex Part Efficiency",
    ADVANCED_COMPLEX_PART_EFFICIENCY = "Advanced Complex Part Efficiency",
    RARE_COMPLEX_PART_EFFICIENCY = "Rare Complex Part Efficiency",
    EXOTIC_COMPLEX_PART_EFFICIENCY = "Exotic Complex Part Efficiency",
}

export enum ExceptionalPartsManufacturer {
    ADVANCED_EXCEPTIONAL_PART_EFFICIENCY = "Advanced Exceptional Part Efficiency", // -10% crafting time
    RARE_EXCEPTIONAL_PART_EFFICIENCY = "Rare Exceptional Part Efficiency",
    EXOTIC_EXCEPTIONAL_PART_EFFICIENCY = "Exotic Exceptional Part Efficiency",
}

export enum FunctionalPartsManufacturer {
    BASIC_FUNCTIONAL_PART_EFFICIENCY = "Basic Functional Part Efficiency", // -10% crafting time
    UNCOMMON_FUNCTIONAL_PART_EFFICIENCY = "Uncommon Functional Part Efficiency",
    ADVANCED_FUNCTIONAL_PART_EFFICIENCY = "Advanced Functional Part Efficiency",
    RARE_FUNCTIONAL_PART_EFFICIENCY = "Rare Functional Part Efficiency",
    EXOTIC_FUNCTIONAL_PART_EFFICIENCY = "Exotic Functional Part Efficiency",
}

export enum StructuralPartsManufacturer {
    BASIC_STRUCTURAL_PART_EFFICIENCY = "Basic Structural Part Efficiency", // -10% crafting time
    UNCOMMON_STRUCTURAL_PART_EFFICIENCY = "Uncommon Structural Part Efficiency",
    ADVANCED_STRUCTURAL_PART_EFFICIENCY = "Advanced Structural Part Efficiency",
    RARE_STRUCTURAL_PART_EFFICIENCY = "Rare Structural Part Efficiency",
    EXOTIC_STRUCTURAL_PART_EFFICIENCY = "Exotic Structural Part Efficiency",
}

export enum IntermediaryPartsManufacturer {
    BASIC_INTERMEDIARY_PART_EFFICIENCY = "Basic Intermediary Part Efficiency", // -10% crafting time
    UNCOMMON_INTERMEDIARY_PART_EFFICIENCY = "Uncommon Intermediary Part Efficiency",
    ADVANCED_INTERMEDIARY_PART_EFFICIENCY = "Advanced Intermediary Part Efficiency",
}

export enum BasicOreRefining {
    BASIC_REFINERY_EFFICIENCY = "basic refinery efficiency", // -5% crafting time
    CARBON_ORE_REFINING = "carbon ore refining", // -3% ore
    IRON_ORE_REFINING = "iron ore refining",
    ALUMINIUM_ORE_REFINING = "aluminium ore refining",
    SILICON_ORE_REFINING = "silicon ore refining",
}

export enum BasicPureProductivity {
    PURE_CARBON_PRODUCTIVITY = "pure carbon refining", // +3% pure
    PURE_IRON_REFINING = "pure iron refining",
    PURE_ALUMINIUM_REFINING = "pure aluminium refining",
    PURE_SILICON_REFINING = "pure silicon refining",
}

export enum BasicProductRefining {
    BASIC_PRODUCT_REFINERY_EFFICIENY = "basic product refinery efficiency", // -5% crafting time
    ALFE_ALLOY_PRODUCT_REFINING = "al-fe alloy product refining", // -3% input material
    POLYCABONATE_PLASTIC_PRODUCT_REFINING = "polycarbonate plastic product refining",
    SILUMIN_PRODUCT_REFINING = "silumin product refining",
    STEEL_PRODUCT_REFINING = "steel product refining",
    GLASS_PRODUCT_REFINING = "glass roduct refining",
}

export enum BasicProductProductivity {
    ALFE_PRODUCT_PRODUCTIVITY = "al-fe product productivity", // +3% product
    POLYCABONATE_PLASTIC_PRODUCT_PRODUCTIVITY = "polycarbonate plastic product productivity",
    SILUMIN_PRODUCT_PRODUCTIVITY = "silumin product productivity",
    STEEL_PRODUCT_PRODUCTIVITY = "steel product productivity",
    GLASS_PRODUCT_PRODUCTIVITY = "glass product productivity",
}

export enum UncommonOreRefining {
    UNCOMMON_REFINERY_EFFICIENCY = "uncommon refinery efficiency", // -5% crafting time
    SODIUM_ORE_REFINING = "sodium ore refining", // -3% ore
    CALCIUM_ORE_REFINING = "calcium ore refining",
    CHROMIUM_ORE_REFINING = "chromium ore refining",
    COPPER_ORE_REFINING = "copper ore refining",
}

export enum UncommonPureProductivity {
    PURE_SODIUM_PRODUCTIVITY = "pure sodium refining", // +3% pure
    PURE_CALCIUM_REFINING = "pure calcium refining",
    PURE_CHROMIUM_REFINING = "pure chromium refining",
    PURE_COPPER_REFINING = "pure copper refining",
}

export enum UncommonProductRefining {
    UNCOMMON_PRODUCT_REFINERY_EFFICIENY = "uncommon product refinery efficiency", // -5% crafting time
    CALCIUM_REFINORCED_COPPER_PRODUCT_REFINING = "calcium reinforced copper alloy product refining", // -3% input material
    POLYCALCITE_PLASTIC_PRODUCT_REFINING = "polycalcite plastic product refining",
    DURALUMIN_PRODUCT_REFINING = "duralumin product refining",
    STAINLESS_STEEL_PRODUCT_REFINING = "stainless steel product refining",
    ADVANCED_GLASS_PRODUCT_REFINING = "advanced glass product refining",
}

export enum UncommonProductProductivity {
    CALCIUM_REFINORCED_COPPER_PRODUCT_PRODUCTIVITY = "calcium reinforced copper alloy product Productivity", // +3% product
    POLYCALCITE_PLASTIC_PRODUCT_PRODUCTIVITY = "polycalcite plastic product Productivity",
    DURALUMIN_PRODUCT_PRODUCTIVITY = "duralumin product Productivity",
    STAINLESS_STEEL_PRODUCT_PRODUCTIVITY = "stainless steel product Productivity",
    ADVANCED_GLASS_PRODUCT_PRODUCTIVITY = "advanced glass product Productivity",
}

export enum AdvancedOreRefining {
    ADVANCED_REFINERY_EFFICIENCY = "advanced refinery efficiency", // -5% crafting time
    LITHIUM_ORE_REFINING = "lithium ore refining", // -3% ore
    SULFUR_ORE_REFINING = "sulfur ore refining",
    NICKEL_ORE_REFINING = "nickel ore refining",
    SILVER_ORE_REFINING = "silver ore refining",
}

export enum AdvancedPureProductivity {
    PURE_LITHIUM_PRODUCTIVITY = "pure lithium refining", // +3% pure
    PURE_SULFUR_REFINING = "pure sulfur refining",
    PURE_NICKEL_REFINING = "pure nickel refining",
    PURE_SILVER_REFINING = "pure silver refining",
}

export enum AdvancedProductRefining {
    ADVANCED_PRODUCT_REFINERY_EFFICIENY = "advanced product refinery efficiency", // -5% crafting time
    CUAG_PRODUCT_REFINING = "cu-ag alloy product refining", // -3% input material
    POLYSULFIDE_PLASTIC_PRODUCT_REFINING = "polysulfide plastic product refining",
    ALLI_ALLOY_PRODUCT_REFINING = "al-li alloy product refining",
    INCONEL_STEEL_PRODUCT_REFINING = "inconel product refining",
    AGLI_REINFORCED_GLASS_PRODUCT_REFINING = "ag-li refinforced glass product refining",
}

export enum AdvancedProductProductivity {
    CUAG_PRODUCT_PRODUCTIVITY = "cu-ag alloy product Productivity", // +3% product
    POLYSULFIDE_PLASTIC_PRODUCT_PRODUCTIVITY = "polysulfide plastic product Productivity",
    ALLI_ALLOY_PRODUCT_PRODUCTIVITY = "al-li alloy product Productivity",
    INCONEL_STEEL_PRODUCT_PRODUCTIVITY = "inconel product Productivity",
    AGLI_REINFORCED_GLASS_PRODUCT_PRODUCTIVITY = "ag-li refinforced glass product Productivity",
}

export enum RareOreRefining {
    RARE_REFINERY_EFFICIENCY = "rare refinery efficiency", // -5% crafting time
    GOLD_ORE_REFINING = "gold ore refining", // -3% ore
    COBALT_ORE_REFINING = "cobalt ore refining",
    SCANDIUM_ORE_REFINING = "scandium ore refining",
    FLUORINE_ORE_REFINING = "fluorine ore refining",
}

export enum RarePureProductivity {
    PURE_GOLD_PRODUCTIVITY = "pure gold refining", // +3% pure
    PURE_COBALT_REFINING = "pure cobalt refining",
    PURE_SCANDIUM_REFINING = "pure scandium refining",
    PURE_FLUORINE_REFINING = "pure fluorine refining",
}

export enum RareProductRefining {
    RARE_PRODUCT_REFINERY_EFFICIENY = "rare product refinery efficiency", // -5% crafting time
    RED_GOLD_PRODUCT_REFINING = "red gold alloy product refining", // -3% input material
    FLUOROPOLYMER_PLASTIC_PRODUCT_REFINING = "fluropolymer plastic product refining",
    SCAL_ALLOY_PRODUCT_REFINING = "sc-al alloy product refining",
    MARAGING_STEEL_PRODUCT_REFINING = "maraging steel product refining",
    GOLDCOAGED_GLASS_PRODUCT_REFINING = "gold-coated glass product refining",
}

export enum RareProductProductivity {
    RED_GOLD_PRODUCT_PRODUCTIVITY = "red gold alloy product Productivity", // +3% product
    FLUOROPOLYMER_PLASTIC_PRODUCT_PRODUCTIVITY = "fluropolymer plastic product Productivity",
    SCAL_ALLOY_PRODUCT_PRODUCTIVITY = "sc-al alloy product Productivity",
    MARAGING_STEEL_PRODUCT_PRODUCTIVITY = "maraging steel product Productivity",
    GOLDCOAGED_GLASS_PRODUCT_PRODUCTIVITY = "gold-coated glass product Productivity",
}

export enum ExoticOreRefining {
    EXOTIC_REFINERY_EFFICIENCY = "exotic refinery efficiency", // -5% crafting time
    TITANIUM_ORE_REFINING = "titanium ore refining", // -3% ore
    MANGANESE_ORE_REFINING = "manganese ore refining",
    VANADIUM_ORE_REFINING = "vanadium ore refining",
    NIOBIUM_ORE_REFINING = "niobium ore refining",
}

export enum ExoticPureProductivity {
    PURE_TITANIUM_PRODUCTIVITY = "pure titanium refining", // +3% pure
    PURE_MANGANESE_REFINING = "pure manganese refining",
    PURE_VANADIUM_REFINING = "pure vanadium refining",
    PURE_NIOBIUM_REFINING = "pure niobium refining",
}

export enum ExoticProductRefining {
    EXOTIC_PRODUCT_REFINERY_EFFICIENY = "exotic product refinery efficiency", // -5% crafting time
    TINB_SUPRACONDUCTOR_PRODUCT_REFINING = "ti-nb supraconductor product refining", // -3% input material
    VANAMER_PRODUCT_REFINING = "vanamer product refining",
    GRADE_5_TITANIUM_ALLOY_PRODUCT_REFINING = "grade 5 titanium alloy product refining",
    MANGALLOY_PRODUCT_REFINING = "mangalloy product refining",
    MANGANESE_REINFORCED_GLASS_PRODUCT_REFINING = "manganese reinforced glass product refining",
}

export enum ExoticProductProductivity {
    TINB_SUPRACONDUCTOR_PRODUCT_PRODUCTIVITY = "ti-nb supraconductor product Productivity", // +3% product
    VANAMER_PRODUCT_PRODUCTIVITY = "vanamer product Productivity",
    GRADE_5_TITANIUM_ALLOY_PRODUCT_PRODUCTIVITY = "grade 5 titanium alloy product Productivity",
    MANGALLOY_PRODUCT_PRODUCTIVITY = "mangalloy product Productivity",
    MANGANESE_REINFORCED_GLASS_PRODUCT_PRODUCTIVITY = "manganese reinforced glass product Productivity",
}

export enum 

/**
 * Add a production node for a given item if it doesn't exist, then call this function
 * recursively for all item ingredients.
 * @param item Item to produce
 * @param factory the FactoryGraph
 */
function addProductionNode(item: Item, factory: FactoryGraph): FactoryNode {
    // Get node if it exists
    const node = factory.getNode(item)
    if (node !== undefined) {
        return node
    }

    // Create an ore node and terminate recursion
    if (isOre(item)) {
        const oreNode = factory.createOreNode(item)
        return oreNode
    }

    // Add this item to the tree
    const productionNode = factory.createProductionNode(item)

    // Add all ingredients
    const recipe = findRecipe(item)
    for (const ingredient of recipe.ingredients) {
        // Add ingredients to tree
        const inputNode = addProductionNode(ingredient.item, factory)

        // Link ingredients to node
        inputNode.addConsumer(productionNode)
    }

    // Return new node
    return productionNode
}

/**
 * Add transfer units to move byproducts
 * @param factory the factory graph
 */
function handleByproducts(factory: FactoryGraph) {
    // Handle byproducts
    for (const container of factory.dumpContainers) {
        if (container.recipe === undefined) {
            // no byproducts
            continue
        }

        for (const byproduct of container.recipe.byproducts) {
            // Check if this container already has a transfer unit for the byproduct
            let found = false
            for (const consumer of container.consumers) {
                if (isTransferUnit(consumer) && consumer.item == byproduct.item) {
                    found = true
                    // ensure that the transfer rate is set
                    consumer.setTransferRate(container, container.ingress(consumer.item))
                }
            }
            if (found) {
                continue
            }

            // Look for an existing transfer unit
            let foundTransferUnit = false
            const transferUnits = factory.getByproductTransferUnits(byproduct.item)
            for (const transferUnit of transferUnits) {
                if (transferUnit.canAddIncomingLink) {
                    transferUnit.addInput(container)
                    transferUnit.increaseTransferRate(container, container.ingress(byproduct.item))
                    foundTransferUnit = true
                    break
                }
            }
            if (foundTransferUnit) {
                continue
            }

            // Find a dump container storing byproduct that doesn't already have
            // a transfer unit dumping into it and can support an additional incoming link
            const dumpContainers = factory.getDumpContainers(byproduct.item)
            let outputContainer = undefined
            let minTransferUnits = MAX_CONTAINER_LINKS
            for (const checkContainer of dumpContainers) {
                const numTransferUnits = Array.from(checkContainer.producers).filter(isTransferUnit)
                    .length
                minTransferUnits = Math.min(minTransferUnits, numTransferUnits)
                if (checkContainer.canAddIncomingLinks(1) && numTransferUnits === 0) {
                    outputContainer = checkContainer
                    break
                }
            }

            // Find a dump container storing byproduct that can support an additional incoming link
            // and has the minimum number of transfer units
            if (outputContainer === undefined) {
                for (const checkContainer of dumpContainers) {
                    const numTransferUnits = Array.from(checkContainer.producers).filter(
                        isTransferUnit,
                    ).length
                    if (
                        checkContainer.canAddIncomingLinks(1) &&
                        numTransferUnits === minTransferUnits
                    ) {
                        outputContainer = checkContainer
                        break
                    }
                }
            }

            // Create a new DumpContainer for this product if necessary
            if (outputContainer === undefined) {
                outputContainer = factory.createDumpContainer(byproduct.item as Craftable)
            }

            // Add new transfer unit
            const transferUnit = factory.createTransferUnit(byproduct.item, outputContainer)
            transferUnit.addInput(container)
            transferUnit.increaseTransferRate(container, container.ingress(byproduct.item))
        }
    }

    // Chain catalyst dump containers together (0 <-> 1 <-> 2 ... etc.)
    for (const catalyst of CATALYSTS) {
        const containers = factory.getDumpContainers(catalyst)
        let lastContainer: Container | undefined = undefined
        for (const container of containers) {
            if (lastContainer === undefined) {
                lastContainer = container
                continue
            }

            // check if previous container has a link to this one
            let transferUnits = Array.from(lastContainer.consumers)
                .filter(isTransferUnit)
                .filter((node) => node.output === container)
            if (transferUnits.length === 0) {
                const transferUnit = factory.createTransferUnit(catalyst, container)
                transferUnit.addInput(lastContainer)
                transferUnit.increaseTransferRate(lastContainer, lastContainer.ingress(catalyst))
            }

            // check if this container has link to previous one
            transferUnits = Array.from(container.consumers)
                .filter(isTransferUnit)
                .filter((node) => node.output === lastContainer)
            if (transferUnits.length === 0) {
                const transferUnit = factory.createTransferUnit(catalyst, lastContainer)
                transferUnit.addInput(container)
                transferUnit.increaseTransferRate(container, container.ingress(catalyst))
            }
            lastContainer = container
        }
    }
}

/**
 * Add TransferContainers as necessary to satisfy industries that required too many links
 * @param factory the factory graph
 */
function handleTransferContainers(factory: FactoryGraph) {
    // Add transfer containers for industries with too many incoming links
    for (const industry of factory.industries) {
        const exceedingLinkCount = industry.incomingLinkCount - MAX_INDUSTRY_LINKS
        if (exceedingLinkCount <= 0) {
            continue
        }

        // Sort ingredients by quantity
        const recipeIngredients = industry.recipe.ingredients
        recipeIngredients.sort((a, b) => a.quantity - b.quantity)
        const ingredients = recipeIngredients.map((ingredient) => ingredient.item)

        // Try to use an existing transfer container
        const transferContainers = factory.getTransferContainers(new Set(ingredients))
        let transferContainer: TransferContainer | undefined = undefined
        for (const checkTransferContainer of transferContainers) {
            // We need to remove (exceedingLinkCount + 1) links from the industry and add
            // one link from a transfer container. Check if this transfer container holds
            // at least (exceedingLinkCount + 1) items.
            if (checkTransferContainer.items.length < exceedingLinkCount + 1) {
                continue
            }

            // Check that we can add an outgoing link
            if (!checkTransferContainer.canAddOutgoingLink) {
                continue
            }

            // We have to ensure that the ingredients are drawn from the relay containers
            // that this industry uses. Check that each transfer container transfer unit
            // draws from one of the industry inputs.
            let transferUnitsGood = true
            for (const transferUnit of checkTransferContainer.producers) {
                if (!Array.from(transferUnit.inputs).some((input) => industry.inputs.has(input))) {
                    transferUnitsGood = false
                }
            }
            if (!transferUnitsGood) {
                continue
            }

            // good
            transferContainer = checkTransferContainer
            break
        }

        // Create a new transfer container if necessary
        if (transferContainer === undefined) {
            const items = ingredients.slice(0, exceedingLinkCount + 1)
            transferContainer = factory.createTransferContainer(items)

            // Add transfer units
            for (const item of items) {
                const transferUnit = factory.createTransferUnit(item, transferContainer)
            }
        }

        // Remove existing container->industry links, and replace with
        // container->transfer unit links
        for (const transferUnit of transferContainer.producers) {
            let check = false
            for (const container of industry.inputs) {
                if (isTransferContainer(container)) {
                    continue
                }
                if (container.item === transferUnit.item) {
                    const transferRate = industry.inflowRateFrom(container, container.item)
                    industry.removeInput(container)
                    transferUnit.addInput(container)
                    transferUnit.increaseTransferRate(container, transferRate)
                    check = true
                    break
                }
            }
            if (!check) {
                console.log(industry)
                console.log(transferUnit)
                throw new Error("Unable to transfer item")
            }
        }

        // Link transfer container to industry
        industry.addInput(transferContainer)
    }
}

/**
 * Add gas producers to satisfy gas nodes
 * @param factory the factory graph
 */
function handleGas(factory: FactoryGraph) {
    // Loop over gas nodes
    for (const node of factory.gasNodes) {
        // update relay node transfer unit transfer rate
        // to match fractional production normalized by
        // relay throughput, or actual consumption rate,
        // whichever is smaller
        const totalEgress = node
            .getRelayRoutes()
            .map((route) => route.container.egress(node.item))
            .reduce((total, current) => total + current, 0)

        for (const relayRoute of node.getRelayRoutes()) {
            for (const dumpRoute of node.dumpRoutes) {
                const transferRate = Math.min(
                    relayRoute.container.egress(node.item),
                    (dumpRoute.container.ingress(node.item) *
                        relayRoute.container.egress(node.item)) /
                        totalEgress,
                )

                relayRoute.transferUnit.setTransferRate(dumpRoute.container, transferRate)
            }
        }

        // update dump routes allowing gas nodes to have multiple industries
        generateDumpRoutes(node, false)
    }
}

/**
 * Build a new factory graph or add to an existing graph
 * @param requirements The items and rates of new items to produce
 * @param factory The existing factory graph, if any
 */
export function buildFactory(
    requirements: Map<Craftable, { rate: PerSecond; maintain: number }>,
    talents: Map<Talent, number>,or
    factory?: FactoryGraph,
) {
    // Start a new graph if necessary
    if (factory === undefined) {
        factory = new FactoryGraph()
    } else {
        // Umerge dump and relay containers
        unmergeFactory(factory)
    }

    // Add required production nodes
    for (const [item, { rate, maintain }] of requirements.entries()) {
        // add or update production node for this item
        const node = addProductionNode(item, factory)
        node.outputRate += rate
        node.maintainedOutput += maintain
    }

    // Route and build nodes starting from the raw ores
    for (const node of factory.oreNodes) {
        node.getRelayRoutes()
    }
    // Route and build nodes starting from the gas dump routes
    for (const node of factory.gasNodes) {
        node.getDumpRoutes()
    }

    // Transfer byproducts
    handleByproducts(factory)

    // Handle transfer contianers
    handleTransferContainers(factory)

    // Add gas producers if necessary
    handleGas(factory)

    // Merge dump and relay containers
    mergeFactory(factory)

    // sanity check
    sanityCheck(factory)

    return factory
}
