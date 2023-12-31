import { Character } from "../models/Character";
import { Context } from "../types/Context";
import { AiAgents } from "./AiAgents";

class CharacterImportAgent extends AiAgents {
    getName(parameters?: any): string {
        return "Character Import Agent";
    }
    getInstructions(parameters?: any): string {
        return "Import a character from a file.";
    }
    getContext(parameters?: any): Context[] {
        let source: any;
        if(parameters?.source) source = parameters.source;
        else throw new Error("No source data available.");

        let character: Character;
        if(parameters?.character) character = parameters.character;
        else throw new Error("No character data available.");

        let result: Context[] = [];

        // character name
        result.push({
            role: "system",
            content: `character name: ${source.name}`
        });

        // character description
        result.push({
            role: "system",
            content: `character description:\n\n${source.description}`
        });

        // character personality
        if(source.personality && source.personality.length > 0)
            result.push({
                role: "system",
                content: `character personality:\n\n${source.personality}`
            });

        // character rules
        if(source.system_prompt && source.system_prompt.length > 0)
            result.push({
                role: "system",
                content: `character engagement rules:\n\n${source.system_prompt}`
            });

        // character greetings
        result.push({
            role: "system",
            content: `character greetings:\n\n${source.first_message}`
        });
        if(source.alternate_greetings && source.alternate_greetings.length > 0)
            for(let greeting of source.alternate_greetings)
                result.push({
                    role: "system",
                    content: `character greetings:\n\n${greeting}`
                });

        if(source.example_dialogs && source.example_dialogs.length > 0)
            result.push({
                role: "system",
                content: `character example dialogs:\n\n${source.example_dialogs}`
            });

        return result;
    }
    mapPrompt(prompt: string, parameters?: any): Context {
        parameters.stage = prompt;
        if(prompt == "start" || prompt == "description") {
            let exception = "";
            if(prompt == "description") exception = `except for ${Object.values(parameters.character.properties).map((x:any)=>x.name).join(', ')} `;
            return { role: "system", content: `INSTRUCTION: Give all descriptions of the characters (physical description, background, motivation, personality, social description, rules of engagement, daily activities) ${exception}in bullet points where each point is a paragraph with the format of:\n - [ name of description ] : [ objective description from 3rd person PoV narrator ]`};
        } else if (prompt == "behavior") {
            return { role: "system", content: `INSTRUCTION: Give 10 behaviors of the characters (such as how they react to certain situations, how they interact with other characters, etc) in bullet points with format of:\n - [ conditional if any ], {{char}} [ severity: likes, hates, might do, could do, possibly do, never do, always do, try to. ] [ descriptive of the things ].\n IMPORTANT: STICK TO THE GIVEN FORMAT`};
        } else if (prompt == "scenario") {
            return { role: "system", content: `INSTRUCTION: Give 5 scene scenario that could happen with the character, each scenario should be a paragraph long. You can infer the scenario from character greetings, example dialogs, or character description. List all the scenario in bullet point with the format without numbering`};
        }
        return { role: "system", content: ""};
    }
    async parseResponse(response: string, parameters?: any): Promise<string> {
        let character: Character = parameters.character;
        if(parameters.stage == "start"){
            character.name.fullname = parameters.source.name;
            if( response.startsWith("-")) response = response.substring(1);
            response.split("\n- ").forEach((line) => {
                let [key, value] = line.split(":");
                character.properties["properties_"+key.trim().toLowerCase()] = {
                    name: key.trim(),
                    description: value.trim(),
                    weight: 1,
                    dynamic: true,
                    knownTo: []
                };
            });
            if(Object.values(character.properties).length >3) return this.query("behavior", parameters);
            return this.query("description", parameters);
        }
        if(parameters.stage == "description"){
            if( response.startsWith("-")) response = response.substring(1);
            response.split("\n- ").forEach((line) => {
                let [key, value] = line.split(":");
                if(value)
                    character.properties["properties_"+key.trim().toLowerCase()] = {
                        name: key.trim(),
                        description: value.trim(),
                        weight: 1,
                        dynamic: true,
                        knownTo: []
                    };
                else {
                    character.properties["properties_overall"] = {
                        name: "overall_description",
                        description: line.trim(),
                        weight: 1,
                        dynamic: true,
                        knownTo: []
                    };
                }
            });
            return this.query("behavior", parameters);
        }
        if(parameters.stage == "behavior"){
            if( response.startsWith("-")) response = response.substring(1);
            response.split(/\n[ ]*(\- |[0-9]+[\.\)]?[ ]?)/).forEach((line) => {
                if(!line || line.length < 4) return;
                line = line.replaceAll(/\[\]/g,"")
                console.log("Parsing behavior line: "+line);
                let [conditional, severity, value] = line.split("~~");
                if(!value) {
                    value = severity;
                    severity = conditional;
                    conditional = "";
                }
                if(!value) [conditional, severity, value] = advancedParsing(line.toLowerCase().trim(), character.name.fullname.trim());
                console.log(`conditional: ${conditional}, severity: ${severity}, value: ${value}`);
                if(value)
                    character.behaviors["behavior_"+value.split(" ").join("_")] = {
                        value: value.trim(),
                        severity: severity?.trim(),
                        condition: conditional?.trim(),
                        weight: 1
                    };
            });
            return this.query("scenario", parameters);
        }
        if(parameters.stage == "scenario"){
            if( response.startsWith("-")) response = response.substring(1);
            else if( response.startsWith("1.")) response = response.substring(2);
            let i = 1;
            response.split(/(\n[ ]*\- )|([0-9]+[\.\)]?[ ]?)/).forEach((line) => {
                if(!line || line.length < 4) return;
                console.log("Parsing scenario line: "+line);
                if(line.trim().length > 0){
                    character.scenarios["scenario_"+i] = {
                        description: line.trim()
                    };
                    i++;
                }
            });
        }
        return JSON.stringify(character);
    }
}

function advancedParsing(text: string, name: string): [conditional: string, severity: string, value: string] {
    let [conditional, severity, value] = ["", "", ""];
    let curLine = text;
    let temp = curLine.split(" ");
    if(curLine.startsWith("if") || curLine.startsWith("when") || curLine.startsWith("while") || curLine.startsWith("whenever")){
        let curLines: string[] = [];
        temp.shift();
        curLine = temp.join(" ");
        [conditional, ...curLines] = curLine.split(/[\,\:]/);
        curLine = curLines.join(",");
        conditional = conditional.trim();
    }
    curLine = curLine.trim();
    temp = curLine.split(" ");
    if(curLine.startsWith("{{char}}") || curLine.startsWith("she") || curLine.startsWith("he")){
        temp.shift();
    }
    if(curLine.startsWith(name.toLowerCase())) {
        for(let i=0; i<name.split(" ").length; i++)
            temp.shift();
    }
    severity = temp.shift() || "";
    value = temp.join(" ");
    let tempCond = "";
    if(value.includes(" if ")) tempCond = "if";
    else if(value.includes(" when ")) tempCond = "when";
    else if(value.includes(" while ")) tempCond = "while";
    else if(value.includes(" whenever ")) tempCond = "whenever";
    if(tempCond.length > 0 && conditional.length == 0) {
        [value, conditional] = value.split(` ${tempCond} `);
    }
    return [conditional, severity, value];
}

export { CharacterImportAgent };