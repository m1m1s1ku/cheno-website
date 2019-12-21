import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';
import { oc } from 'ts-optchain';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, decodeHTML, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { wrap } from '../core/errors/errors';
import { ArticleMinimal } from './expos';

class Single extends Page {
    public static readonly is: string = 'ui-post';

    public static readonly hasRouting: boolean = true;

    @property({type: Object, reflect: false})
    public article: ArticleMinimal;
    @property({type: String, reflect: false})
    public featured: string;
    private _toLoad: string;

    public constructor(toLoad: string){
        super();

        this._toLoad = toLoad;
    }

    public firstUpdated(){
        return this._load();
    }
    
    private async _load(){
        const projectQuery = `
        {
            expositionBy(slug: "${this._toLoad}") {
                title
                content
                excerpt
                featuredImage {
                    sourceUrl
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
        }).then(res => res.json()).then(res => res.data.expositionBy).catch(_ => this.dispatchEvent(wrap(_))) as ArticleMinimal;

        this.loaded = true;

        const post = first;
        document.title = post.title + ' | ' + Constants.title;
        this.article = post;
        this.featured = oc<ArticleMinimal>(post).featuredImage.sourceUrl('');

        if(Utils.animationsReduced()){
            return;
        }
        const fade = fadeWith(300, true);
        this.page.animate(fade.effect, fade.options);
        
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .single {
                margin-top: 6em;
                padding: 2em;
            }

            .images {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .article__header {
                display: flex;
                justify-content: space-between;
                flex-direction: row;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div id="single" class="single" role="main">
            ${!this.loaded ? html`
            <div class="loading">
                <paper-spinner active></paper-spinner>
            </div>` : html``}
            ${this.article ? html`
            <article>
                <div class="article__header">
                    <h1>${decodeHTML(this.article.title)}</h1>
                    <p class="place">${this.article.place}</p>
                </div>
                <p class="date">${this.article.date_expo}</p>

                ${this.featured ? html`
                <div class="image-container" @click=${onImageContainerClicked}>
                    <iron-image style="width: 100vw; height: 400px;" sizing="contain" src="${this.featured}"></iron-image>
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

    private get page(){
        return this.shadowRoot.querySelector('#blog');
    }
}
customElements.define(Single.is, Single);
