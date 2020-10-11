export type Liter = number
export type Minutes = number
export type Quantity = number

export type Item = Machine | Container | Ore | Other

export enum ItemType {
    MACHINE = "machine",
    CONTAINER = "container",
    ORE = "ore",
    OTHER = "product",
}

export interface Container extends CommonProperties {
    readonly type: ItemType.CONTAINER
}

export interface Machine extends CommonProperties {
    readonly type: ItemType.MACHINE
}

export interface Other extends CommonProperties {
    readonly type: ItemType.OTHER
}

export interface Ore extends CommonProperties {
    readonly type: ItemType.ORE
}

export interface CommonProperties {
    readonly name: string
    readonly volume: Liter
}

export function other(name: string, volume: Liter): Other {
    return {
        type: ItemType.OTHER,
        name,
        volume,
    }
}

export function machine(name: string, volume: Liter): Machine {
    return {
        type: ItemType.MACHINE,
        name,
        volume,
    }
}

export function isMachine(item: Item): item is Machine {
    return item.type === ItemType.MACHINE
}

export function container(name: string, volume: Liter): Container {
    return {
        type: ItemType.CONTAINER,
        name,
        volume,
    }
}

export function isContainer(item: Item): item is Container {
    return item.type === ItemType.CONTAINER
}

export function ore(name: string): Ore {
    return {
        type: ItemType.ORE,
        name,
        volume: 1,
    }
}

export function isOre(item: Item): item is Ore {
    return item.type === ItemType.ORE
}

export const items = {
    vertical_booster_l: other("Vertical booster L", 562.4),
    adjuster_l: other("Adjuster L", 619.2),
    retro_rocket_brake_l: other("Retro-rocket brake L", 562.4),
    atmospheric_airbrake_l: other("Atmospheric airbrake L", 619.2),

    basic_hydraulics: other("Basic hydraulics", 10),
    basic_mobile_panel_m: other("Basic mobile panel M", 259.2),

    basic_standard_frame_m: other("Basic standard frame M", 74),
    basic_pipe: other("Basic pipe", 1),
    basic_screw: other("Basic screw", 1),
    basic_burner: other("Basic burner", 10),
    basic_ionic_chamber_m: other("Basic ionic chamber M", 202.4),
    basic_connector: other("Basic connector", 0.8),
    basic_injector: other("Basic injector", 10),
    basic_gaz_cylinder_m: other("Basic gaz cylinder M", 259.2),

    al_fe_alloy: other("Al-Fe alloy", 1),
    silumin: other("Silumin", 1),
    steel: other("Steel", 1),

    polycarbonate_plastic: other("Polycarbonate plastic", 1),

    pure_aluminium: other("Pure aluminium", 1),
    pure_silicon: other("Pure silicon", 1),
    pure_iron: other("Pure iron", 1),
    pure_carbon: other("Pure carbon", 1),

    pure_oxygen: ore("Pure oxygen"), // TODO
    pure_hydrogen: ore("Pure hydrogen"), // TODO

    bauxite: ore("Bauxite"),
    quarz: ore("Quarz"),
    hematite: ore("Hematite"),
    coal: ore("Coal"),

    smelter_m: machine("Smelter M", 499.2),
    refiner_m: machine("Refiner M", 479.2),
    metalwork_industry_m: machine("Metalwork industry M", 599.2),
    assembly_line_m: machine("Assembly line M", 599.2),
    assembly_line_l: machine("Assembly line L", 3255.4),
    chemical_industry_m: machine("Chemical industry M", 479.2),
    electronic_industry_m: machine("Electronical industry M", 459.2),
    "3d_prnter_m": machine("3D printer M", 609.2),
}
