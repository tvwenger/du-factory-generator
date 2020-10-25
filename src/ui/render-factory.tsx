var joint = require("jointjs")
import { FactoryGraph } from "../graph"

export class FactoryVisualGraph {
    el = document.getElementById("graph")!
    graph = joint.dia.Graph()
    paper = new joint.dia.Paper({
        el: this.el,
        model: this.graph,
        width: this.el.clientWidth,
        height: this.el.clientHeight,
        gridSize: 1,
        interactive: false,
    })

    constructor(readonly factory: FactoryGraph) {
        var isDragged = false
        var dragStartPosition = { x: 0, y: 0 }
        this.paper.on("blank:pointerdown", function (event: MouseEvent, x: number, y: number) {
            isDragged = true
            dragStartPosition = { x: x, y: y }
        })
        this.paper.on("cell:pointerup blank:pointerup", function (
            cellView: any,
            x: number,
            y: number,
        ) {
            isDragged = false
        })
        const vis = this
        this.el.addEventListener("mousemove", function (event: MouseEvent) {
            if (isDragged) {
                vis.paper.translate(
                    event.offsetX - dragStartPosition.x,
                    event.offsetY - dragStartPosition.y,
                )
            }
        })
    }

    destroy() {
        this.graph.clear()
        this.paper.remove()
    }

    render() {
        if (this.factory === undefined) {
            return
        }
        this.graph.clear()
        var x = 10
        var y = 10
        /** Loop over containers */
        for (const container of this.factory.containers) {
            console.log(container.name)
            /* Add container */
            var containerRect = new joint.shapes.standard.Rectangle({
                position: { x: x, y: y },
                size: { width: 50, height: 50 },
            })
            containerRect.attr({
                body: {
                    fill: "white",
                },
                label: {
                    text: container.name,
                    fill: "black",
                },
            })
            containerRect.addTo(this.graph)
            y += 60
            if (y > 600) {
                y = 10
                x += 60
            }
        }
    }
}
