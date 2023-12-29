import ContextManager from "./ContextManager";
import { Context } from "../types/Context";
import { ChatMessage } from "../models/ChatMessage";
import { SceneSummary } from "../models/SceneSummary";

class ChatContextManager implements ContextManager {
    chatHistory: ChatMessage[] = [];
    sceneSummary: {[key: string]: SceneSummary} = {};
    getContext(parameters: any): Context[] {
        let summaries: SceneSummary[] = [];
        let thisSceneSummary: SceneSummary | null = null;
        if(parameters.character) {
            summaries = Object.values(this.sceneSummary).filter((summary) => {
                return summary.characters && summary.characters.includes(parameters.character.name.fullname);
            });
        }
        // console.log("getContext", this.chatHistory)
        let filteredChat = Array.from(this.chatHistory);
        if(parameters.regenerate) {
            const regeneratedIndex = this.chatHistory.indexOf(parameters.regenerate);
            console.log("regeneratedIndex", regeneratedIndex)
            filteredChat = filteredChat.slice(0, regeneratedIndex);
        }
        if(parameters.onScene) {
            filteredChat = filteredChat.filter((chatMessage) => {
                return chatMessage.scenes.join(",").startsWith(parameters.onScene);
            });
            thisSceneSummary = this.sceneSummary[parameters.onScene];
            summaries = summaries.filter((summary) => summary.scenePath !=parameters.onScene);
        }
        if(thisSceneSummary?.sceneContexts && thisSceneSummary.sceneContexts.length > 0) {
            summaries = summaries.filter((summary) => {
                return thisSceneSummary!.sceneContexts!.includes(summary.scenePath);
            });
        }

        let distinctScenesOrdered = this.chatHistory.map((chatMessage) => chatMessage.scenes.join(","))
                                    .reduce((acc, cur) => {
                                        if(!acc.includes(cur)) {
                                            acc.push(cur);
                                        }
                                        return acc;
                                    }
                                    , [] as string[])
        summaries = distinctScenesOrdered.map((scenePath) => summaries.find((summary) => summary.scenePath == scenePath)!)
                        .filter((summary) => summary);

        let context: Context[] = [];
        if(parameters.contextMapping) {
            context = parameters.contextMapping(filteredChat, summaries, thisSceneSummary);
        } else {
            context = [
                ...summaries.map((summary) => {
                    return {role: "system", content: summary.summary}
                }),
                ...filteredChat.map((chatMessage) => {
                    return {role: chatMessage.sender, content: chatMessage.text}
                })
            ]
        }
        console.log("context", context)
        return context;
    }
}

export default ChatContextManager;

const chatContextManager = new ChatContextManager();

export { chatContextManager };