import * as React from "react"
import { Button, Row, Col, InputNumber, Upload } from "antd"
import { Talent, TALENTS } from "../talents"
import { AppState, TalentState } from "./app"

/**
 * Parse JSON and set talent levels
 */
export function parseTalentLevelJSON(
    json: string,
    setTalentLevels: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
) {
    const data = JSON.parse(json) as { [key: string]: number }
    for (const [talent, level] of Object.entries(data)) {
        console.log(talent, level)
        setTalentLevels((prevState: { [key: string]: number }) => ({
            ...prevState,
            [talent]: level,
        }))
    }
}

/**
 * Properties of the SetTalents component
 */
interface SetTalentsProps {
    /**
     * Set the parent NewFactory state
     * @param state parent component state
     */
    setAppState: (state: AppState) => void

    // factory talents and levels
    talentLevels: { [key: string]: number }

    /**
     * Set the level for a given talent
     */
    setTalentLevels: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>

    /**
     * Set the TalentState
     */
    setTalentState: (state: TalentState) => void
}

/**
 * Set talent levels
 * @param props {@link SetTalentsProps}
 */
export function SetTalents(props: SetTalentsProps) {
    // Scroll to top on render
    React.useEffect(() => {
        window.scrollTo(0, 0)
    })

    return (
        <React.Fragment>
            <h2>Set talent levels:</h2>
            <ul>
                <li>Set talents of user who is placing and running industries.</li>
                <li>Talents are stored as a cookie in your browser.</li>
                <li>At the bottom of this page, you can download your talents as a JSON file.</li>
                <li>You may upload a JSON file that was previously exported from this page.</li>
            </ul>
            <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={(file) => {
                    const reader = new FileReader()
                    reader.onload = () => {
                        const result = reader.result as string
                        parseTalentLevelJSON(result, props.setTalentLevels)
                    }
                    reader.readAsText(file)
                    // skip upload
                    return false
                }}
            >
                <Button>Upload Talent JSON</Button>
            </Upload>
            <Row>
                <Col span={6}>Talent</Col>
                <Col span={3}>Level</Col>
            </Row>
            {Object.keys(TALENTS).map(function (talent) {
                // handle update of talent level state
                const setTalentLevels = (value: number) => {
                    props.setTalentLevels((prevState: { [key: string]: number }) => ({
                        ...prevState,
                        [talent]: value,
                    }))
                }
                return (
                    <React.Fragment key={talent}>
                        <MemorizedSetTalentsRow
                            setTalentLevels={setTalentLevels}
                            talent={TALENTS[talent]}
                            value={props.talentLevels[talent] || 0}
                        />
                    </React.Fragment>
                )
            })}
            <Button
                type="primary"
                onClick={() => {
                    // save as cookie that expires in 365 days
                    const date = new Date()
                    date.setTime(date.getTime() + 365 * 24 * 3600000)
                    document.cookie =
                        "talentLevels=" +
                        JSON.stringify(props.talentLevels) +
                        "; expires=" +
                        date.toUTCString() +
                        "; path=/; SameSite=Lax"
                    props.setTalentState(TalentState.SET)
                    props.setAppState(AppState.HOME)
                }}
            >
                Confirm
            </Button>
            <Button
                href={`data:text/json;charset=utf-8,${encodeURIComponent(
                    JSON.stringify(props.talentLevels),
                )}`}
                download="talents.json"
            >
                Download Talents as JSON
            </Button>
        </React.Fragment>
    )
}

/**
 * Properties of the SetTalentRow
 */
interface SetTalentRowProps {
    setTalentLevels: (value: number) => void
    talent: Talent
    value: number
}

/**
 * Single row of the talent table
 */
function SetTalentsRow(props: SetTalentRowProps) {
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
                        props.setTalentLevels(Number(value))
                    }
                />
            </Col>
        </Row>
    )
}
function sameRow(oldProps: SetTalentRowProps, newProps: SetTalentRowProps) {
    return oldProps.value === newProps.value
}
const MemorizedSetTalentsRow = React.memo(SetTalentsRow, sameRow)
