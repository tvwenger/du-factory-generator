import {Category, SubCategory, Tier} from "./items"

export enum TalentType {
    TIME = "Time",
    INPUT = "Input",
    OUTPUT = "Output",
}

export enum TalentSubject {
    TIER = "Tier",
    ITEM = "Item",
    INDUSTRY = "Industry",
    TYPE = "Type",
}

export enum TalentGroup {
    PURES = "Pures",
    PRODUCTS = "Products",
    PARTS = "Parts",
    ELEMENTS = "Elements",
    AMMUNITION = "Ammunition",
    FUELS = "Fuels",
    PURE_HONECOMBS = "Pure Honeycombs",
    PRODUCT_HONEYCOMBS = "Product Honeycombs",
    SCRAPS = "Scraps",
    INDUSTRY = "Industry",
}

/**
 * Talent type definition
 */
export interface Talent {
    readonly name: string
    readonly skillGroup: string
    readonly talentGroup: TalentGroup
    readonly type: TalentType
    readonly subject: TalentSubject
    readonly modifier: number
    readonly target: string | undefined
    readonly targetCategory: Category
    readonly targetSubCategory: SubCategory
    readonly targetTier: Tier
}

/**
 * Returns a new Talent
 * @param name talent name
 * @param skillGroup skill's group name
 * @param talentGroup skill's talent group
 * @param type talent type
 * @param subject entity to which this talent applies
 * @param modifier modifier amount (percentage)
 * @param target talent's applicable item
 * @param targetCategory talent's applicable category
 * @param targetSubCategory talent's applicable sub-category
 * @param targetTier talent's applicable tier
 */
export function talent(
    name: string,
    skillGroup: string,
    talentGroup: TalentGroup,
    type: TalentType,
    subject: TalentSubject,
    modifier: number,
    target: string,
    targetCategory: Category,
    targetSubCategory: SubCategory,
    targetTier: Tier,
): Talent {
    return {
        name,
        skillGroup,
        talentGroup,
        type,
        subject,
        modifier,
        target,
        targetCategory,
        targetSubCategory,
        targetTier,
    }
}

/**
 * Load talent data
 */
var talents: { [key: string]: Talent } = {}
var data = require("./data/talents.json")
for (const outer of data) {
    for (const inner of outer.data) {
        for (const skill of inner.skills) {
            const name = inner.name + ": " + skill.name
            talents[name] = talent(
                name,
                inner.name,
                outer.name,
                skill.class !== undefined ? skill.class : inner.class,
                skill.subject !== undefined ? skill.subject : inner.subject,
                skill.amount !== undefined ? skill.amount : inner.amount,
                skill.name !== undefined ? skill.name : inner.name,
                skill.type !== undefined ? skill.type : inner.type,
                skill.subtype !== undefined ? skill.subtype : inner.subtype,
                skill.tier !== undefined ? skill.tier : inner.tier,
            )
        }
    }
}
// Validate
for (const [name, talent] of Object.entries(talents)) {
    if (!Object.values(TalentType).includes(talent.type)) {
        throw new Error("Invalid talent type " + talent.type)
    }
    if (!Object.values(TalentSubject).includes(talent.subject)) {
        throw new Error("Invalid talent subject " + talent.subject)
    }
    if (!Object.values(TalentGroup).includes(talent.talentGroup)) {
        throw new Error("Invalid talent group " + talent.talentGroup)
    }
}
export const TALENTS = talents
