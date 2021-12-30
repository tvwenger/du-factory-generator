import * as React from "react"
import { Button, Row, Col, InputNumber } from "antd"
import { Talent, TalentSubject } from "../talents"
import { FactoryGraph } from "../graph"
import { FactoryState } from "./factory"

/**
 * Properties of the FactoryTalents component
 */
interface FactoryTalentsProps {
    /**
     * Set the parent NewFactory state
     * @param state parent component state
     */
    setFactoryState: (state: FactoryState) => void

    // factory talents
    talents: { [key: string]: Talent }

    /**
     * Set the level for a given talent
     * @param talent Talent to set the level
     */
    setTalentLevel: (talent: Talent, level: number) => void

    /**
     * Get the level for a given talent
     * @param talent Talent to get level
     */
    getTalentLevel: (talent: Talent) => number

    // the current FactoryGraph
    factory: FactoryGraph | undefined

    /**
     * Set the factory graph
     * @param factory the FactoryGraph
     */
    setFactory: (factory: FactoryGraph) => void
}

/**
 * Set talent levels
 * @param props {@link FactoryTalentsProps}
 */
export function FactoryTalents(props: FactoryTalentsProps) {
    return (
        <React.Fragment>
            <h2>Set talent levels:</h2>
            <Row>
                <Col span={6}>Talent</Col>
                <Col span={3}>Level</Col>
            </Row>
            {Object.keys(props.talents).map(function (talent) {
                return (
                    <React.Fragment key={talent}>
                        <MemorizedFactoryTalentsRow
                            setTalentLevel={props.setTalentLevel}
                            talent={props.talents[talent]}
                            value={props.getTalentLevel(props.talents[talent])}
                        />
                    </React.Fragment>
                )
            })}
            <Button
                type="primary"
                onClick={() => {
                    props.setFactoryState(FactoryState.SELECT)
                }}
            >
                Next
            </Button>
        </React.Fragment>
    )
}

/**
 * Properties of the FactoryTalentRow
 */
interface FactoryTalentRowProps {
    setTalentLevel: (talent: Talent, value: number) => void
    talent: Talent
    value: number
}

/**
 * Single row of the talent table
 */
function FactoryTalentsRow(props: FactoryTalentRowProps) {
    return (
        <Row>
            <Col span={6}>
                <label>{props.talent.name}</label>
            </Col>
            <Col span={3}>
                <InputNumber
                    min={0}
                    max={5}
                    value={props.value}
                    onChange={(value: string | number | undefined) =>
                        props.setTalentLevel(props.talent, Number(value))
                    }
                />
            </Col>
        </Row>
    )
}
function sameRow(oldProps: FactoryTalentRowProps, newProps: FactoryTalentRowProps) {
    return oldProps.value === newProps.value
}
const MemorizedFactoryTalentsRow = React.memo(FactoryTalentsRow, sameRow)
