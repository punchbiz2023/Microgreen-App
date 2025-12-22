interface PuterAIResponse {
    offset: number;
    text: string;
    parts: any[];
    model: string;
}

interface PuterAI {
    chat(prompt: string, options?: any): Promise<any>;
    txt2img(prompt: string, options?: any): Promise<any>;
}

interface Puter {
    ai: PuterAI;
    print: (msg: any) => void;
}

declare global {
    interface Window {
        puter: Puter;
    }
}

export { };
