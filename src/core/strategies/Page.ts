import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

interface ElaraHelmet {
    title: string,
    description: string,
    type: string,
    image: string,
    slug: string
}

export default class Page extends LitElement {
    @property({type: Boolean, reflect: true, noAccessor: true})
    public loaded: boolean;
    
    public get head(): ElaraHelmet {
        return {
            title: null,
            description: null,
            type: null,
            image: null,
            slug: null
        };
    }

    public createRenderRoot(): Page {
        return this;
    }
}