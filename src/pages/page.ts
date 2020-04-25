import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { property, customElement, query } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { fadeWith } from '../core/animations';

export interface ProjectMinimal {
    title: string;
    content: string;
    excerpt: string;
    featuredImage: {
        sourceUrl: string;
    };
};

@customElement('ui-page')
export class PageController extends Page {
    public static readonly is: string = 'ui-page';

    public static readonly hasRouting: boolean = true;

    @query('#page')
    private _page: HTMLDivElement;

    @property({type: Object, reflect: false})
    public article: ProjectMinimal;
    @property({type: String, reflect: false})
    public featured: string;
    private _toLoad: string;

    public constructor(toLoad: string){
        super();

        this._toLoad = toLoad;
    }
    
    private async _load(uri: string){
        const pageQuery = `
        {
            pageBy(uri: "${uri}") {
                title
                featuredImage {
                    sourceUrl
                }
                content(format: RENDERED)
                }
        }              
        `;

        const first = await fetch(Constants.graphql, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: pageQuery
            })
        }).then(res => res.json()).then(res => res.data.pageBy) as ProjectMinimal;

        this.loaded = true;

        const post = first;

        this.article = post;
        if(post.featuredImage && post.featuredImage.sourceUrl){
            this.featured = post.featuredImage.sourceUrl;
        } else {
            this.featured = '';
        }

        const fade = fadeWith(300, true);
        this._page.animate(fade.effect, fade.options);
    }

    public async firstUpdated(){
        await this._load(this._toLoad);
    }

    public render(): void | TemplateResult {
        return html`
        <div id="page" class="page" role="main">
            ${!this.loaded ? html`
            <div class="loading">
                <elara-spinner text="Chargement des expositions"></elara-spinner>
            </div>` : html``}
            ${this.article ? html`
            <div class="cols">
                <div class="content">
                    <h2>${this.article.title}</h2>
                    ${unsafeHTML(this.article.content)}
                </div>
                ${this.featured ? html`
                <div class="image-container">
                    <iron-image sizing="contain" src="${this.featured}"></iron-image>
                </div>
                ` : html``}
            </div>
            ` : html``}
        </div>
        `;
    }
}
