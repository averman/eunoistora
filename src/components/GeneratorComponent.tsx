import { SetStateAction, useContext, useEffect, useState } from "react";
import { OpenAiAccessor } from "../accessor/OpenAI";
import { Chub } from "../accessor/Chub";
import { OpenRouter } from "../accessor/OpenRouter";
import { SettingContext } from "../contexts/SettingContext";

export const ConnectorGenerator = () => {
    
    const { settings, updateSetting } = useContext(SettingContext);

    const getModel = async (platform: string) => {
        let models: string[] = [];
        if (platform === 'openai') {
            models = await OpenAiAccessor.getEngines(settings.apis.openAiApiKey);
        } else if (platform === 'chub') {
            models = await Chub.getEngines(settings.apis.chubApiKey);
        } else if (platform === 'openrouter') {
            models = await OpenRouter.getEngines(settings.apis.openRouterApiKey);
        }
        return models;
    };

    const [platform, setPlatform] = useState('');
    const [model, setModel] = useState('');
    const [models, setModels] = useState<string[]>([]);
    const [connectorType, setConnectorType] = useState('');
    const [connectorName, setConnectorName] = useState('');
    const [editingConnectorId, setEditingConnectorId] = useState(-1);
    const connectors = settings?.connectors? (settings.connectors.connectors || []) : [] ;

    type Connector = { id: number; name: string; platform: string; model: string; connectorType: string };

    const setConnectors = (newConnectors: Connector[]) => updateSetting('connectors', 'connectors', newConnectors);

    useEffect(() => {
        if (platform) {
            getModel(platform).then(fetchedModels => {
                setModels(fetchedModels);
                // If editing and the model belongs to the new list, retain it
                if (editingConnectorId && fetchedModels.includes(model)) {
                    setModel(model);
                } else {
                    setModel(''); // Reset model selection if it's not in the new list
                }
            });
        }
    }, [platform]);

    const handleCreateOrUpdateConnector = () => {
        const newConnector = { id: editingConnectorId != -1 ? editingConnectorId : connectors.length + 1, 
                               name: connectorName, platform, model, connectorType };
        if (editingConnectorId != -1) {
            // Update the existing connector
            setConnectors(connectors.map((conn: Connector) => conn.id === editingConnectorId ? newConnector : conn));
            setEditingConnectorId(-1); // Reset editing ID
        } else {
            // Add new connector
            setConnectors([...connectors, newConnector]);
        }
        // Reset form fields
        setPlatform('');
        setModel('');
        setModels([]);
        setConnectorType('');
        setConnectorName('');
    };

    const handleDeleteConnector = (id: number) => {
        setConnectors(connectors.filter((conn: Connector) => conn.id !== id));
    };

    const handleEditConnector = (connector: { platform: string; model: string; connectorType: string; name: string; id: number; }) => {
        setPlatform(connector.platform);
        setModel(connector.model);
        setConnectorType(connector.connectorType);
        setConnectorName(connector.name);
        setEditingConnectorId(connector.id);
    };

    return (
        <div className="container">
            {/* Form for Connector Generator */}
            <div className="row">
                {/* Platform Dropdown */}
                <div className="col-md-4">
                    <label>Platform:</label>
                    <select className="form-control" value={platform} onChange={e => setPlatform(e.target.value)}>
                        <option value="">Select a Platform</option>
                        <option value="openai">Open AI</option>
                        <option value="chub">Chub</option>
                        <option value="openrouter">Open Router</option>
                    </select>
                </div>

                {/* Model Dropdown */}
                <div className="col-md-4">
                    <label>Model:</label>
                    <select className="form-control" value={model} onChange={e => setModel(e.target.value)} disabled={!platform}>
                    <option value="">Select a Model</option>
                        {models.map((modelOption, index) => (
                            <option key={index} value={modelOption}>{modelOption}</option>
                        ))}
                    </select>
                </div>

                {/* Connector Type Dropdown */}
                <div className="col-md-4">
                    <label>Connector Type:</label>
                    <select className="form-control" value={connectorType} onChange={e => setConnectorType(e.target.value)} disabled={!model}>
                        <option value="">Select Connector Type</option>
                        <option value="type1">Type 1</option>
                        <option value="type2">Type 2</option>
                    </select>
                </div>
            </div>

            <div className="row">
                {/* Name Input Box */}
                <div className="col-md-4">
                    <label>Name:</label>
                    <input type="text" className="form-control" value={connectorName} onChange={e => setConnectorName(e.target.value)} disabled={!model || !connectorType} />
                </div>

                {/* Create/Update Button */}
                <div className="col-md-8 d-flex align-items-end">
                    <button className="btn btn-primary" onClick={handleCreateOrUpdateConnector} disabled={!platform || !model || !connectorType || !connectorName}>
                        {editingConnectorId !== -1 ? 'Update Connector' : 'Create Connector'}
                    </button>
                </div>
            </div>

            {/* Connector Cards */}
            <div className="row">
                {connectors.map((connector: Connector) => (
                    <div className="col-md-3 mb-4" key={connector.id}>
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">{connector.name}</h5>
                                <p className="card-text">Platform: {connector.platform}</p>
                                <p className="card-text">Model: {connector.model}</p>
                                <p className="card-text">Type: {connector.connectorType}</p>
                                <button className="btn btn-primary" onClick={() => handleEditConnector(connector)}>Edit</button>
                                <button className="btn btn-danger" onClick={() => handleDeleteConnector(connector.id)}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
