import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/esm/Card';
import Form from 'react-bootstrap/Form';
import { SceneSummary } from '../models/SceneSummary';
import db from '../utils/Db';
import { characterPerceptionAgent } from '../agents/CharacterPerceptionAgent';
import { Chub } from '../accessor/Chub';
import { getAiCompletions } from '../PropsTransformer/AiAgentsTransformer';
import { AiCompletion } from '../accessor/AiCompletion';

interface EditSceneModalProps {
    show: string | null;
    onHide: () => void;
    sceneSummary: SceneSummary;
    onSave: (newSummary: SceneSummary, key: string) => void;
    summarizeScene: (key: string) => void;
}

let ais: {[key: string]: AiCompletion} = {};

let rawSetting = localStorage.getItem('settings');
if(rawSetting) {
    let settings = JSON.parse(rawSetting).settings;
    if(settings?.apis) {
        ais = getAiCompletions(settings);
    }
}

let aiAgent = new characterPerceptionAgent(ais.mars);

const EditSceneModal: React.FC<EditSceneModalProps> = ({ show, onHide, sceneSummary, onSave, summarizeScene }) => {
    const [newSceneSummary, setNewSceneSummary] = useState<SceneSummary>(Object.assign({}, sceneSummary));

    useEffect(() => {
        if (show) setNewSceneSummary(Object.assign({}, sceneSummary));
    }, [show, sceneSummary]);

    function saveAndClose() {
        onSave(newSceneSummary, show!);
        onHide();
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof SceneSummary) => {
        setNewSceneSummary({ ...newSceneSummary, [field]: e.target.value });
    };

    const handleArrayChange = (value: string, field: keyof SceneSummary, delimiter=",") => {
        setNewSceneSummary({ ...newSceneSummary, [field]: value.split(delimiter).map(item => item.trim()) });
    };

    function handleJSONChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof SceneSummary): void {
        try {
            setNewSceneSummary({ ...newSceneSummary, [field]: JSON.parse(e.target.value) });
        } catch (err) {
            console.error(err);
        }
    }

    async function updateCharacterPerception(scenePath: string): Promise<void> {
        let [messages, scenes] = await Promise.all([db.messages.toArray(), db.scenes.toArray()]);
        let scenesList = messages.map(m => m.scenes.join(','))
            .reduce((acc, val) => acc.includes(val) ? acc : acc.concat(val), [] as string[]);
        scenesList = scenesList.slice(0, scenesList.indexOf(scenePath));
        let characterPerceptionBefore: {[key: string]: {[key2: string]: string}} = {};
        for(let s of scenesList) {
            let scene = scenes.find(sc => sc.scenePath === s);
            if(scene && scene.characterPerception) {
                for(let c in scene.characterPerception) {
                    if(!characterPerceptionBefore[c]) characterPerceptionBefore[c] = {};
                    for(let c2 in scene.characterPerception[c]) {
                        characterPerceptionBefore[c][c2] = scene.characterPerception[c][c2];
                    }
                }
            }
        }
        
        let messagesInScene = messages.filter(m => m.scenes.join(',') === scenePath);
        let currentScene = scenes.find(s => s.scenePath === scenePath);
        let charactersInScene = messagesInScene.map(m => m.sender)
                                    .reduce((acc, val) => acc.includes(val) ? acc : acc.concat(val), [] as string[])
                                    .map(c=> c == 'user' ? c : c.split(':')[1]);
        let messagesInAllScene = messages.filter(m => (m.scenes.join(',') === scenePath) || (m.scenes.join(',').startsWith(scenePath+",")));
        let charactersInAllScene = messagesInAllScene.map(m => m.sender)
                                    .reduce((acc, val) => acc.includes(val) ? acc : acc.concat(val), [] as string[])
                                    .map(c=> c == 'user' ? c : c.split(':')[1]);

        let newCharacterPerception: {[key: string]: {[key2: string]: string}} = {};
        for(let c of charactersInScene) {
            if(c.trim() == 'user') continue;
            for(let c2 of charactersInAllScene) {
                if(c2.trim() == c.trim()) continue;
                let response = await aiAgent.getPerception(c, c2, characterPerceptionBefore, messagesInScene);
                if(!newCharacterPerception[c]) newCharacterPerception[c] = {};
                newCharacterPerception[c][c2] = response;
            }
        }

        setNewSceneSummary({ ...newSceneSummary, 'characterPerception': newCharacterPerception });
    }

    return (
        <Modal show={show != null} onHide={onHide} size="lg" style={{ width: '100%', maxWidth: 'none' }}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Scene: {show}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Card>
                    <Card.Body>
                        <Form>

                            {/* Summary */}
                            <Form.Group>
                                <Form.Label>Summary</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={10}
                                    value={newSceneSummary.summary || ''}
                                    onChange={(e) => handleInputChange(e, 'summary')}
                                />
                                <Button variant="primary" onClick={() => summarizeScene(show!)}>Summarize</Button>
                            </Form.Group>

                            {/* Characters */}
                            <Form.Group>
                                <Form.Label>Characters</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newSceneSummary.characters?.join(", ") || ''}
                                    onChange={(e) => handleArrayChange(e.target.value, 'characters')}
                                    placeholder="Enter characters separated by commas"
                                />
                            </Form.Group>

                            {/* Scene GuideLines */}
                            <Form.Group>
                                <Form.Label>Scene GuideLines</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={JSON.stringify(newSceneSummary.sceneGuideLines) || ''}
                                    onChange={(e) => handleJSONChange(e, 'sceneGuideLines')}
                                />
                            </Form.Group>

                            {/* Scene Behavior Changes */}
                            <Form.Group>
                                <Form.Label>Scene Behavior Changes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={JSON.stringify(newSceneSummary.sceneBehaviorChanges) || ''}
                                    onChange={(e) => handleInputChange(e, 'sceneBehaviorChanges')}
                                />
                            </Form.Group>

                            {/* Scene Property Changes */}
                            <Form.Group>
                                <Form.Label>Scene Property Changes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={JSON.stringify(newSceneSummary.scenePropertyChanges) || ''}
                                    onChange={(e) => handleInputChange(e, 'scenePropertyChanges')}
                                />
                            </Form.Group>

                            {/* Scene Scenario Changes */}
                            <Form.Group>
                                <Form.Label>Scene Scenario Changes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={JSON.stringify(newSceneSummary.sceneScenarioChanges) || ''}
                                    onChange={(e) => handleInputChange(e, 'sceneScenarioChanges')}
                                />
                            </Form.Group>

                            {/* characterPerception Changes */}
                            <Form.Group>
                                <Form.Label>Character Perception Changes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={JSON.stringify(newSceneSummary.characterPerception, null, 2) || ''}
                                    onChange={(e) => handleJSONChange(e, 'characterPerception')}
                                />
                                <Button variant="primary" onClick={() => updateCharacterPerception(show!)}>Update Character Perception</Button>
                            </Form.Group>

                            {/* Scene Contexts */}
                            <Form.Group>
                                <Form.Label>Scene Contexts</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newSceneSummary.sceneContexts?.join(",") || ''}
                                    onChange={(e) => handleArrayChange(e.target.value, 'sceneContexts',';')}
                                    placeholder="Enter scenes that will be contexts (separated by semicolon), blank is all scenes"
                                />
                            </Form.Group>

                        </Form>
                    </Card.Body>
                </Card>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={saveAndClose}>Save and Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default EditSceneModal;
