import * as React from "react"
import { useMemo, useState } from "react"
import { isCraftable, Item, ITEMS } from "../items"
import { values } from "ramda"
import { ItemSelect } from "./item-select"

/**
 * Root component of the app
 */
export function App() {
    const [selection, setSelection] = useState<Item[]>([])

    const items = useMemo(() => values(ITEMS).filter(isCraftable), [ITEMS])

    return <ItemSelect items={items} selection={selection} onSelection={setSelection} />
}
