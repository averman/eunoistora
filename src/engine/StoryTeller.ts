
function getObjectKeysRecursively(obj: any, prefix: string = ""): string[] {
    let result: string[] = [];
    for(let key in obj) {
        if (Array.isArray(obj[key])) {
            // terminate search as array can only be located at leaf
            result.push(prefix + key);
        } else if(typeof obj[key] === "object") {
            result.push(...getObjectKeysRecursively(obj[key], prefix + key + "."));
        } else {
            result.push(prefix + key);
        }
    }
    return result;
}
function setObjectRecursively(obj: any, key: string, value: any): void {
    let keys = key.split(".");
    if(keys.length == 1) {
        obj[keys[0]] = value;
        return;
    }
    if(obj[keys[0]] == undefined) obj[keys[0]] = {};
    setObjectRecursively(obj[keys[0]], keys.slice(1).join("."), value);
}

function getObj(keys: string[], obj: any): any {
    if(keys.length == 0) return obj;
    if(obj == undefined) return undefined;
    if(obj[keys[0]] == undefined) return undefined;
    return getObj(keys.slice(1), obj[keys[0]]);
}

export class StoryTeller {
    rawdata: any = {};
    async importFromUri(uri: string): Promise<void> {
        this.rawdata = await (await fetch(uri)).json()
    }
    async import(data: string): Promise<void> {
        this.rawdata = JSON.parse(data);
    }
    private hasKey(keys: string[], obj: any = this.rawdata): boolean {
        if(keys.length == 0) return true;
        if(obj == undefined) return false;
        if(obj[keys[0]] == undefined) return false;
        return this.hasKey(keys.slice(1), obj[keys[0]]);
    }
    validate(mandatoryFields: string[]): boolean {
        for(let field of mandatoryFields) {
            let keys = field.split(".");
            if(!this.hasKey(keys)) {
                console.error("Storyteller data has missing mandatory field", field);
                return false;
            }
        }
        return true;
    }
    getList(field: string): any[] {
        let result = getObj(field.split("."), this.rawdata);
        if(Array.isArray(result)) return result;
        if(typeof result !== "undefined") return [result];
        return [];
    }
    get(obj: any, prefix: string = ""): any {
        let keys = getObjectKeysRecursively(obj);
        keys = keys.map((k) => (prefix?prefix + ".":"") + k);
        let result: any = {};
        for(let key of keys) {
            let value = getObj(key.split("."), this.rawdata);
            let setKey = prefix?key.substring(prefix.length+1):key;
            if(typeof value !== "undefined") {
                setObjectRecursively(result, setKey, value);
            } else {
                setObjectRecursively(result, setKey, getObj(key.split("."), obj));
            }
        }
        return result;
    }
}