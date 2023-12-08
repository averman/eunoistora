abstract class GameCore {

    constructor(registrar: any[]) {
        registrar.push(this);
    }

    abstract getName(): string;
}

export {}