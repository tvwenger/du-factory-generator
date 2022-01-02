import * as React from "react"
import { Button, Row, Col, Upload, Space } from "antd"
import { PlusOutlined, MinusOutlined } from "@ant-design/icons"
import { Talent, TALENTS, TalentGroup } from "../talents"
import { AppState, TalentState } from "./app"

const TALENT_GROUPS: { [key: string]: Set<string> } = {}
Object.values(TalentGroup).map((group) => {
    TALENT_GROUPS[group] = new Set()
    Object.values(TALENTS)
        .filter((talent) => talent.talentGroup == group)
        .map((talent) => {
            TALENT_GROUPS[group].add(talent.skillGroup)
        })
})

/**
 * Parse JSON and set talent levels
 */
export function parseTalentLevelJSON(
    json: string,
    setTalentLevels: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
) {
    const data = JSON.parse(json) as { [key: string]: number }
    for (const [talent, level] of Object.entries(data)) {
        setTalentLevels((prevState: { [key: string]: number }) => ({
            ...prevState,
            [talent]: level,
        }))
    }
}

/**
 * Single row of the talent table
 */
interface SetTalentRowProps {
    setTalentLevels: (value: number) => void
    talent: Talent
    value: number
}
function SetTalentsRow(props: SetTalentRowProps) {
    const label = props.talent.name.split(": ")[1]
    return (
        <div className="setTalent">
            <Row>
                <Col span={12}>
                    <label>{label}</label>
                </Col>
                <Col span={12}>
                    {[...Array(6)].map((_, i) => {
                        let type = "default"
                        if (i === props.value) {
                            type = "primary"
                        } else if (i > props.value) {
                            type = "dashed"
                        }
                        return (
                            <Button
                                key={props.talent.name + i}
                                type={
                                    props.value === i
                                        ? "primary"
                                        : props.value < i
                                        ? "dashed"
                                        : "default"
                                }
                                onClick={() => props.setTalentLevels(i)}
                            >
                                {i}
                            </Button>
                        )
                    })}
                </Col>
            </Row>
        </div>
    )
}
function sameRow(oldProps: SetTalentRowProps, newProps: SetTalentRowProps) {
    return oldProps.value === newProps.value
}
const MemorizedSetTalentsRow = React.memo(SetTalentsRow, sameRow)

/**
 * Single skill group of the talent table
 */
interface SkillGroupProps {
    skillGroup: string
    setTalentLevels: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>
    children?: JSX.Element | JSX.Element[]
}
function SkillGroup(props: SkillGroupProps) {
    const [selected, setSelected] = React.useState<boolean>(false)
    return (
        <React.Fragment>
            <div className="skillGroup" onClick={() => setSelected(!selected)}>
                {selected ? <MinusOutlined /> : <PlusOutlined />}
                {props.skillGroup}
            </div>
            {selected ? props.children : ""}
        </React.Fragment>
    )
}

/**
 * Single talent group of the talent table
 */
interface TalentGroupCompProps {
    talentGroup: string
    setTalentLevels: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>
    children?: JSX.Element | JSX.Element[]
}
function TalentGroupComp(props: TalentGroupCompProps) {
    const [selected, setSelected] = React.useState<boolean>(false)
    return (
        <React.Fragment>
            <div className="talentGroup" onClick={() => setSelected(!selected)}>
                {selected ? <MinusOutlined /> : <PlusOutlined />}
                {props.talentGroup}
            </div>
            {selected ? props.children : ""}
        </React.Fragment>
    )
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
            {Object.keys(TALENT_GROUPS).map(function (talentGroup) {
                return (
                    <TalentGroupComp
                        key={"talentGroup: " + talentGroup}
                        talentGroup={talentGroup}
                        setTalentLevels={props.setTalentLevels}
                    >
                        {Array.from(TALENT_GROUPS[talentGroup]).map(function (skillGroup) {
                            return (
                                <SkillGroup
                                    key={"skillGroup: " + skillGroup}
                                    skillGroup={skillGroup}
                                    setTalentLevels={props.setTalentLevels}
                                >
                                    {Object.values(TALENTS)
                                        .filter((talent) => talent.skillGroup === skillGroup)
                                        .map(function (talent) {
                                            const setTalentLevels = (value: number) => {
                                                props.setTalentLevels(
                                                    (prevState: { [key: string]: number }) => ({
                                                        ...prevState,
                                                        [talent.name]: value,
                                                    }),
                                                )
                                            }
                                            return (
                                                <MemorizedSetTalentsRow
                                                    key={"talent: " + talent.name}
                                                    setTalentLevels={setTalentLevels}
                                                    talent={talent}
                                                    value={props.talentLevels[talent.name] || 0}
                                                />
                                            )
                                        })}
                                </SkillGroup>
                            )
                        })}
                    </TalentGroupComp>
                )
            })}
            <br />
            <Space>
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
            </Space>
        </React.Fragment>
    )
}

function expandTalentGroup(talentGroup: string) {}
