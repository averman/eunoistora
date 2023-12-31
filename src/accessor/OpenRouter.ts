import { AiCompletion } from "./AiCompletion";

export class OpenRouter implements AiCompletion {
    constructor(apikey: string, engine: string) {
        this.apikey = apikey;
        this.engine = engine;
    }

    apikey: string;
    engine: string;
    model: string = "";

    getName(): string {
        return "OpenRouter " + this.engine;
    }
    async complete(system: string, context:  {role: string, content: string}[], question: {role: string, content: string}): Promise<string> {
        if(!this.model) this.model = await this.assignModel();
        let promptObject = {
            model: this.model,
            messages: [
                { "role": "system", "content": system },
                ...context,
                question
            ]
        }
        return this.queryOpenAi(JSON.stringify(promptObject));
    }

    private async getModels(): Promise<string[]> {
        let models = await fetch("https://openrouter.ai/api/v1/models", {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apikey}`,
            },
        });

        return (await models.json()).data.map((m: any) => m.id);
    }

    private levenshteinDistance(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
      
        let matrix = [];
      
        // increment along the first column of each row
        let i;
        for (i = 0; i <= b.length; i++) {
          matrix[i] = [i];
        }
      
        // increment each column in the first row
        let j;
        for (j = 0; j <= a.length; j++) {
          matrix[0][j] = j;
        }
      
        // Fill in the rest of the matrix
        for (i = 1; i <= b.length; i++) {
          for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1, // substitution
                Math.min(
                  matrix[i][j - 1] + 1, // insertion
                  matrix[i - 1][j] + 1
                )
              ); // deletion
            }
          }
        }
      
        return matrix[b.length][a.length];
    }

    private async assignModel(): Promise<string> {
        // choose a model based on most similar name to engine using levenstein distance
        let models = await this.getModels();
        let minDistance = 100;
        let model = "";
        models.forEach((m) => {
            let distance = this.levenshteinDistance(this.engine, m);
            distance = (distance - Math.abs(this.engine.length - m.length)) / this.engine.length;
            if(distance < minDistance) {
                minDistance = distance;
                model = m;
            }
        });
        return model;
    }

    private async queryOpenAi(prompt: string): Promise<string> {
        const url = `https://openrouter.ai/api/v1/chat/completions`;
    
        const headers = {
            'Authorization': `Bearer ${this.apikey}`,
            'Content-Type': 'application/json'
        };
    
        try {
            const response = await fetch(url, {
                // mode: 'no-cors',
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
        let models = await fetch("https://openrouter.ai/api/v1/models", {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apikey}`,
            },
        });

        return (await models.json()).data.map((m: any) => m.id);
    }
}