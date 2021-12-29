export type Liter = number
export type Seconds = number
export type Quantity = number

export enum Tier {
    GAS = 0,
    BASIC = 1,
    UNCOMMON = 2,
    ADVANCED = 3,
    RARE = 4,
    EXOTIC = 5,
}

export enum Category {
    AMMO = "Ammo",
    CATALYST = "Catalyst",
    COMBAT_ELEMENT = "Combat Element",
    COMPLEX_PART = "Complex Part",
    EXCEPTIONAL_PART = "Exceptional Part",
    FUEL = "Fuel",
    FUNCTIONAL_PART = "Functional Part",
    FURNITURE_AND_APPLIANCES_ELEMENT = "Furniture & Appliances Element",
    INDUSTRY_AND_INFRASTRUCTURE_ELEMENT = "Industry & Infrastructure Element",
    INTERMEDIARY_PART = "Intermediary Part",
    ORE = "Ore",
    PILOTING_ELEMENT = "Piloting Element",
    PLANET_ELEMENT = "Planet Element",
    PRODUCT = "Product",
    PRODUCT_HONEYCOMB = "Product Honeycomb",
    PURE = "Pure",
    PURE_HONEYCOMB = "Pure Honeycomb",
    SCRAP = "Scrap",
    STRUCTURAL_PART = "Structural Part",
    SYSTEMS_ELEMENT = "Systems Element",
    WARP_CELLS = "Warp Cells",
}

/**
 * Item type definition
 */
export interface Item {
    readonly name: string
    readonly tier: Tier
    readonly category: Category
    readonly volume: Liter
    readonly transferBatchSize: Quantity
    readonly transferTime: Seconds
}

/**
 * Ore type guard
 * @param item Item to check
 */
export function isOre(item: Item): boolean {
    return item.category === Category.ORE
}

/**
 * Gas type guard
 * @param item Item to check
 */
export function isGas(item: Item): boolean {
    return item.tier === Tier.GAS
}

/**
 * Craftable type guard
 * @param item Item to check
 */
export function isCraftable(item: Item): boolean {
    return !isOre(item)
}

/**
 * Catalyst type guard
 * @param item Item to check
 */
export function isCatalyst(item: Item): boolean {
    return item.category === Category.CATALYST
}

/**
 * Returns a new Item
 * @param name Name
 * @param tier Tier
 * @param category Category
 * @param volume Volume (L)
 * @param transferBatchSize Transfer Unit batch size
 * @param transferTime Transfer Unit transfer time (s)
 */
export function item(
    name: string,
    tier: Tier,
    category: Category,
    volume: Liter,
    transferBatchSize: Quantity,
    transferTime: Seconds,
): Item {
    return {
        name,
        tier,
        category,
        volume,
        transferBatchSize,
        transferTime,
    }
}

/**
 * Recipe type definition
 */
export interface Recipe {
    readonly item: Item
    readonly quantity: Quantity
    readonly time: Seconds
    readonly industry: string
    readonly byproducts: Map<Item, Quantity>
    readonly ingredients: Map<Item, Quantity>
}

/**
 * Returns a new Recipe
 * @param item Item
 * @param quantity Production quantity
 * @param time Production time (s)
 * @param industry Required industry
 * @param byproducts Byproducts and quantities
 * @param ingredients Ingredients and quantities
 */
export function recipe(
    item: Item,
    quantity: Quantity,
    time: Seconds,
    industry: string,
    byproducts: Map<Item, Quantity>,
    ingredients: Map<Item, Quantity>,
): Recipe {
    return {
        item,
        quantity,
        time,
        industry,
        byproducts,
        ingredients,
    }
}

/**
 * Load item data, populate ITEMS and RECIPES
 */
var items: { [key: string]: Item } = {}
var recipes: { [key: string]: Recipe } = {}
var data = require("./data/recipes.json")
for (const name in data) {
    // Most items have transfer batch size = 1 and
    // transfer time [seconds] = volume [liters]
    var transferBatchSize = 1
    var transferTime = data[name].volume
    if (data[name].type === Category.SCRAP) {
        transferBatchSize = 200
        transferTime = 200
    } else if (data[name].type === Category.FUEL) {
        transferBatchSize = 100
        transferTime = 11
    } else if (data[name].type == Category.PURE_HONEYCOMB) {
        transferBatchSize = 100
        transferTime = 11
    } else if (data[name].type == Category.PRODUCT_HONEYCOMB) {
        transferBatchSize = 100
        transferTime = 11
    } else if (data[name].type == Category.ORE) {
        transferBatchSize = 100
        transferTime = 11
    } else if (data[name].type == Category.CATALYST) {
        transferBatchSize = 1
        transferTime = 11
    } else if (data[name].type == Category.PRODUCT) {
        transferBatchSize = 100
        transferTime = 11
    } else if (data[name].type == Category.PURE) {
        transferBatchSize = 100
        transferTime = 11
    } else if (data[name].type == Category.COMPLEX_PART) {
        transferBatchSize = 50
        transferTime = 50 * data[name].volume
    } else if (data[name].type == Category.INTERMEDIARY_PART) {
        transferBatchSize = 200
        transferTime = 200 * data[name].volume
    }
    items[name] = item(
        name,
        data[name].tier,
        data[name].type,
        data[name].volume,
        transferBatchSize,
        transferTime,
    )
}
for (const name in data) {
    let byproducts: Map<Item, Quantity> = new Map()
    for (const [byproduct, quantity] of Object.entries(data[name].byproducts)) {
        byproducts.set(items[byproduct], quantity as Quantity)
    }
    let ingredients: Map<Item, Quantity> = new Map()
    for (const [ingredient, quantity] of Object.entries(data[name].input)) {
        ingredients.set(items[ingredient], quantity as Quantity)
    }
    recipes[name] = recipe(
        items[name],
        data[name].outputQuantity,
        data[name].time,
        data[name].industry,
        byproducts,
        ingredients,
    )
}
export const ITEMS = items
export const RECIPES = recipes

/**
 * Containers sorted by capacity from smallest to largest
 */
export interface ContainerCapacity {
    name: string
    capacity: Liter
}
function containerCapacity(name: string, capacity: Liter): ContainerCapacity {
    return {
        name,
        capacity,
    }
}
export const CONTAINERS_ASCENDING_BY_CAPACITY: ContainerCapacity[] = [
    containerCapacity("Container XS", 1000),
    containerCapacity("Container S", 8000),
    containerCapacity("Container M", 64000),
    containerCapacity("Container L", 128000),
    containerCapacity("Container XL", 256000),
    containerCapacity("Expanded Container XL0", 512000),
]

/**
 * Get catalysts
 */
export const CATALYSTS = Object.values(ITEMS).filter(isCatalyst)
