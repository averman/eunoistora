import { AiCompletion } from "./AiCompletion";

export class Chub implements AiCompletion {
    constructor(apikey: string) {
        console.log("Chub Accessor created", apikey);
        this.apikey = apikey;
        this.uriIndex = 0;
    }

    apikey: string;
    uriIndex: number;
    uri: string[] = [
        'https://mars.chub.ai/chub/asha/v1',
        'https://mercury.chub.ai/mythomax/v1',
    ];

    engine: string[] = [
        'asha',
        'mythomax',
    ];

    getName(): string {
        return "Chub " + this.engine[this.uriIndex];
    }
    async complete(system: string, context: string[], question: string): Promise<string> {
        let promptObject = {
            model: this.engine[this.uriIndex],
            messages: [
                { "role": "system", "content": system },
                ...context.map((c) => { return { "role": "user", "content": c } }),
                { "role": "user", "content": question }
            ]
        }
        try {
            return await this.queryChub(JSON.stringify(promptObject))
        } catch (error) {
            if((error as any).message == "Error: 403" && this.uriIndex + 1 < this.uri.length) {
                this.uriIndex++;
                return this.complete(system, context, question);
            }
            throw error;
        };
    }

    private async queryChub(prompt: string): Promise<string> {
        const url = this.uri[this.uriIndex] + "/chat/completions";

        const headers = {
            'Authorization': `Bearer ${this.apikey}`,
            'Content-Type': 'application/json'
        };

        console.log("Chub query", prompt, headers);
    
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
            console.error('Error calling Chub API:', error);
            throw error;
        }
    }

    public static async getEngines(apikey: string): Promise<string[]> {
        let engines: string[] = [];

        let uris: string[] = [
            'https://mars.chub.ai/chub/asha/v1',
            'https://mercury.chub.ai/mythomax/v1',
        ];

        const headers = {
            'Authorization': `Bearer ${apikey}`,
            'Content-Type': 'application/json'
        };

        for(let uri of uris) {
            const url = `${uri}/models`;
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers,
                });
        
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
        
                const data = await response.json();
                data.data.forEach((element:any) => {
                    engines.push(element.id);
                });
            } catch (error) {
                console.error('Error calling Chub API:', error);
            }
        }
        return engines;
    }
}