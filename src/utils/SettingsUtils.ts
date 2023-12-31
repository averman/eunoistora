export function getSetting(key: string, defaultValue?: any){
    let value = localStorage.getItem('settings');
    if(value == null)
        return defaultValue;
    let settings = JSON.parse(value);
    if(!settings.settings) return defaultValue;
    let keys = key.split(".");
    let current = settings.settings;
    for(let i = 0; i < keys.length; i++){
        if(current[keys[i]] == null) return defaultValue;
        current = current[keys[i]];
    }
    return current;
}