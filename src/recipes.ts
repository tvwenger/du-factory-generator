import { Item, items, Machine, Minutes, Ore, Quantity } from "./items"

export interface Batch {
    readonly item: Item
    readonly quantity: Quantity
}

export interface Recipe {
    readonly product: Batch
    readonly byproducts: Batch[]
    readonly ingredients: Batch[]
    readonly producedWith: Machine
    readonly processingTime: Minutes
}

export function batch(item: Item, quantity: Quantity): Batch {
    return {
        item,
        quantity,
    }
}

export const recipes: Recipe[] = [
    {
        product: batch(items.adjuster_l, 1),
        byproducts: [],
        ingredients: [
            batch(items.basic_pipe, 36),
            batch(items.basic_injector, 25),
            batch(items.basic_gaz_cylinder_m, 1),
            batch(items.basic_standard_frame_m, 1),
        ],
        producedWith: items.assembly_line_m,
        processingTime: 32,
    },
    {
        product: batch(items.vertical_booster_l, 1),
        byproducts: [],
        ingredients: [
            batch(items.basic_pipe, 36),
            batch(items.basic_injector, 25),
            batch(items.basic_ionic_chamber_m, 1),
            batch(items.basic_standard_frame_m, 1),
        ],
        producedWith: items.assembly_line_m,
        processingTime: 32,
    },
    {
        product: batch(items.basic_injector, 3),
        byproducts: [],
        ingredients: [batch(items.polycarbonate_plastic, 18), batch(items.basic_screw, 12)],
        producedWith: items["3d_prnter_m"],
        processingTime: 3,
    },
    {
        product: batch(items.polycarbonate_plastic, 75),
        byproducts: [],
        ingredients: [batch(items.pure_carbon, 100), batch(items.pure_hydrogen, 50)],
        producedWith: items.chemical_industry_m,
        processingTime: 3,
    },
    {
        product: batch(items.atmospheric_airbrake_l, 1),
        byproducts: [],
        ingredients: [
            batch(items.basic_pipe, 36),
            batch(items.basic_hydraulics, 25),
            batch(items.basic_mobile_panel_m, 1),
            batch(items.basic_standard_frame_m, 1),
        ],
        producedWith: items.assembly_line_m,
        processingTime: 32,
    },
    {
        product: batch(items.basic_pipe, 10),
        byproducts: [],
        ingredients: [batch(items.silumin, 10)],
        producedWith: items.metalwork_industry_m,
        processingTime: 2,
    },
    {
        product: batch(items.basic_hydraulics, 3),
        byproducts: [],
        ingredients: [batch(items.basic_pipe, 12), batch(items.steel, 18)],
        producedWith: items.metalwork_industry_m,
        processingTime: 3,
    },
    {
        product: batch(items.basic_mobile_panel_m, 1),
        byproducts: [],
        ingredients: [batch(items.silumin, 49), batch(items.basic_screw, 25)],
        producedWith: items.metalwork_industry_m,
        processingTime: 9,
    },
    {
        product: batch(items.basic_screw, 10),
        byproducts: [],
        ingredients: [batch(items.steel, 10)],
        producedWith: items.metalwork_industry_m,
        processingTime: 2,
    },
    {
        product: batch(items.basic_standard_frame_m, 1),
        byproducts: [],
        ingredients: [batch(items.silumin, 74)],
        producedWith: items.metalwork_industry_m,
        processingTime: 6,
    },
    {
        product: batch(items.steel, 75),
        byproducts: [],
        ingredients: [batch(items.pure_iron, 100), batch(items.pure_carbon, 50)],
        producedWith: items.smelter_m,
        processingTime: 3,
    },
    {
        product: batch(items.silumin, 75),
        byproducts: [],
        ingredients: [batch(items.pure_aluminium, 100), batch(items.pure_silicon, 50)],
        producedWith: items.smelter_m,
        processingTime: 3,
    },
    {
        product: batch(items.pure_silicon, 360),
        byproducts: [batch(items.pure_oxygen, 120)],
        ingredients: [batch(items.quarz, 520)],
        producedWith: items.refiner_m,
        processingTime: 3,
    },
    {
        product: batch(items.pure_carbon, 360),
        byproducts: [batch(items.pure_oxygen, 60), batch(items.pure_hydrogen, 60)],
        ingredients: [batch(items.coal, 520)],
        producedWith: items.refiner_m,
        processingTime: 3,
    },
    {
        product: batch(items.pure_aluminium, 360),
        byproducts: [batch(items.pure_hydrogen, 120)],
        ingredients: [batch(items.bauxite, 520)],
        producedWith: items.refiner_m,
        processingTime: 3,
    },
    {
        product: batch(items.pure_iron, 360),
        byproducts: [batch(items.pure_oxygen, 120)],
        ingredients: [batch(items.hematite, 520)],
        producedWith: items.refiner_m,
        processingTime: 3,
    },
    {
        product: batch(items.al_fe_alloy, 75),
        byproducts: [],
        ingredients: [batch(items.pure_aluminium, 100), batch(items.pure_carbon, 50)],
        producedWith: items.smelter_m,
        processingTime: 3,
    },
    {
        product: batch(items.basic_connector, 10),
        byproducts: [],
        ingredients: [batch(items.al_fe_alloy, 10)],
        producedWith: items.electronic_industry_m,
        processingTime: 2,
    },
    {
        product: batch(items.basic_ionic_chamber_m, 1),
        byproducts: [],
        ingredients: [batch(items.steel, 49), batch(items.basic_connector, 25)],
        producedWith: items.metalwork_industry_m,
        processingTime: 9,
    },
    {
        product: batch(items.basic_burner, 3),
        byproducts: [],
        ingredients: [batch(items.silumin, 18), batch(items.basic_screw, 12)],
        producedWith: items.metalwork_industry_m,
        processingTime: 3,
    },
    {
        product: batch(items.retro_rocket_brake_l, 1),
        byproducts: [],
        ingredients: [
            batch(items.basic_screw, 36),
            batch(items.basic_burner, 25),
            batch(items.basic_ionic_chamber_m, 1),
            batch(items.basic_standard_frame_m, 1),
        ],
        producedWith: items.assembly_line_m,
        processingTime: 32,
    },
    {
        product: batch(items.basic_gaz_cylinder_m, 1),
        byproducts: [],
        ingredients: [batch(items.silumin, 49), batch(items.basic_screw, 25)],
        producedWith: items.metalwork_industry_m,
        processingTime: 9,
    },
]

export function findRecipe(item: Exclude<Item, Ore>): Recipe {
    const recipe = recipes.find((process) => process.product.item === item)
    if (recipe) {
        return recipe
    } else {
        throw new Error(`No recipe found for product "${item.name}".`)
    }
}
