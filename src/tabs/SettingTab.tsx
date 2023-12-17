// SettingsTab.tsx
import React, { useContext, useState } from 'react';
import { SettingContext } from '../contexts/SettingContext';
import { ConnectorGenerator } from '../components/GeneratorComponent';

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
            value={settings.apis[key]}
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

            <CollapsibleGroup title="Characters">
                {/* Example: Radio buttons */}
                {/* Add radio buttons here */}
                {/* Add more settings inputs here */}
            </CollapsibleGroup>

            {/* Add more groups as needed */}
        </div>
    );
};

export default SettingsTab;
