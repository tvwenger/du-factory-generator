import { Item } from "../items"
import { Recipe } from "../recipes"

/** unit: item / minute */
export type ItemRate = number

export class ContainerNode {
    readonly producers = new Set<MachineNode>()
    readonly consumers = new Set<MachineNode>()

    get incomingLinkCount(): number {
        return this.producers.size
    }

    get outgoingLinkCount(): number {
        return this.consumers.size
    }

    static is(node: FactoryNode): node is ContainerNode {
        return node instanceof ContainerNode
    }

    getIngress(item: Item): ItemRate {
        return Array.from(this.producers)
            .map((producer) => producer.getOutput(item))
            .reduce((totalIngress, ingress) => totalIngress + ingress, 0)
    }

    getEgress(item: Item): ItemRate {
        return Array.from(this.consumers)
            .map((producer) => producer.getIntakeFrom(this, item))
            .reduce((totalEgress, egress) => totalEgress + egress, 0)
    }
}

export class MachineNode {
    readonly inputs = new Map<Item, ContainerNode>()
    output: ContainerNode | undefined = undefined

    constructor(readonly recipe: Recipe, readonly utilization: number) {}

    static is(node: FactoryNode): node is MachineNode {
        return node instanceof MachineNode
    }

    takeFrom(container: ContainerNode, item: Item) {
        this.inputs.set(item, container)
        container.consumers.add(this)
    }

    outputInto(container: ContainerNode) {
        if (this.output) {
            this.output.producers.delete(this)
        }

        this.output = container
        container.producers.add(this)
    }

    getIntake(item: Item): ItemRate {
        let quantity = 0
        for (const ingredient of this.recipe.ingredients) {
            if (ingredient.item === item) {
                quantity += ingredient.quantity
            }
        }
        return (this.utilization * quantity) / this.recipe.processingTime
    }

    getIntakeFrom(container: ContainerNode, item: Item): ItemRate {
        if (this.inputs.get(item) !== container) {
            return 0
        }
        return this.getIntake(item)
    }

    getOutput(item: Item): ItemRate {
        let quantity = 0
        for (const product of [...this.recipe.byproducts, this.recipe.product]) {
            if (product.item === item) {
                quantity += product.quantity
            }
        }
        return (this.utilization * quantity) / this.recipe.processingTime
    }
}

export type FactoryNode = ContainerNode | MachineNode

export class FactoryGraph extends Set<FactoryNode> {
    get machines(): Set<MachineNode> {
        return new Set(Array.from(this).filter(MachineNode.is))
    }

    get containers(): Set<ContainerNode> {
        return new Set(Array.from(this).filter(ContainerNode.is))
    }

    getConsumers(item: Item): Set<MachineNode> {
        return new Set(
            Array.from(this.machines).filter((node) =>
                node.recipe.ingredients.some((ingredient) => ingredient.item === item),
            ),
        )
    }

    getContainers(item: Item): Set<ContainerNode> {
        return new Set(
            Array.from(this.containers).filter(
                (node) => node.getEgress(item) > 0 || node.getIngress(item) > 0,
            ),
        )
    }
}
