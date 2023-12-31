// CharacterTab.tsx
import React, { useState, useEffect, ReactNode, useContext } from 'react';
import db from '../utils/Db'; // Update with the correct path
import { Character, CharacterAI, CharacterAiSystem, CharacterBehavior, CharacterProperty, CharacterScenario } from '../models/Character'; // Update with the correct path
import '../styles/Characters.css'
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Accordion from 'react-bootstrap/Accordion';
import { PlusCircleFill, TrashFill } from 'react-bootstrap-icons';
import { getAiCompletions } from '../PropsTransformer/AiAgentsTransformer';
import { SettingContext } from '../contexts/SettingContext';
import { AiAgents } from '../agents/AiAgents';
import { CharacterImportAgent } from '../agents/CharacterImportAgent';

const CharacterTab: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [characters, setCharacters] = useState<Character[]>([]);
    const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
    const [newCharacter, setNewCharacter] = useState<Character>({
        name: { fullname: "", nickname: [] },
        tags: [],
        linkedCharacters: {},
        properties: {},
        behaviors: {},
        scenarios: {},
        ai: {
            base: { type: '', connectors: [], parameters: {} } // Default empty structure for base AI
        },
    });
    const [importUrl, setImportUrl] = useState<string>("");
    const { settings, updateSetting } = useContext(SettingContext);
    const [aiAgent, setAiAgent] = useState<AiAgents | null>(null); 
    
    const characterForm = () => {
        if (activeCharacter) return activeCharacter;
        return newCharacter;
    }

    const setCharacterForm = (character: Character) => {
        if (activeCharacter) setActiveCharacter(character);
        else setNewCharacter(character);
    }

    const fetchCharacters = async () => {
        const allCharacters = await db.characters.toArray();
        setCharacters(allCharacters);
    };

    useEffect(() => {
        let ais = getAiCompletions(settings);
        setAiAgent(new CharacterImportAgent(ais.mars));
    }, [settings]);

    useEffect(() => {
        (document as any).db = db;
        fetchCharacters();
    }, []);

    const updateNewCharacter = (updatedPart: Partial<Character>) => {
        console.log("Updating partial character", updatedPart);
        if (activeCharacter) setActiveCharacter({ ...activeCharacter, ...updatedPart })
        else setNewCharacter({ ...newCharacter, ...updatedPart });
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleCreateCharacter = async () => {
        if (activeCharacter) {
            await db.characters.update(activeCharacter, activeCharacter);
            setActiveCharacter(null);
            fetchCharacters();
        } else {
            await db.characters.add(newCharacter); // Add new character to the database
            setCharacters([...characters, newCharacter]); // Update local state
        }
        setNewCharacter({ // Reset the new character form
            name: { fullname: "", nickname: [] },
            tags: [],
            linkedCharacters: {},
            properties: {},
            behaviors: {},
            scenarios: {},
            ai: {
                base: { type: '', connectors: [], parameters: {} } // Default empty structure for base AI
            },
        });
    };

    const handleSelectCharacter = (character: Character) => {
        console.log("Selected character", character);
        setActiveCharacter(character);
    };

    const handleDeslectCharacter = () => {
        setActiveCharacter(null);
    };
    
    const handleDeleteCharacter = async () => {
        if (activeCharacter) {
            await db.characters.delete(activeCharacter.name.fullname);
            setActiveCharacter(null);
            fetchCharacters();
        }
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const base64Image = loadEvent.target?.result as string;
            // Check if editing an existing character or adding a new one
            if (activeCharacter) {
              // Update active character's picture
              setActiveCharacter({ ...activeCharacter, picture: base64Image });
            } else {
              // Update new character's picture
              setNewCharacter({ ...newCharacter, picture: base64Image });
            }
          };
          reader.readAsDataURL(file);
        }
      };
      

    const renderCharacterCards = () => {
        let characterToRender: Character[] = characters;
        if (searchTerm) {
            characterToRender = characterToRender.filter((character) => {
                const fullName = character.name.fullname.toLowerCase();
                const nicknames = character.name.nickname.join(",").toLowerCase();
                const tags = character.tags.join(",").toLowerCase();
                return fullName.includes(searchTerm.toLowerCase()) || nicknames.includes(searchTerm.toLowerCase()) || tags.includes(searchTerm.toLowerCase());
            });
        }
        return (
            <div className="character-cards">
                {characterToRender.map((character, index) => (
                    <Card className="character-card" style={{ width: '18rem' }} onClick={() => handleSelectCharacter(character)}>
                        <Card.Img variant="top" src={character.picture || 'assets/placeholder/char.png'} alt="Character" />
                        <Card.Body>
                          <Card.Title>{character.name.fullname}</Card.Title>
                          {character.tags.map((tag, index) => (<Card.Footer>{tag}</Card.Footer>))}
                          {/* Add other character details here */}
                        </Card.Body>
                    </Card>
                ))}
            </div>
        );
    }

    async function importFromChub() {
        let url = importUrl;
        if(!url.startsWith("https://api.chub.ai")) {
            if(url.startsWith("https://chub.ai"))
                url = url.replace("https://chub.ai", "https://api.chub.ai/api")+"?full=true";
            else if(url.startsWith("characters/"))
                url = `https://api.chub.ai/api/${url}?full=true`;
            else if(url.split("/").length === 1)
                url = `https://api.chub.ai/api/characters/${url}?full=true`;
        }
        let response = await fetch(url)
        let data = await response.json();
        if(!(data?.node?.definition)) return;
        let result = await aiAgent?.query("start",{source: data.node.definition, character: newCharacter});
        try{
            setNewCharacter(JSON.parse(result!));
        }catch(e){
            console.error(e); 
        }
    }

    const renderDynamicItems = (category: string, items: { [key: string]: CharacterProperty | CharacterBehavior | CharacterScenario | CharacterAI | string }) => {
        
        let onChangeFunction: (key: string, item: any, keyItem: any)=>(e: any)=>void = ()=>()=>null;

        function wrapAccordionItem(item: React.ReactNode, key: string, index: number) {
            if (index < 0) {
                return (
                    <Accordion.Header key={key} as="h3">{item}</Accordion.Header>
                );
            } else {
                return (
                    <Accordion.Body key={key}>{item}</Accordion.Body>
                );
            }
        }

        const keymap: any = {
            "Properties": "properties",
            "Behaviors": "behaviors",
            "Scenarios": "scenarios",
            "AI": "ai",
            "Linked Characters": "linkedCharacters"
        }

        switch (category) {
            case "Properties": onChangeFunction = (key:string, item: any, keyItem: keyof CharacterProperty)=>(e: any) => {
                const updatedProperties = { ...characterForm().properties };
                (updatedProperties[key][keyItem] as any) = e.target.value;
                updateNewCharacter({ properties: updatedProperties });
            }; break;
            case "Behaviors": onChangeFunction = (key:string, item: any, keyItem: keyof CharacterBehavior)=>(e: any) => {
                const updatedBehaviors = { ...characterForm().behaviors };
                (updatedBehaviors[key][keyItem] as any) = e.target.value;
                updateNewCharacter({ behaviors: updatedBehaviors });
            }; break;
            case "Scenarios": onChangeFunction = (key:string, item: any, keyItem: keyof CharacterScenario)=>(e: any) => {
                const updatedScenarios = { ...characterForm().scenarios };
                (updatedScenarios[key][keyItem] as any) = e.target.value;
                updateNewCharacter({ scenarios: updatedScenarios });
            }; break;
            case "AI": onChangeFunction = (key:string, item: any, keyItem: keyof CharacterAI)=>(e: any) => {
                const updatedAi = { ...characterForm().ai };
                if(keyItem === "type") (updatedAi[key][keyItem] as any) = e.target.value;
                else if(keyItem === "connectors") (updatedAi[key][keyItem] as any) = e.target.value.split(",");
                else if(keyItem === "parameters") (updatedAi[key][keyItem] as any) = JSON.parse(e.target.value);
                updateNewCharacter({ ai: updatedAi });
            }; break;
        }
        
        return (<Accordion defaultActiveKey="0">
                <Card>
                <Card.Header>
                    <h3>{category}</h3>
                </Card.Header>
                <Card.Body>
                    
                    {Object.entries(items).map(([key, item], index) => {
                        if (typeof item === "string") {
                            return (
                                <Card.Footer>
                                <Accordion defaultActiveKey={key}>
                                <Accordion.Header as="h3">
                                    <Form.Group><Form.Label>Relation</Form.Label>
                                    <Form.Control type="text" value={key} onChange={e=>{
                                        const updatedLinkedCharacters = { ...characterForm().linkedCharacters };
                                        // Assuming you are changing the key here, you might need a more complex logic to handle this
                                        const oldValue = updatedLinkedCharacters[key];
                                        delete updatedLinkedCharacters[key];
                                        updatedLinkedCharacters[e.target.value] = oldValue;
                                        updateNewCharacter({ linkedCharacters: updatedLinkedCharacters });
                                    }} />
                                    </Form.Group>   
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Form.Group><Form.Label>Character Name</Form.Label>
                                    <Form.Control type="text" value={item} onChange={e=>{
                                        const updatedLinkedCharacters = { ...characterForm().linkedCharacters };
                                        updatedLinkedCharacters[key] = e.target.value;
                                        updateNewCharacter({ linkedCharacters: updatedLinkedCharacters });
                                    }} />
                                    </Form.Group>
                                </Accordion.Body>
                                </Accordion>
                                </Card.Footer>
                            )
                        }
                        return (
                            <Card.Footer>
                                <Accordion defaultActiveKey={key}>
                                {Object.entries(item).map(([itemKey, value], itemIndex) => {
                                    let modifiedIndex = itemIndex;
                                    if(category === "AI" && itemKey === "type") modifiedIndex = -1;
                                    if(category === "Properties" && itemKey === "name") modifiedIndex = -1;
                                    if(category === "Behaviors" && itemKey === "value") modifiedIndex = -1;
                                    if(category === "Scenarios" && itemKey === "description") modifiedIndex = -1;
                                    switch (itemKey) {
                                        case "description": return wrapAccordionItem(
                                            <Form.Group><Form.Label>{itemKey}</Form.Label>
                                            <Form.Control as="textarea" rows={(4)} value={value} onChange={onChangeFunction(key, item, itemKey)} />
                                            </Form.Group>, itemKey, modifiedIndex);
                                        case "parameters": return wrapAccordionItem(
                                            <Form.Group><Form.Label>{itemKey}</Form.Label>
                                            <Form.Control as="textarea" rows={(4)} value={JSON.stringify(value,null,2)} onChange={onChangeFunction(key, item, itemKey)} />
                                            </Form.Group>, itemKey, modifiedIndex);
                                        case "knownTo": return wrapAccordionItem(
                                            <Form.Group><Form.Label>{itemKey}</Form.Label>
                                            <Form.Control type="text" value={value.join(",")} onChange={(e) => {
                                                const updatedProperties = { ...characterForm().properties };
                                                updatedProperties[key][itemKey] = e.target.value.split(",");
                                                updateNewCharacter({ properties: updatedProperties });
                                                }} />
                                            </Form.Group> ,itemKey, modifiedIndex);
                                        default: return wrapAccordionItem(
                                        <Form.Group><Form.Label>{itemKey}</Form.Label>
                                        <Form.Control type="text" value={value} onChange={onChangeFunction(key, item, itemKey)} />
                                        </Form.Group>, itemKey, modifiedIndex);
                                    }
                                })}
                                </Accordion>
                                <Button variant="link" size="sm" onClick={() => {
                                    const catKey = keymap[category];
                                    const deletedItems = { ...((characterForm() as any)[catKey]) };
                                    delete deletedItems[key];
                                    updateNewCharacter({ [catKey]: deletedItems });
                                }}>
                                    <TrashFill /> {/* Add New or other icon */}
                                </Button>
                            </Card.Footer>
                        );
                    })}
                    <Button variant="link" size="sm" onClick={() => {
                        const catKey = keymap[category];
                        const key = `property_${Object.keys(characterForm().properties).length}`;
                        let updatedItems:any = {
                            ...((characterForm() as any)[catKey]),
                        };
                        if(category === "AI") updatedItems["AI_"+Date.now()] = {type: '', connectors: [], parameters: {}};
                        if(category === "Properties") updatedItems["Property_"+Date.now()] = {name: '', description: '', weight: 0, dynamic: false, knownTo: []};
                        if(category === "Behaviors") updatedItems["Behavior_"+Date.now()] = {severity: '', value: '', condition: '', weight: 0};
                        if(category === "Scenarios") updatedItems["Scenario_"+Date.now()] = {description: '', condition: ''};
                        if(category === "Linked Characters") updatedItems['new relation'] = "";
                        let updatingItem:any = {[catKey]: updatedItems};
                        updateNewCharacter(updatingItem);
                    }}>
                        <PlusCircleFill /> {/* Add New or other icon */}
                    </Button>
                </Card.Body>
            </Card></Accordion>)
    }

    return (
        <div>
            {/* Search and Character List */}
            <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Search Characters..." className="form-control mb-3" />

            <div className="character-container-card">
                {renderCharacterCards()}
            </div>

            <div>

                <div className='character-form-section'>


                    {/* Full Name Field */}
                    <Card><Card.Header>
                        <h2>{activeCharacter ? "Edit Character" : "Create New Character"}</h2>
                    </Card.Header>

                    <Card.Body>
                        {/* Image placeholder */}
                        <Card.Img
                        variant="top"
                        src={(activeCharacter ? activeCharacter.picture : newCharacter.picture) || 'assets/placeholder/char.png'} // Use character picture if available, otherwise use a default placeholder
                        alt="Character"
                        onClick={() => {
                            const imageUpload = document.getElementById('imageUpload');
                            if (imageUpload) {
                                imageUpload.click();
                            }
                        }} // Opens file dialog when image is clicked
                        />
                        {/* Hidden file input */}
                        <input
                            id="imageUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                            />
                        <Form.Group>
                            <Form.Label>Full Name:</Form.Label>
                            <Form.Control type="text" placeholder="Enter full name" value={characterForm().name.fullname} onChange={(e) =>
                                setCharacterForm({ ...characterForm(), name: { ...characterForm().name, fullname: e.target.value } })}/>  
                            <Form.Label>Nickname:</Form.Label>
                            <Form.Control type="text" placeholder="Enter Nickname (comma delimited)" value={characterForm().name.nickname.join(", ")} onChange={(e) =>
                                setCharacterForm({ ...characterForm(), name: { ...characterForm().name, nickname: e.target.value.split(",") } })}/> 
                            <Form.Label>Tags:</Form.Label>
                            <Form.Control type="text" placeholder="Enter tags  (comma delimited)" value={characterForm().tags.join(", ")} 
                            onChange={(e) => setCharacterForm({ ...characterForm(), tags: e.target.value.split(",").map(tag => tag.trim()) })}/>  
                        </Form.Group>
                    </Card.Body></Card>
                </div>

                <div className='character-form-section'>
                    {renderDynamicItems("Properties", characterForm().properties)}
                </div>

                <div className='character-form-section'>
                    {renderDynamicItems("Behaviors", characterForm().behaviors)}
                </div>

                <div className='character-form-section'>
                    {renderDynamicItems("Scenarios", characterForm().scenarios)}
                </div>

                <div className='character-form-section'>
                    {renderDynamicItems("Linked Characters", characterForm().linkedCharacters)}
                </div>

                <div className='character-form-section'>
                    {renderDynamicItems("AI", characterForm().ai)}
                </div>

                {/* Submit Button for the entire form */}
                {!activeCharacter && <div>
                        <Form.Control type="text" placeholder="Enter Chub URL" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} className='modelandtype'/><Button onClick={(e)=>importFromChub()}>Import from Chub</Button>
                    </div>}
                <Button onClick={handleCreateCharacter}>{activeCharacter ? "Save Changes" : "Create Character"}</Button>
                {activeCharacter && <Button onClick={handleDeslectCharacter}>Cancel</Button>}
                {activeCharacter && <Button variant='danger' onClick={handleDeleteCharacter}>Delete</Button>}
            </div>

        </div>
    );
};

export default CharacterTab;