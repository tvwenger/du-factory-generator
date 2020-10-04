import { isOre, Item } from "../items"
import { findRecipe } from "../recipes"

class ItemNode {
    readonly dependencies = new Set<ItemNode>()
    readonly dependents = new Set<ItemNode>()

    constructor(readonly item: Item) {}

    dependsOn(node: ItemNode) {
        this.dependencies.add(node)
        node.dependents.add(this)
    }

    destroy() {
        for (const dependent of this.dependents) {
            dependent.dependencies.delete(this)
        }
        for (const dependency of this.dependencies) {
            dependency.dependents.delete(this)
        }
    }
}

function buildDependencyGraph(finalProducts: Set<Item>): Map<Item, ItemNode> {
    const nodes = new Map<Item, ItemNode>()

    const todo = new Set(finalProducts)

    for (const item of todo) {
        if (isOre(item)) {
            continue
        }

        if (!nodes.has(item)) {
            nodes.set(item, new ItemNode(item))
        }
        const node = nodes.get(item)!

        const process = findRecipe(item)

        for (const dependent of [...process.ingredients, ...process.byproducts]) {
            if (!nodes.has(dependent.item)) {
                nodes.set(dependent.item, new ItemNode(dependent.item))
            }
            const dependentNode = nodes.get(dependent.item)!

            dependentNode.dependsOn(node)
        }

        process.ingredients.forEach((ingredient) => todo.add(ingredient.item))
    }

    return nodes
}

export function determineComputationOrder(finalProducts: Set<Item>): Item[] {
    const nodes = buildDependencyGraph(finalProducts)

    const order: Item[] = []

    const startNodes = Array.from(finalProducts).map((item) => nodes.get(item)!)
    const todo = new Set(startNodes)

    for (const node of todo) {
        todo.delete(node)

        for (const dependency of node.dependencies) {
            todo.add(dependency)
        }

        if (node.dependencies.size === 0) {
            order.push(node.item)

            for (const dependent of node.dependents) {
                todo.add(dependent)
            }

            node.destroy()
        }
    }

    return order
}
