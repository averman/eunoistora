// CharacterTab.tsx
import React, { useState, useEffect } from 'react';
import db from '../utils/Db'; // Update with the correct path
import { Character, CharacterBehavior, CharacterProperty } from '../models/Character'; // Update with the correct path

const CharacterTab: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [editCharacter, setEditCharacter] = useState<Character | null>(null);
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

    useEffect(() => {
        const fetchCharacters = async () => {
            const allCharacters = await db.characters.toArray();
            setCharacters(allCharacters);
        };
        (document as any).db = db;
        fetchCharacters();
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleSelectCharacter = (character: Character) => {
        setSelectedCharacter(character);
        setEditCharacter({ ...character }); // Create a copy for editing
    };

    const handleCreateCharacter = async () => {
        await db.characters.add(newCharacter); // Add new character to the database
        setCharacters([...characters, newCharacter]); // Update local state
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

    const updateNewCharacter = (updatedPart: Partial<Character>) => {
        setNewCharacter({ ...newCharacter, ...updatedPart });
    };

    function updateProperty(property: CharacterProperty, field: keyof CharacterProperty, value: string) {
        if (field === 'name' || field === 'description' || field === 'weight') {
            property.name = value;
        } else if (field === 'dynamic') {
            property.dynamic = Boolean(value);
        } else {
            property[field] = value.split(',').map(tag => tag.trim());
        }
    }

    function updateBehavior(behavior: CharacterBehavior, field: keyof CharacterBehavior, value: string) {
        if (field === 'condition' || field === 'value' || field === 'severity') {
            behavior[field] = value;
        } else if (field === 'weight') {
            behavior.weight = Number(value);
        }
    }

    const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>, field: string, propIndex?: number) => {
        if (!editCharacter) return; // If no character is selected for editing, do nothing

        let updatedCharacter: Character = { ...editCharacter };

        // Assuming name has a structure of { fullname: string, nickname: string[] }
        if (field === 'name.fullname') {
            updatedCharacter.name.fullname = event.target.value;
        } else if (field === 'tags') {
            updatedCharacter.tags = event.target.value.split(',').map(tag => tag.trim());
        } else if (field.includes('properties') && typeof propIndex === 'number') {
            const propField = field.split('.')[1] as keyof CharacterProperty; // 'name' or 'description' or 'weight'
            const updatedProperties = { ...updatedCharacter.properties };
            const specificProperty = { ...updatedProperties[propIndex] };
            updateProperty(specificProperty, propField, event.target.value);
            updatedProperties[propIndex] = specificProperty;
            updatedCharacter.properties = updatedProperties;
        } else if (field.includes('behaviors') && typeof propIndex === 'number') {
            const behaviorField = field.split('.')[1] as keyof CharacterBehavior; // 'severity' or 'value'
            const updatedBehaviors = { ...updatedCharacter.behaviors };
            const specificBehavior = { ...updatedBehaviors[propIndex] };
            updateBehavior(specificBehavior, behaviorField, event.target.value);
            updatedBehaviors[propIndex] = specificBehavior;
            updatedCharacter.behaviors = updatedBehaviors;
        }
        setEditCharacter(updatedCharacter);
    };

    const saveCharacter = async () => {
        if (!editCharacter) return;
        await db.characters.put(editCharacter);
        setSelectedCharacter(editCharacter);
        const allCharacters = await db.characters.toArray();
        setCharacters(allCharacters);
    };

    return (
        <div>
            {/* Search and Character List */}
            <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Search Characters..." className="form-control mb-3" />
            <div>
                {characters.filter(char => char.name.fullname.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((character, index) => (
                        <div key={index} onClick={() => handleSelectCharacter(character)} style={{ cursor: "pointer", padding: "10px", borderBottom: "1px solid #ccc" }}>
                            {character.name.fullname}
                        </div>
                    ))}
            </div>

            {/* Character Details/Editor */}
            {selectedCharacter && editCharacter && (
                <div>
                    <h3>Editing {editCharacter.name.fullname}</h3>

                    {/* Edit Name */}
                    <div>
                        <strong>Full Name:</strong>
                        <input type="text" value={editCharacter.name.fullname} onChange={(e) => handleEditChange(e, 'name.fullname')} />
                        {/* Add more fields if the name has more parts like nickname etc */}
                    </div>

                    {/* Edit Tags */}
                    <div>
                        <strong>Tags:</strong>
                        <input type="text" value={editCharacter.tags.join(', ')} onChange={(e) => handleEditChange(e, 'tags')} />
                    </div>

                    {/* Edit Properties */}
                    <div>
                        <strong>Properties:</strong>
                        {Object.values(editCharacter.properties).map((prop, index) => (
                            <div key={index}>
                                <input type="text" value={prop.name} onChange={(e) => handleEditChange(e, 'properties.name', index)} />
                                <input type="text" value={prop.description} onChange={(e) => handleEditChange(e, 'properties.description', index)} />
                                <input type="number" value={prop.weight} onChange={(e) => handleEditChange(e, 'properties.weight', index)} />
                                {/* Add more editable fields as needed */}
                            </div>
                        ))}
                    </div>

                    {/* Edit Behaviors */}
                    <div>
                        <strong>Behaviors:</strong>
                        {Object.values(editCharacter.behaviors).map((behavior, index) => (
                            <div key={index}>
                                <input type="text" value={behavior.severity} onChange={(e) => handleEditChange(e, 'behaviors.severity', index)} />
                                <input type="text" value={behavior.value} onChange={(e) => handleEditChange(e, 'behaviors.value', index)} />
                                {/* Add more editable fields as needed */}
                            </div>
                        ))}
                    </div>

                    {/* Save Button */}
                    <button onClick={saveCharacter}>Save Changes</button>
                </div>
            )}

            <div>
                <h2>Create New Character</h2>

                {/* Full Name Field */}
                <div>
                    <label>Full Name:</label>
                    <input
                        type="text"
                        value={newCharacter.name.fullname}
                        onChange={(e) =>
                            setNewCharacter({ ...newCharacter, name: { ...newCharacter.name, fullname: e.target.value } })}
                    />
                </div>

                {/* Nickname Field (Assuming it's a simple text field for one nickname, but could be an array) */}
                <div>
                    <label>Nickname:</label>
                    <input
                        type="text"
                        value={newCharacter.name.nickname.join(", ")} // Joining nicknames with a comma
                        onChange={(e) =>
                            setNewCharacter({ ...newCharacter, name: { ...newCharacter.name, nickname: e.target.value.split(",") } })}
                    />
                </div>

                {/* Tags Field */}
                <div>
                    <label>Tags:</label>
                    <input
                        type="text"
                        value={newCharacter.tags.join(", ")}
                        onChange={(e) => setNewCharacter({ ...newCharacter, tags: e.target.value.split(",").map(tag => tag.trim()) })}
                    />
                </div>

                {/* Properties Section */}
                <div>
                    <h3>Properties</h3>
                    {Object.keys(newCharacter.properties).map((key, index) => {
                        const property = newCharacter.properties[key];
                        return (
                            <div key={index}>
                                <input
                                    type="text"
                                    value={property.name}
                                    onChange={(e) => {
                                        const updatedProperties = { ...newCharacter.properties };
                                        updatedProperties[key] = { ...property, name: e.target.value };
                                        updateNewCharacter({ properties: updatedProperties });
                                    }}
                                    placeholder="Name"
                                />
                                <input
                                    type="text"
                                    value={property.description}
                                    onChange={(e) => {
                                        const updatedProperties = { ...newCharacter.properties };
                                        updatedProperties[key] = { ...property, description: e.target.value };
                                        updateNewCharacter({ properties: updatedProperties });
                                    }}
                                    placeholder="Description"
                                />
                                <input
                                    type="number"
                                    value={property.weight}
                                    onChange={(e) => {
                                        const updatedProperties = { ...newCharacter.properties };
                                        updatedProperties[key] = { ...property, weight: Number(e.target.value) };
                                        updateNewCharacter({ properties: updatedProperties });
                                    }}
                                    placeholder="Weight"
                                />
                                <label>
                                    Dynamic:
                                    <input
                                        type="checkbox"
                                        checked={property.dynamic}
                                        onChange={(e) => {
                                            const updatedProperties = { ...newCharacter.properties };
                                            updatedProperties[key] = { ...property, dynamic: e.target.checked };
                                            updateNewCharacter({ properties: updatedProperties });
                                        }}
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={property.knownTo.join(", ")}
                                    onChange={(e) => {
                                        const updatedProperties = { ...newCharacter.properties };
                                        updatedProperties[key] = { ...property, knownTo: e.target.value.split(",").map(tag => tag.trim()) };
                                        updateNewCharacter({ properties: updatedProperties });
                                    }}
                                    placeholder="Known To (comma separated)"
                                />
                                <button onClick={() => {
                                    const updatedProperties = { ...newCharacter.properties };
                                    delete updatedProperties[key];
                                    updateNewCharacter({ properties: updatedProperties });
                                }}>Remove Property</button>
                            </div>
                        );
                    })}
                    <button onClick={() => {
                        const key = `property_${Object.keys(newCharacter.properties).length}`;
                        const updatedProperties = {
                            ...newCharacter.properties,
                            [key]: { name: '', description: '', weight: 0, dynamic: false, knownTo: [] } // default values for new property
                        };
                        updateNewCharacter({ properties: updatedProperties });
                    }}>Add Property</button>
                </div>

                {/* Behaviors Section */}
                <div>
                    <h3>Behaviors</h3>
                    {Object.keys(newCharacter.behaviors).map((key, index) => {
                        const behavior = newCharacter.behaviors[key];
                        return (
                            <div key={index}>
                                <input
                                    type="text"
                                    value={behavior.condition || ''}
                                    onChange={(e) => {
                                        const updatedBehaviors = { ...newCharacter.behaviors };
                                        updatedBehaviors[key] = { ...behavior, condition: e.target.value };
                                        updateNewCharacter({ behaviors: updatedBehaviors });
                                    }}
                                    placeholder="Condition"
                                />
                                <select
                                    value={behavior.severity || "always"}
                                    onChange={(e) => {
                                        const updatedBehaviors = { ...newCharacter.behaviors };
                                        updatedBehaviors[key] = { ...behavior, severity: e.target.value };
                                        updateNewCharacter({ behaviors: updatedBehaviors });
                                    }}>
                                    <option value="always">always</option>
                                    <option value="sometimes">sometimes</option>
                                    <option value="never">never</option>
                                    <option value="likes to">likes to</option>
                                    <option value="hates">hates</option>
                                </select>
                                <input
                                    type="text"
                                    value={behavior.value}
                                    onChange={(e) => {
                                        const updatedBehaviors = { ...newCharacter.behaviors };
                                        updatedBehaviors[key] = { ...behavior, value: e.target.value };
                                        updateNewCharacter({ behaviors: updatedBehaviors });
                                    }}
                                    placeholder="Value"
                                />
                                <input
                                    type="number"
                                    value={behavior.weight}
                                    onChange={(e) => {
                                        const updatedBehaviors = { ...newCharacter.behaviors };
                                        updatedBehaviors[key] = { ...behavior, weight: Number(e.target.value) };
                                        updateNewCharacter({ behaviors: updatedBehaviors });
                                    }}
                                    placeholder="Weight"
                                />
                                <button onClick={() => {
                                    const updatedBehaviors = { ...newCharacter.behaviors };
                                    delete updatedBehaviors[key];
                                    updateNewCharacter({ behaviors: updatedBehaviors });
                                }}>Remove Behavior</button>
                            </div>
                        );
                    })}
                    <button onClick={() => {
                        const key = `behavior_${Object.keys(newCharacter.behaviors).length}`;
                        const updatedBehaviors = {
                            ...newCharacter.behaviors,
                            [key]: { severity: '', value: '', condition: '', weight: 0 } // default values for new behavior
                        };
                        updateNewCharacter({ behaviors: updatedBehaviors });
                    }}>Add Behavior</button>
                </div>

                {/* Scenarios Section */}
                <div>
                    <h3>Scenarios</h3>
                    {Object.keys(newCharacter.scenarios).map((key, index) => {
                        const scenario = newCharacter.scenarios[key];
                        return (
                            <div key={index}>
                                <input
                                    type="text"
                                    value={scenario.condition || ''}
                                    onChange={(e) => {
                                        const updatedScenarios = { ...newCharacter.scenarios };
                                        updatedScenarios[key] = { ...scenario, condition: e.target.value };
                                        updateNewCharacter({ scenarios: updatedScenarios });
                                    }}
                                    placeholder="Condition"
                                />
                                <input
                                    type="text"
                                    value={scenario.description}
                                    onChange={(e) => {
                                        const updatedScenarios = { ...newCharacter.scenarios };
                                        updatedScenarios[key] = { ...scenario, description: e.target.value };
                                        updateNewCharacter({ scenarios: updatedScenarios });
                                    }}
                                    placeholder="Description"
                                />
                                {/* ...other fields for scenario */}
                                <button onClick={() => {
                                    const updatedScenarios = { ...newCharacter.scenarios };
                                    delete updatedScenarios[key];
                                    updateNewCharacter({ scenarios: updatedScenarios });
                                }}>Remove Scenario</button>
                            </div>
                        );
                    })}
                    <button onClick={() => {
                        const key = `scenario_${Object.keys(newCharacter.scenarios).length}`;
                        const updatedScenarios = {
                            ...newCharacter.scenarios,
                            [key]: { description: '', condition: '' } // default values for new scenario
                        };
                        updateNewCharacter({ scenarios: updatedScenarios });
                    }}>Add Scenario</button>
                </div>

                {/* LinkedCharacters Section */}
                <div>
                    <h3>Linked Characters</h3>
                    {Object.entries(newCharacter.linkedCharacters).map(([key, value], index) => {
                        return (
                            <div key={index}>
                                <input
                                    type="text"
                                    value={key}
                                    placeholder="Character ID"
                                    onChange={(e) => {
                                        const updatedLinkedCharacters = { ...newCharacter.linkedCharacters };
                                        // Assuming you are changing the key here, you might need a more complex logic to handle this
                                        const oldValue = updatedLinkedCharacters[key];
                                        delete updatedLinkedCharacters[key];
                                        updatedLinkedCharacters[e.target.value] = oldValue;
                                        updateNewCharacter({ linkedCharacters: updatedLinkedCharacters });
                                    }}
                                />
                                <input
                                    type="text"
                                    value={value}
                                    placeholder="Relation"
                                    onChange={(e) => {
                                        const updatedLinkedCharacters = { ...newCharacter.linkedCharacters };
                                        updatedLinkedCharacters[key] = e.target.value;
                                        updateNewCharacter({ linkedCharacters: updatedLinkedCharacters });
                                    }}
                                />
                                <button onClick={() => {
                                    const updatedLinkedCharacters = { ...newCharacter.linkedCharacters };
                                    delete updatedLinkedCharacters[key];
                                    updateNewCharacter({ linkedCharacters: updatedLinkedCharacters });
                                }}>Remove Link</button>
                            </div>
                        );
                    })}
                    <button onClick={() => {
                        // Implement logic to add a new linked character
                        // This might involve selecting from a list of existing characters or other logic
                        const updatedLinkedCharacters = {
                            ...newCharacter.linkedCharacters,
                            'newId': '' // Implement logic to ensure unique IDs and meaningful relations
                        };
                        updateNewCharacter({ linkedCharacters: updatedLinkedCharacters });
                    }}>Add Linked Character</button>
                </div>

                {/* AI Section */}
      <div>
        <h3>Character AI Systems</h3>
        {Object.entries(newCharacter.ai || {}).map(([key, ai], index) => (
          <div key={index}>
            <h4>{key === "base" ? "Base AI" : `AI System: ${key}`}</h4>
            <input
              type="text"
              value={ai.type}
              onChange={(e) => {
                const updatedAi = { ...newCharacter.ai, [key]: { ...ai, type: e.target.value } };
                updateNewCharacter({ ai: updatedAi });
              }}
              placeholder="Type"
            />
            <input
              type="text"
              value={ai.connectors.join(", ")}
              onChange={(e) => {
                const updatedAi = { ...newCharacter.ai, [key]: { ...ai, connectors: e.target.value.split(",").map(connector => connector.trim()) } };
                updateNewCharacter({ ai: updatedAi });
              }}
              placeholder="Connectors (comma separated)"
            />
            {/* Parameters: Implement a suitable UI element based on how complex parameters are, maybe a textarea or a JSON editor */}
            <textarea
              value={JSON.stringify(ai.parameters, null, 2)}
              onChange={(e) => {
                try {
                  const updatedAi = { ...newCharacter.ai, [key]: { ...ai, parameters: JSON.parse(e.target.value) } };
                  updateNewCharacter({ ai: updatedAi });
                } catch (error) {
                  console.error("Error parsing JSON", error);
                  // Handle error for invalid JSON
                }
              }}
              placeholder="Parameters (JSON format)"
            />
            {/* Prevent removing the base AI */}
            {key !== "base" && (
              <button onClick={() => {
                const updatedAi = { ...newCharacter.ai };
                delete updatedAi[key];
                updateNewCharacter({ ai: updatedAi });
              }}>Remove AI</button>
            )}
          </div>
        ))}
        {/* Add new AI system */}
        <button onClick={() => {
          const key = `ai_${Object.keys(newCharacter.ai || {}).length}`;
          const updatedAi = {
            ...newCharacter.ai,
            [key]: { type: '', connectors: [], parameters: {} } // default values for new AI system
          };
          updateNewCharacter({ ai: updatedAi });
        }}>Add AI System</button>
      </div>

                {/* Submit Button for the entire form */}
                <button onClick={handleCreateCharacter}>Create Character</button>
            </div>

        </div>
    );
};

export default CharacterTab;