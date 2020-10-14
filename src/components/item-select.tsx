import { Item } from "../items"
import * as React from "react"
import { useMemo } from "react"
import { compose, groupBy, indexBy, prop, toPairs } from "ramda"
import { TreeSelect } from "antd"

export interface ItemSelectProps<T extends Item> {
    items: T[]
    selection: T[]
    onSelection: (selection: T[]) => void
}

export function ItemSelect<T extends Item>({ items, selection, onSelection }: ItemSelectProps<T>) {
    const { treeData, value, fromValue } = useTreeData(items, selection)

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
            onChange={compose(onSelection, fromValue)}
        />
    )
}

function useTreeData<T extends Item>(items: T[], selection: T[]) {
    const treeData = useMemo(() => {
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

    const value = useMemo(() => selection.map((item) => item.name), [selection])

    const fromValue = useMemo(() => {
        const byName = indexBy(prop("name"), items)

        return (itemNames: string[]) =>
            itemNames.map((itemName) => byName[itemName]).filter((item) => item !== undefined)
    }, [items])

    return { treeData, value, fromValue }
}
