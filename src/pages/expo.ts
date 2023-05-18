import { html, TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { property, customElement, query } from 'lit/decorators.js';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { fadeWith, animationsReduced } from '../core/animations';
import { ArticleMinimal } from './expos';
import { decodeHTML, wrap, Elara } from '../core/elara';

@customElement('ui-exposition')
export class Single extends Page {
    public static readonly is: string = 'ui-exposition';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public article: ArticleMinimal;
    @property({type: String, reflect: false})
    public featured: string;
    private _toLoad: string;

    @query('#single')
    private _page: HTMLDivElement;

    public constructor(toLoad: string){
        super();

        this._toLoad = toLoad;
    }

    public firstUpdated(): Promise<void> {
        return this._load();
    }
    
    private async _load(){
        const projectQuery = `
        {
            exposition(id: "${this._toLoad}", idType: SLUG) {
              title
              content
              excerpt
              featuredImage {
                node {
                  sourceUrl
                }
              }
              date_expo
              place
            }
          }
                     
        `;

        const first = await fetch(Constants.graphql, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: projectQuery
            })
        }).then(res => res.json()).then(res => res.data.exposition).catch(_ => this.dispatchEvent(wrap(_))) as ArticleMinimal;

        this.loaded = true;
        
        this.article = first;
        if(first.featuredImage && first.featuredImage.node && first.featuredImage.node.sourceUrl){
            this.featured = first.featuredImage.node.sourceUrl;
        } else {
            this.featured = '';
        }

        if(animationsReduced()){
            return;
        }

        const fade = fadeWith(300, true);
        this._page.animate(fade.effect, fade.options);
    }

    public render(): void | TemplateResult {
        return html`
        <div id="single" class="single" role="main">
            ${!this.loaded ? html`
            <div class="loading">
                <elara-spinner text="Chargement de l'exposition"></elara-spinner>
            </div>` : html``}
            ${this.article ? html`
            <article>
                <div class="article__header">
                    <h1 @click=${() => {
                        Elara().router.navigate('expos');
                    }}><mwc-icon>chevron_left</mwc-icon> ${decodeHTML(this.article.title)}</h1>
                    <p class="place">${this.article.place}</p>
                </div>
                <p class="date">${this.article.date_expo}</p>

                ${this.featured ? html`
                <div class="image-container">
                    <elara-image sizing="contain" placeholder="Chargement de l'image" src="${this.featured}"></elara-image>
                </div>
                ` : html``}
                <div class="content">
                    ${unsafeHTML(this.article.content)}
                </div>
            </article>
            ` : html``}
        </div>
        `;
    }
}
