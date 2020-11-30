import { Item } from "../items"
import * as React from "react"
import { useMemo } from "react"
import { compose, groupBy, indexBy, prop, toPairs } from "ramda"
import { TreeSelect } from "antd"

/**
 * Properties of the {@link ItemSelect} component
 */
export interface ItemSelectProps<T extends Item> {
    /**
     * All selectable items
     */
    items: T[]

    /**
     * The currently selected items
     */
    value: T[]

    /**
     * Callback function when the selection changes
     * @param selection
     */
    onChange: (selection: T[]) => void
}

/**
 * Tree select component for selecting items.
 * @param props {@link ItemSelectProps}
 */
export function ItemSelect<T extends Item>(props: ItemSelectProps<T>) {
    const treeData = useItemTreeData(props.items)
    const [value, fromValue] = useItemSelection(props.items, props.value)

    return (
        <TreeSelect
            style={{ width: "100%" }}
            value={value}
            dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
            treeData={treeData}
            placeholder="Please select"
            multiple
            allowClear
            showArrow
            treeCheckable
            onChange={compose(props.onChange, fromValue)}
        />
    )
}

/**
 * Hook for grouping items into a tree based on their category for the use in {@link TreeSelect}
 * @param items all items to group
 */
function useItemTreeData<T extends Item>(items: T[]) {
    return useMemo(() => {
        const byCategory = groupBy(prop("category"), items)

        return toPairs(byCategory).map(([category, items]) => ({
            title: category,
            value: category,
            children: items.map((item) => ({
                title: item.name,
                value: item.name,
            })),
        }))
    }, [items])
}

/**
 * Hook for mapping a selection of items to strings and back
 * @param items All selectable items
 * @param selection The currently selected items
 */
function useItemSelection<T extends Item>(items: T[], selection: T[]) {
    const byName = useMemo(() => indexBy(prop("name"), items), [items])

    const value = useMemo(() => selection.map(prop("name")), [selection])

    const fromValue = (itemNames: string[]) =>
        itemNames.map((itemName) => byName[itemName]).filter((item) => item !== undefined)

    return [value, fromValue] as const
}
