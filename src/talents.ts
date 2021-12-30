import { Category, Tier } from "./items"

export enum TalentType {
    TIME = "time",
    EFFICIENCY = "efficiency",
    PRODUCTIVITY = "productivity",
}

export enum TalentSubject {
    TIER = "tier",
    ITEM = "item",
    INDUSTRY = "industry",
}

/**
 * Talent type definition
 */
export interface Talent {
    readonly name: string
    readonly group: string
    readonly type: TalentType
    readonly subject: TalentSubject
    readonly modifier: Number
    readonly category: Category
    readonly tier: Tier
    readonly target: string | undefined
}

/**
 * Returns a new Talent
 * @param name talent name
 * @param group talent group name
 * @param type talent type
 * @param subject entity to which this talent applies
 * @param modifier modifier amount (percentage)
 * @param category talent's applicable category
 * @param tier talent's applicable tier
 * @param target talent's applicable item
 */
export function talent(
    name: string,
    group: string,
    type: TalentType,
    subject: TalentSubject,
    modifier: number,
    category: Category,
    tier: Tier,
    target: string,
): Talent {
    return {
        name,
        group,
        type,
        subject,
        modifier,
        category,
        tier,
        target,
    }
}

/**
 * Load talent data
 */
var talents: { [key: string]: Talent } = {}
var data = require("./data/talents.json")
for (const outer of data) {
    for (const inner of outer.data) {
        const group = inner.name
        for (const skill of inner.skills) {
            const name = inner.name + ": " + skill.name
            talents[name] = talent(
                name,
                group,
                skill.class !== undefined ? skill.class : inner.class,
                skill.subject !== undefined ? skill.subject : inner.subject,
                skill.amount !== undefined ? skill.amount : inner.amount,
                skill.type !== undefined ? skill.type : inner.type,
                skill.tier !== undefined ? skill.tier : inner.tier,
                skill.name !== undefined ? skill.name : inner.name,
            )
        }
    }
}
export const TALENTS = talents
