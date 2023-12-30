// SettingsTab.tsx
import React, { useContext, useState } from 'react';
import { SettingContext } from '../contexts/SettingContext';
import { ConnectorGenerator } from '../components/GeneratorComponent';
import Card from 'react-bootstrap/esm/Card';
import Button from 'react-bootstrap/esm/Button';
import dataExportImport from '../utils/DataExportImport';

interface CollapsibleGroupProps {
    title: string;
    children: React.ReactNode;
}

// Part of SettingsTab.tsx

const CollapsibleGroup = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group">
            <button className="group-title" onClick={() => setIsOpen(!isOpen)}>
                {title}
            </button>
            <div className={`group-content ${isOpen ? 'open' : 'closed'}`}>
                {children}
            </div>
        </div>
    );
};

// ... rest of the SettingsTab component ...


const SettingsTab = () => {
    const { settings, updateSetting } = useContext(SettingContext);

    const handleInputChange = (
        group: string,
        key: string,
        value: any) => {
        updateSetting(group, key, value);
    };

    const textboxSetting = (group: string, key: string) => 
    <div className="setting-item">
        <label htmlFor={key}>{key}:</label>
        <input
            id={key}
            type="text"
            value={settings?.apis[key]}
            onChange={(e) => handleInputChange(group, key, e.target.value)}
        />
    </div>

    return (
        <div className="settings-tab">
            <CollapsibleGroup title="APIs">
                {textboxSetting('apis', 'openAiApiKey')}
                {textboxSetting('apis', 'chubApiKey')}
                {textboxSetting('apis', 'openRouterApiKey')}
                {textboxSetting('apis', 'googleBardApiKey')}
                {/* Add more settings inputs here */}
            </CollapsibleGroup>

            <CollapsibleGroup title="Connectors">    
                {/* Here we add the new Generator component */}
                <ConnectorGenerator />
                {/* Other settings for connectors */}
            </CollapsibleGroup>

            <CollapsibleGroup title="Export / Import">
                <Card style={{width:'27%', display:'inline-flex', margin:'10px'}}>
                    <Card.Header>
                        <Card.Title>Settings</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Card.Text>
                            <Button style={{margin: '10px'}} variant="primary" onClick={()=>dataExportImport.onExportClick('settings')}>Export</Button>
                            <Button style={{margin: '10px'}} variant="primary" onClick={()=>dataExportImport.onImportClick('settings')}>Import</Button>
                            <Button style={{margin: '10px'}} variant="danger" onClick={()=>dataExportImport.onClearClick('settings')}>Clear</Button>
                        </Card.Text>
                    </Card.Body>
                </Card>
                <Card style={{width:'27%', display:'inline-flex', margin:'10px'}}>
                    <Card.Header>
                        <Card.Title>Character</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Card.Text>
                            <Button style={{margin: '10px'}} variant="primary" onClick={()=>dataExportImport.onExportClick('character')}>Export</Button>
                            <Button style={{margin: '10px'}} variant="primary" onClick={()=>dataExportImport.onImportClick('character')}>Import</Button>
                            <Button style={{margin: '10px'}} variant="danger" onClick={()=>dataExportImport.onClearClick('character')}>Clear</Button>
                        </Card.Text>
                    </Card.Body>
                </Card>
                <Card style={{width:'27%', display:'inline-flex', margin:'10px'}}>
                    <Card.Header>
                        <Card.Title>Chat</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <Card.Text>
                            <Button style={{margin: '10px'}} variant="primary" onClick={()=>dataExportImport.onExportClick('chat')}>Export</Button>
                            <Button style={{margin: '10px'}} variant="primary" onClick={()=>dataExportImport.onImportClick('chat')}>Import</Button>
                            <Button style={{margin: '10px'}} variant="danger" onClick={()=>dataExportImport.onClearClick('chat')}>Clear</Button>
                        </Card.Text>
                    </Card.Body>
                </Card>
            </CollapsibleGroup>

            {/* Add more groups as needed */}
        </div>
    );
};

export default SettingsTab;
