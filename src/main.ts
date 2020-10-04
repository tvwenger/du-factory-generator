import { items } from "./items"
import { buildFactory } from "./compute/factory"
import { enableMapSet } from "immer"

enableMapSet()

console.log(
    buildFactory(
        new Map([
            [items.adjuster_l, 2],
            [items.vertical_booster_l, 2],
            [items.retro_rocket_brake_l, 2],
        ]),
    ),
)
