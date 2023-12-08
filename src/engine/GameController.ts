import { SettingContextValue } from "../SettingContext";
import { AiCompletion } from "../accessor/AiCompletion";
import { Chub } from "../accessor/Chub";
import { OpenAiAccessor } from "../accessor/OpenAI";
import { OpenRouter } from "../accessor/OpenRouter";
import { NarratorAgent } from "../agents/NarratorAgent";
import { ContextManager } from "./ContextManager";
import { StoryTeller } from "./StoryTeller";

// GameController.ts
type GameState = {
    screen: 'mainMenu' | 'gameLoop' | 'endScreen' | 'about';
};

class GameController {
  public state: GameState;
  private setImage: (layer: string, imageId: string) => void;
  private setTextboxText: (text: string) => void;
  private setChoiceBox: (choices: { text: string; handler: () => void }[]) => void;
  private settings: {[key: string]: any} = {};
  private aiCompletion: AiCompletion = {} as AiCompletion;

  constructor(  setImage: (layer: string, imageId: string) => void, 
                setTextboxText: (text: string) => void, 
                setChoiceBox: (choices: { text: string; handler: () => void }[]) => void) {
    this.setImage = setImage;
    this.setTextboxText = setTextboxText;
    this.setChoiceBox = setChoiceBox;
    this.state = { screen: 'mainMenu'};
  }

  // Initialize the game
  public init(settings: {[key: string]: any}) {
    this.settings = settings;
    this.mainMenu();
  }

  // Handle main menu logic
  public mainMenu() {
    this.state.screen = 'mainMenu';
    // Set main menu background, text, etc.
    this.setImage('background', 'mainmenu');
    this.setChoiceBox([
      {
        text: 'Start Game',
        handler: () => this.startGame(),
      },
      {
        text: 'About',
        handler: () => this.about(),
      },
    ]);
  }

  // Start the game loop
  private async startGame() {
    this.state.screen = 'gameLoop';
    // Game loop logic
    // For example, setting initial scene
    console.log(this.settings)
    this.aiCompletion = new OpenAiAccessor(this.settings.apis.openAiApiKey, 'gpt-3.5-turbo-1106');
    // this.aiCompletion = new Chub(this.settings.apis.chubApiKey);
    let storyTeller = new StoryTeller();
    await storyTeller.importFromUri("storytellers/test.json");
    let contextManager = new ContextManager(this.settings, storyTeller);
    // this.aiCompletion = new OpenRouter(this.settings.apis.openRouterApiKey, 'airoboros');
    let narrator = new NarratorAgent(this.aiCompletion);
    narrator.tune(storyTeller);
    let response = await narrator.query('Create an introduction story in visual novel style for the main character');
    // let response = await this.aiCompletion.complete('You are a game master for a visual novel game', ['The main character is someone new in town'], 'Create an introduction story in visual novel style for the main character');
    this.setImage('background', 'initialSceneBackground');
    this.setTextboxText(response);
    // ... more game logic ...
  }

  // Handle end screen logic
  private endScreen() {
    this.state.screen = 'endScreen';
    this.setImage('background', 'endScreenBackground');
    this.setTextboxText('Thank you for playing!');
    // ... more end screen logic ...
  }

  // Handle end screen logic
  private about() {
    this.state.screen = 'about';
    this.setImage('background', 'endScreenBackground');
    this.setTextboxText('Thank you for playing!');
    // ... more end screen logic ...
  }

  // Additional methods to control the game flow...
}

export default GameController;
