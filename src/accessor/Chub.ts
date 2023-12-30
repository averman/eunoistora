import { AiCompletion } from "./AiCompletion";

export class Chub implements AiCompletion {
    constructor(apikey: string) {
        console.log("Chub Accessor created", apikey);
        this.apikey = apikey;
        this.uriIndex = 0;
    }

    private lastQuery: Promise<any> = Promise.resolve();

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

    queue: string[] = [];

    getName(): string {
        return "Chub " + this.engine[this.uriIndex];
    }
    async complete(system: string, context:  {role: string, content: string}[], question: {role: string, content: string}): Promise<string> {
        let promptObject = {
            model: this.engine[this.uriIndex],
            messages: [
                { "role": "system", "content": system },
                ...context,
            ]
        }
        if(question?.content?.length > 0) {
            promptObject.messages.push(question);
        }
        try {
            return await this.queryChub(JSON.stringify(promptObject, null, 2))
        } catch (error) {
            if((error as any).message == "Error: 403" && this.uriIndex + 1 < this.uri.length) {
                this.uriIndex++;
                return this.complete(system, context, question);
            }
            throw error;
        };
    }

    private async queryChub(prompt: string): Promise<string> {

        await this.lastQuery;
        
        const url = this.uri[this.uriIndex] + "/chat/completions";
        const headers = {
            'Authorization': `Bearer ${this.apikey}`,
            'Content-Type': 'application/json'
        };

        // Create a new promise that represents this query's work
        const currentQuery = new Promise<string>(async (resolve, reject) => {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: prompt
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();
                resolve(data.choices[0].message.content);
            } catch (error) {
                console.error('Error calling Chub API:', error);
                reject(error);
            }
        });

        // Update the lastQuery to be the current one
        this.lastQuery = currentQuery;

        // Wait for this query to complete before finishing
        return currentQuery;
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