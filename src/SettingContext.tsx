// SettingContext.tsx
import React, { createContext, useEffect, useState } from 'react';

type SettingProviderProps = {
    children: React.ReactNode;
};

export interface SettingContextValue {
    settings: {[key: string]: any};
    updateSetting: (
        group: string,
        key: string,
        value: any
    ) => void;
};

let localState = null;
if(localStorage.getItem('settings')) {
    let rawLocalState = localStorage.getItem('settings');
    if(rawLocalState){
        localState = JSON.parse(rawLocalState as string);
    }
}

const initialState = localState ? localState : {
    settings: {
        apis: {
            openAiApiKey: "",
            chubApiKey: "",
            openRouterApiKey: "",
            googleBardApiKey: "",
        },
        modules: {
            // Initial module settings
        },
        characters: {
            // Initial character settings
        },
        // ... other settings groups ...
    },
    updateSetting: () => {},
};

export const SettingContext = createContext<SettingContextValue>(initialState);

export const SettingProvider = ({ children }: SettingProviderProps) => {
    const [settings, setSettings] = useState(initialState);

    useEffect(() => {
        localStorage.setItem('settings', JSON.stringify(settings));
      }, [settings]);

    const updateSetting = (
        group: keyof typeof initialState.settings,
        key: string,
        value: any
    ) => {
        setSettings((prevSettings: SettingContextValue) => {
            console.log(prevSettings);
            console.log(group, key, value);

            return {
                ...prevSettings,
                settings: {
                    ...prevSettings.settings,
                    [group]: {
                        ...prevSettings.settings[group as string],
                        [key]: value,
                    },
                },
            }
        });
    };

    return (
        <SettingContext.Provider value={{ settings: settings.settings, updateSetting }}>
            {children}
        </SettingContext.Provider>
    );
};
