import { items } from "./items"
import { buildFactory } from "./compute/factory"
import { enableMapSet } from "immer"
import {
    computeIdealMachineCount,
    computeThroughputs,
    ItemsFlow,
} from "./compute/ideal-machine-count"

enableMapSet()

Object.assign(window, {
    items,
    buildFactory,
    computeIdealMachineCount,
    computeThroughputs,
    ItemsFlow,
})

console.log(
    `
%cGenerate a factory (slow): 

// produce each item with two assemblers
const assemblyMachines = new Map([
    [items.adjuster_l, 2],
    [items.vertical_booster_l, 2],
    [items.retro_rocket_brake_l, 2],
])
buildFactory(assemblyMachines)
`,
    "color: #000099",
)

console.log(
    `
%cCompute the minimum number of machines required (fast):

const requiredOutput = new ItemsFlow()
// produce at least 2 of each in 32 minutes
requiredOutput.add(items.adjuster_l, 2 / 32)
requiredOutput.add(items.vertical_booster_l, 2 / 32)
requiredOutput.add(items.retro_rocket_brake_l, 2 / 32)
computeIdealMachineCount(computeThroughputs(requiredOutput))
`,
    "color: #880088",
)
