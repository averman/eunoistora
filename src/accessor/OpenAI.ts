import { AiCompletion } from "./AiCompletion";

export class OpenAiAccessor implements AiCompletion {
    constructor(apikey: string, engine: string) {
        this.apikey = apikey;
        this.engine = engine;
    }

    apikey: string;
    engine: string;

    getName(): string {
        return "OpenAI " + this.engine;
    }

    mapContextToStrictPrompt(context: {role: string, content: string}[]): {role: string, content: string}[] {
        return context.map((c) => {
            let [role, char] = c.role.split(":");
            let content = c.content;
            if(char) {
                content = `[roleplaying as ${char}]\n${content}`;
            }
            return {role, content};
        });
    }

    parseStrictAnswer(answer: string): string {
        let [role, result] = answer.split(/\[roleplaying as .*\]\n/m);
        return result;
    }

    async complete(system: string, context:  {role: string, content: string}[], question: {role: string, content: string}): Promise<string> {
        let promptObject = {
            model: this.engine,
            messages: [
                { "role": "system", "content": system },
                ...this.mapContextToStrictPrompt(context),
                question
            ]
        }
        return this.queryOpenAi(JSON.stringify(promptObject));
    }

    private async queryOpenAi(prompt: string): Promise<string> {
        const url = `https://api.openai.com/v1/chat/completions`;
    
        const headers = {
            'Authorization': `Bearer ${this.apikey}`,
            'Content-Type': 'application/json'
        };
    
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: prompt  // Use the stringified JSON directly
            });
    
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
    
            const data = await response.json();
            return data.choices[0].message.content;  // Adjust according to the response structure
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            throw error;
        }
    }

    public static async getEngines(apikey: string): Promise<string[]> {
        let engines: string[] = [];

        const url = `https://api.openai.com/v1/engines`;
        const headers = {
            'Authorization': `Bearer ${apikey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });
    
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
    
            const data = await response.json();
            engines = data.data.map((e: any) => e.id);
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            throw error;
        }

        return engines;
    }
    
}