import { AiAgents } from "./AiAgents";

class AnswerReformattingAgent extends AiAgents {
    getName(): string {
        return "Answer Reformatting";
    }

    getInstructions(): string {
        return `Reformat the following texts without changing any of the words, just following the format: Use asterisks to denote actions. Use asterisk and brackets to describe the character's inner thought. use double quotes to denote out of character chat.for example: *smiles while thinking* (I'm hungry) "I'm going to the bathroom" *I said to them*`;
    }

    getContext(parameters?: any): any {
        return [];
    }

    mapPrompt(prompt: string): string {
        return prompt;
    }

    parseResponse(response: string): string {
        return response;
    }
}

export default AnswerReformattingAgent;