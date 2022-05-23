
export interface Badge {
    name: string
    url: string
    text: string
}

export interface Event {
    title: string
    time: string
    date: string
    content: string
    badges: Badge[]
}

export class Context {

    private data: any;
    private update: (key: string, value: string) => void;
    private next: () => void;
    private end: () => void;
    private planning: ((context: Context) => void)[];
    private stopped: boolean = false;

    constructor(
        next: () => void,
        end: () => void,
        update: (key: string, value: string) => void,
    ) {
        this.data = {}
        this.update = update;
        this.next = next;
        this.end = end;
        this.planning = [];
        this.stopped = false;
    }

    add(step: (context: Context) => void) {
        this.planning.push(step);
    }

    set(key: string, value: any) {
        this.update(key, value);
    }

    stop() {
        this.stopped = true;
    }

    async execute() {
        for (let step of this.planning) {
            if (this.stopped) {
                return;
            }
            this.next();
            await step(this);
            this.end();
        }
    }

}

