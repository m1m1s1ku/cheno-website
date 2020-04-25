import { LitElement, property } from 'lit-element';

export default class Page extends LitElement {
    @property({type: Boolean, reflect: true, noAccessor: true})
    public loaded: boolean;
    
    public get head(){
        return {
            title: null,
            description: null,
            type: null,
            image: null,
            slug: null
        };
    }

    public createRenderRoot(){
        return this;
    }
}