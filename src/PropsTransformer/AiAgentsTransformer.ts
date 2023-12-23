import { AiAgents } from "../agents/AiAgents";
import { OpenAiAccessor } from "../accessor/OpenAI";
import { Chub } from "../accessor/Chub";
import { OpenRouter } from "../accessor/OpenRouter";
import { ChatAgents } from "../agents/ChatAgents";
import { AiCompletion } from "../accessor/AiCompletion";
import ContextManager from "../contextManager/ContextManager";

const cachedAiAgents: {
  [key: string]: {
    agent: AiAgents,
    model: string,
    platform: string,
    connectorType: string
  }
} = {};

function getAiAgents(settings: { [key: string]: any }, contextManager: ContextManager): { [key: string]: AiAgents} {
  let connectors: any = settings.connectors.connectors;
  let result: { [key: string]: AiAgents} = {};
  for(let connector of connectors) {
    let name = connector.name;
    if(cachedAiAgents[name]) {
      result[name] = cachedAiAgents[name].agent;
      continue;
    } else {
      let accessor: AiCompletion | undefined = undefined;
      if(connector.platform == 'openai'){
        accessor = new OpenAiAccessor(settings.apis.openAiApiKey, connector.model);
      } else if (connector.platform == 'chub') {
        accessor = new Chub(settings.apis.chubApiKey);
      } else if (connector.platform == 'openrouter') {
        accessor = new OpenRouter(settings.apis.openRouterApiKey, connector.model);
      }
      let agent: AiAgents | undefined = undefined;
      if(typeof accessor !== 'undefined') {
        if(connector.connectorType == 'type1') {
          agent = new ChatAgents(accessor, contextManager);
        }
      }
      if(typeof agent !== 'undefined') {
        cachedAiAgents[name] = {
          agent: agent,
          model: connector.model,
          platform: connector.platform,
          connectorType: connector.connectorType
        }
        result[name] = agent;
      }
    }
  }
  return result;
}

export default getAiAgents;