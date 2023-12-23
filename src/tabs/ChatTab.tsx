import React, { useContext, useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ChevronDown, ChevronRight, PencilSquare, Trash } from 'react-bootstrap-icons';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/ChatTab.module.css';
import { SettingContext } from '../contexts/SettingContext';
import getAiAgents from '../PropsTransformer/AiAgentsTransformer';
import db from '../utils/Db';
import { ChatMessage } from '../models/ChatMessage';
import { chatContextManager } from '../contextManager/ChatContextManager';

const ChatTab: React.FC = () => {
    const [input, setInput] = useState<string>('');
    const [sceneInput, setSceneInput] = useState<string>('');
    const [model, setModel] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);

    const { settings, updateSetting } = useContext(SettingContext);
    const aiAgents = getAiAgents(settings, chatContextManager);

        // Load chat history from IndexedDB when the component mounts
    useEffect(() => {
        db.messages.toArray().then(messages => {
            setChatHistory(messages);
        });
    }, []);

    useEffect(() => {
        chatContextManager.chatHistory = chatHistory;
    }, [chatHistory]);

    const sendMessage = () => {
        const scenes = sceneInput.split(',').map(s => s.trim()).filter(s => s);
        const oldMessage = chatHistory.find(msg => msg.id === editingMessageId);
        const newMessage: ChatMessage = editingMessageId === null
            ? { id: Date.now(), text: input, scenes, sender: 'user', model }
            : { id: editingMessageId, text: input, scenes, sender: oldMessage?.sender || '', model };

        db.messages.put(newMessage).then(() => {
            // After saving, update the state
            setChatHistory(prevHistory =>
                editingMessageId === null
                    ? [...prevHistory, newMessage]
                    : prevHistory.map(msg => msg.id === editingMessageId ? newMessage : msg)
            );
        });

        if(editingMessageId === null) {
            aiAgents[model].query(input).then((response: string) => {
                const aiMessage: ChatMessage = { id: Date.now(), text: response, scenes, sender: 'assistant:'+model, model };
                db.messages.put(aiMessage).then(() => {
                    setChatHistory(prevHistory => [...prevHistory, aiMessage]);
                });
            });
        }

        setInput('');
        setEditingMessageId(null);
    };

    const toggleGroup = (scenePath: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(scenePath)) {
                newSet.delete(scenePath);
            } else {
                newSet.add(scenePath);
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
                                    {msg.sender.startsWith('user') ? 'You' : msg.sender.split(':',2)[1]}
                                </div>
                                {editingMessageId === msg.id ? (
                                    <>
                                        <textarea
                                            className="form-control"
                                            value={input}
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
                                            <option value="key">key</option>
                                            ))}
                                            {/* Add more models as needed */}
                                        </select>
                                        <button className="btn btn-primary" onClick={sendMessage}>Update</button>
                                    </>
                                ) : (
                                    <>
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        <div className={styles.messageActions}>
                                            <PencilSquare onClick={() => editMessage(msg.id)} className="mx-1" />
                                            <Trash onClick={() => deleteMessage(msg.id)} className="mx-1" />
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
                                <div className="scene-header" onClick={() => toggleGroup(scenePath)}>
                                    {isCollapsed ? <ChevronRight /> : <ChevronDown />}
                                    <strong> Scene {scenePath}:</strong>
                                </div>
                                {!isCollapsed && renderGroupedMessages(group.messages, [...currentScene, nextScene], level + 1)}
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