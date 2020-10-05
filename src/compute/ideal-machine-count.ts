import { isOre, Item } from "../items"
import { Batch, findRecipe, Recipe } from "../recipes"
import { ItemRate } from "./graph"

export class ItemsFlow extends Map<Item, ItemRate> {
    constructor(itemsStream?: ItemsFlow) {
        super()
        if (itemsStream) {
            this.add(itemsStream)
        }
    }

    add(itemStream: ItemsFlow): void
    add(item: Item, throughput: ItemRate): void
    add(itemOrStream: Item | ItemsFlow, throughput?: ItemRate): void {
        if (itemOrStream instanceof ItemsFlow) {
            for (const [item, throughput] of itemOrStream.entries()) {
                this.add(item, throughput)
            }
        } else {
            if (this.has(itemOrStream)) {
                this.set(itemOrStream, this.get(itemOrStream)! + throughput!)
            } else {
                this.set(itemOrStream, throughput!)
            }
        }
    }

    set(item: Item, throughput: ItemRate): this {
        if (throughput < 0) {
            throw new Error(`Throughput may not be less than 0. Was ${throughput}/min.`)
        } else if (throughput === 0) {
            this.delete(item)
        } else {
            super.set(item, throughput)
        }
        return this
    }

    covers(itemStream: ItemsFlow): boolean
    covers(item: Item, throughput: ItemRate): boolean
    covers(itemOrStream: Item | ItemsFlow, throughput?: ItemRate): boolean {
        if (itemOrStream instanceof ItemsFlow) {
            return Array.from(itemOrStream.entries()).every(([item, throughput]) =>
                this.covers(item, throughput),
            )
        } else {
            return this.has(itemOrStream) && this.get(itemOrStream)! >= throughput!
        }
    }

    subtract(itemStream: ItemsFlow): ItemsFlow
    subtract(item: Item, throughput: ItemRate): ItemRate
    subtract(itemOrStream: Item | ItemsFlow, throughput?: ItemRate): ItemRate | ItemsFlow {
        if (itemOrStream instanceof ItemsFlow) {
            const remainder = new ItemsFlow()
            for (const [item, throughput] of itemOrStream.entries()) {
                remainder.add(item, this.subtract(item, throughput))
            }
            return remainder
        } else {
            const value = this.get(itemOrStream) || 0
            const result = value - throughput!
            if (result < 0) {
                this.delete(itemOrStream)
                return -result
            } else {
                this.set(itemOrStream, result)
                return 0
            }
        }
    }
}

function computeDependentThroughputs(
    throughputs: ItemsFlow,
    dependentItemsGetter: (process: Recipe) => Batch[],
): ItemsFlow {
    const dependentThroughputs = new ItemsFlow()

    for (const [item, throughput] of throughputs.entries()) {
        if (!isOre(item)) {
            const process = findRecipe(item)
            for (const dependentItem of dependentItemsGetter(process)) {
                const dependentThroughput =
                    (dependentItem.quantity / process.product.quantity) * throughput

                dependentThroughputs.add(dependentItem.item, dependentThroughput)
            }
        }
    }

    return dependentThroughputs
}

function computeIngress(egress: ItemsFlow): ItemsFlow {
    return computeDependentThroughputs(egress, (process) => process.ingredients)
}

function computeByproductEgress(egress: ItemsFlow): ItemsFlow {
    return computeDependentThroughputs(egress, (process) => process.byproducts)
}

function computeAdditionalThroughputs(throughputs: ItemsFlow, minimumEgress: ItemsFlow): ItemsFlow {
    throughputs = new ItemsFlow(throughputs) // avoid mutating throughputs
    const additionalThroughputs = new ItemsFlow()
    let ingress = minimumEgress

    while (ingress.size > 0) {
        const remainingIngress = throughputs.subtract(ingress)
        additionalThroughputs.add(remainingIngress)
        ingress = computeIngress(remainingIngress)
    }

    return additionalThroughputs
}

export function computeThroughputs(minimumEgress: ItemsFlow): ItemsFlow {
    let throughputs = new ItemsFlow()
    let byproductEgress = new ItemsFlow()
    for (let i = 0; i < 1000; i++) {
        throughputs = computeAdditionalThroughputs(byproductEgress, minimumEgress)
        const updatedByproductsEgress = computeByproductEgress(throughputs)

        if (
            byproductEgress.covers(updatedByproductsEgress) &&
            updatedByproductsEgress.covers(byproductEgress)
        ) {
            break
        }

        byproductEgress = updatedByproductsEgress
    }

    return throughputs
}

export function computeIdealMachineCount(throughputs: ItemsFlow): Map<Item, [string, number]> {
    const machines = new Map<Item, [string, number]>()

    for (const [item, throughput] of throughputs.entries()) {
        if (!isOre(item)) {
            const process = findRecipe(item)
            machines.set(item, [
                process.producedWith.name,
                throughput / (process.product.quantity / process.processingTime),
            ])
        }
    }

    return machines
}
