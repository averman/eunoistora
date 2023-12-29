import React, { useContext, useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronDown, ChevronRight, PencilSquare, Reply, Trash } from 'react-bootstrap-icons';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/ChatTab.module.css';
import { SettingContext } from '../contexts/SettingContext';
import getAiAgents, { getAiCompletions } from '../PropsTransformer/AiAgentsTransformer';
import db from '../utils/Db';
import { ChatMessage } from '../models/ChatMessage';
import { chatContextManager } from '../contextManager/ChatContextManager';
import getCharacters from '../PropsTransformer/CharacterTransformer';
import { AiAgents } from '../agents/AiAgents';
import { Character } from '../models/Character';
import ChatSummarizingAgent from '../agents/ChatSummarizingAgent';
import { SceneSummary } from '../models/SceneSummary';
import Card from 'react-bootstrap/esm/Card';
import EditSceneModal from '../components/EditSceneModal';

const ChatTab: React.FC = () => {
    const [input, setInput] = useState<string>('');
    const [sceneInput, setSceneInput] = useState<string>(() => {
        // Initialize scene input from localStorage, or provide a default value
        return localStorage.getItem('sceneInput') || '';
    });
    const [model, setModel] = useState<string>(() => {
        // Initialize model from localStorage, or provide a default value
        return localStorage.getItem('selectedModel') || 'defaultModel';
    });
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [characters, setCharacter]  = useState<Character[]>([]);
    const [aiAgents, setAiAgents] = useState<{[key: string]: AiAgents}>({});
    const [utilAgents, setUtilAgents] = useState<{[key: string]: AiAgents}>({});
    const [sceneSummaries, setSceneSummaries] = useState<{[key: string]: SceneSummary}>({});

    const [modalShow, setModalShow] = useState<string | null>(null);

    const handleModalClose = () => setModalShow(null);
    const handleModalSave = (newSummary: SceneSummary, keyName: string) => {
        console.log("saving", newSummary, keyName)
        setSceneSummaries({...sceneSummaries, [keyName]: newSummary});
        setModalShow(null);
    };


    const { settings, updateSetting } = useContext(SettingContext);

    // Load chat history from IndexedDB when the component mounts
    useEffect(() => {
        db.messages.toArray().then(messages => {
            setChatHistory(messages);
        });
        db.characters.toArray().then(characters => {
            setCharacter(characters);
        });
        db.scenes.toArray().then(scenes => {
            setSceneSummaries(Object.fromEntries(scenes.map(scene => [scene.scenePath, scene])));
        });
        let ais = getAiCompletions(settings);
        let newUtilAgents = {
            summarizer: new ChatSummarizingAgent(ais['mars'], chatContextManager)
        }
        setUtilAgents(newUtilAgents);
    }, []);

    function summarizeScene(scenePath: string) {
        utilAgents.summarizer.query("", {onScene: scenePath}).then((response: string) => {
            let charInScene = new Set<string>(chatHistory.filter(x=>x.scenes.join(',')===scenePath)
            .map(x=>x.sender)
            .map(x=>x.startsWith('user') ? 'You' : x.split(':', 2)[1]));
            let newSceneSummary: SceneSummary = {scenePath, summary: response, isCollapsed: true, characters: Array.from(charInScene)};
            if(sceneSummaries[scenePath]) {
                newSceneSummary = {...sceneSummaries[scenePath], summary: response, characters: Array.from(charInScene)};
            }
            db.scenes.put(newSceneSummary, scenePath).then(() => {
                setSceneSummaries(prev => ({...prev, [scenePath]: newSceneSummary}));
            });
        });
    }

    useEffect(() => {
        Object.entries(sceneSummaries).forEach(([scenePath, sceneSummary]) => {
            if(sceneSummary.summary === "summarizing...") {
                summarizeScene(scenePath);
            }
            db.scenes.put(sceneSummary, scenePath);
        });
        chatContextManager.sceneSummary = sceneSummaries;
        let collapsedScenes = Object.values(sceneSummaries).filter(x=>x.isCollapsed).map(x=>x.scenePath);
        setCollapsedGroups(new Set(collapsedScenes));
    }, [sceneSummaries]);

    useEffect(() => {
        setAiAgents(getCharacters(settings, chatContextManager, characters));
    }, [characters]);

    useEffect(() => {
        (document as any).aiAgents = aiAgents;
    }, [aiAgents]);

    // Use useEffect to save selected model to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('selectedModel', model);
    }, [model]);

    // Use useEffect to save scene input to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('sceneInput', sceneInput);
    }, [sceneInput]);

    useEffect(() => {
        chatContextManager.chatHistory = chatHistory;

        if (editingMessageId === null && chatHistory[chatHistory.length - 1]?.sender.startsWith('user')) {
            triggerAiAgent();
        }
    }, [chatHistory]);

    function triggerAiAgent() {
        if(!aiAgents[model]) {
            console.error(`Model ${model} not found`);
            return;
        }
        let onScene = sceneInput.split(',').map(s => s.trim()).filter(s => s).join(',');
        aiAgents[model].query("",{onScene}).then((response: string) => {
            const scenes = sceneInput.split(',').map(s => s.trim()).filter(s => s);
            const aiMessage: ChatMessage = { id: Date.now(), text: response, scenes, sender: 'assistant:' + model, model };
            db.messages.put(aiMessage).then(() => {
                setChatHistory(prevHistory => [...prevHistory, aiMessage]);
            });
        });
    }
    

    const sendMessage = async () => {
        const scenes = sceneInput.split(',').map(s => s.trim()).filter(s => s);
        if(input.trim().length > 0) {
            const oldMessage = chatHistory.find(msg => msg.id === editingMessageId);
            const newMessage: ChatMessage = editingMessageId === null
                ? { id: Date.now(), text: input, scenes, sender: 'user', model }
                : { id: editingMessageId, text: input, scenes, sender: oldMessage?.sender || '', model };
    
            await db.messages.put(newMessage);
            // After saving, update the state
            setChatHistory(prevHistory =>
                editingMessageId === null
                    ? [...prevHistory, newMessage]
                    : prevHistory.map(msg => msg.id === editingMessageId ? newMessage : msg)
            );
        } else {
            triggerAiAgent();
        }


        setInput('');
        setEditingMessageId(null);
    };

    const toggleGroup = (scenePath: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(scenePath)) {
                newSet.delete(scenePath);
                if(sceneSummaries[scenePath]) {
                    setSceneSummaries(prev => ({...prev, [scenePath]: {...prev[scenePath], isCollapsed: false}}));
                }
            } else {
                newSet.add(scenePath);
                if(!sceneSummaries[scenePath]) {
                    setSceneSummaries(prev => ({...prev, [scenePath]: {scenePath, summary: "summarizing...", isCollapsed: true}}));
                } else {
                    setSceneSummaries(prev => ({...prev, [scenePath]: {...prev[scenePath], isCollapsed: true}}));
                }
            }
            return newSet;
        });
    };

    const editMessage = (messageId: number) => {
        const messageToEdit = chatHistory.find(msg => msg.id === messageId);
        if (messageToEdit) {
            setInput(messageToEdit.text);
            setSceneInput(messageToEdit.scenes.join(', '));
            setEditingMessageId(messageId);
            setModel(messageToEdit.model);
        }
    };

    const deleteMessage = (messageId: number) => {
        db.messages.delete(messageId).then(() => {
            setChatHistory(chatHistory.filter(msg => msg.id !== messageId));
        });
    };

    const regenerateAIResponse = (messageId: number) => {
        const messageToRegenerate = chatHistory.find(msg => msg.id === messageId);
        // querying message is the message before messageToRegenerate
        if(!messageToRegenerate) return;
        if (messageToRegenerate && messageToRegenerate.sender.startsWith('assistant')) {
            aiAgents[messageToRegenerate.model].query("", {
                regenerate: messageToRegenerate, 
                onScene: messageToRegenerate.scenes.join(',')}
            ).then((response: string) => {
                const aiMessage: ChatMessage = {
                    id: messageId,
                    text: response,
                    scenes: messageToRegenerate.scenes,
                    sender: 'assistant:' + messageToRegenerate.model,
                    model: messageToRegenerate.model,
                };
                db.messages.put(aiMessage).then(() => {
                    setChatHistory(prevHistory => prevHistory.map(msg => msg.id === messageId ? aiMessage : msg));
                });
            });
        }
    };

    const renderGroupedMessages = (messages: ChatMessage[], currentScene: string[] = [], level: number = 0) => {
        if (level > 4) return null;

        const groupedMessages: { scenes: string[], messages: ChatMessage[] }[] = [];
        for (let msg of messages) {
            if (groupedMessages.length === 0) {
                groupedMessages.push({
                    scenes: [msg.scenes[level]],
                    messages: [msg]
                });
            } else {
                const lastGroup: any = groupedMessages[groupedMessages.length - 1];
                if (lastGroup.scenes[0] === msg.scenes[level]) {
                    lastGroup.messages.push(msg);
                } else {
                    groupedMessages.push({
                        scenes: [msg.scenes[level]],
                        messages: [msg]
                    });
                }
            }
        }
        let retval: React.JSX.Element[] = [];
        let i = 0;

        for (let group of groupedMessages) {
            if (group.scenes.filter(x => x).length === 0) {
                let messages: ChatMessage[] = group.messages;
                retval.push(
                    <React.Fragment key={group.scenes.join(',') + (i++)}>
                        {messages.map((msg: ChatMessage) => (
                            <div key={msg.id} className={styles.chatMessage}>
                                {/* Display Sender */}
                                <div className={styles.messageSender}>
                                    {msg.sender.startsWith('user') ? 'You' : msg.sender.split(':', 2)[1]}
                                </div>
                                {editingMessageId === msg.id ? (
                                    <>
                                        <textarea
                                            className="form-control"
                                            value={input}
                                            rows={10}
                                            onChange={(e) => setInput(e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="form-control mb-2"
                                            value={sceneInput}
                                            placeholder="Enter scenes (comma separated)"
                                            onChange={(e) => setSceneInput(e.target.value)}
                                        />
                                        <select
                                            className="form-select"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                        >
                                            {Object.keys(aiAgents).map((key) => (
                                                <option value={key}>{key}</option>
                                            ))}
                                            {/* Add more models as needed */}
                                        </select>
                                        <button className="btn btn-primary" onClick={sendMessage}>Update</button>
                                    </>
                                ) : (
                                    <>
                                        <ReactMarkdown components={
                                            {
                                                em: ({node, ...props}) => <em className={styles.chatem} {...props} />,
                                            }
                                        }>{msg.text}</ReactMarkdown>
                                        <div className={styles.messageActions}>
                                            <PencilSquare onClick={() => editMessage(msg.id)} className="mx-1" />
                                            <Trash onClick={() => deleteMessage(msg.id)} className="mx-1" />
                                            {msg.sender.startsWith('assistant') && (
                                                <Reply onClick={() => regenerateAIResponse(msg.id)} className="mx-1"/>
                                            )}

                                        </div>
                                        {/* Optionally display the model */}
                                        <div className={styles.modelDisplay}>
                                            {msg.model}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </React.Fragment>
                );
            } else {
                let nextScenes = group.scenes;
                retval.push(
                    ...Array.from(nextScenes).map(nextScene => {
                        const scenePath = [...currentScene, nextScene].join(',');
                        const isCollapsed = collapsedGroups.has(scenePath);

                        return (
                            <div key={nextScene + (i++)}>
                                <div className="scene-header">
                                    <Card className={styles.sceneCard}>
                                        <Card.Header className={styles.sceneCardHeader}>
                                            <Card.Title className={styles.sceneCardTitle}>
                                                <div style={{width: '95%'}}  onClick={() => toggleGroup(scenePath)}>
                                                    {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                                                    <strong> Scene {scenePath}:</strong>
                                                </div>
                                                <div>
                                                    <div className="edit-icon" onClick={() => setModalShow(scenePath)}> {/* Add your edit icon here */}
                                                        <PencilSquare className="mx-1" />
                                                    </div>
                                                </div>
                                            </Card.Title>
                                        </Card.Header>
                                        <Card.Body className={styles.sceneCard}>
                                            {isCollapsed && sceneSummaries[scenePath] && sceneSummaries[scenePath].summary}
                                            {!isCollapsed && renderGroupedMessages(group.messages, [...currentScene, nextScene], level + 1)}
                                        </Card.Body>
                                    </Card>
                                </div>
                            </div>
                        );
                    })
                );
            }
        }
        return (
            <div style={{ marginLeft: `${level * 10}px` }}>
                {retval}
            </div>
        );
    };

    return (
        <div className={styles.chatContainer}>
            
            {/* Edit Scene Modal */}
            <EditSceneModal
                show={modalShow}
                onHide={handleModalClose}
                sceneSummary={sceneSummaries[modalShow as string]}
                onSave={handleModalSave}
                summarizeScene={summarizeScene}
            />
            <div className={styles.chatHistory}>
                {renderGroupedMessages(chatHistory)}
            </div>
            <div className={styles.inputSection}>
                <textarea
                    className="form-control"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                />
                <div className={styles.inputControls}>
                    <select
                        className="form-select"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    >
                        {Object.keys(aiAgents).map((key) => (
                            <option value={key}>{key}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        className="form-control mb-2"
                        value={sceneInput}
                        placeholder="Enter scenes (comma separated)"
                        onChange={(e) => setSceneInput(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default ChatTab;
