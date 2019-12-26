import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, decodeHTML, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { wrap } from '../core/errors/errors';
import { ArticleMinimal } from './expos';
import { navigate } from '../core/routing/routing';

class Single extends Page {
    public static readonly is: string = 'ui-exposition';

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

        if(!document.title){
            document.title = post.title + ' | ' + Constants.title;
        }
        this.article = post;
        if(post.featuredImage && post.featuredImage.sourceUrl){
            this.featured = post.featuredImage.sourceUrl;
        } else {
            this.featured = '';
        }

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
                overflow: hidden;
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

            .article__header h1 {
                display: flex;
                align-items: center;
                flex-direction: row;
            }

            .article__header h1 mwc-icon {
                cursor: pointer;
                font-size: 1.15em;
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
                    <h1><mwc-icon @click=${() => {
                        navigate('expos');
                    }}>chevron_left</mwc-icon> ${decodeHTML(this.article.title)}</h1>
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
        return this.shadowRoot.querySelector('#single');
    }
}
customElements.define(Single.is, Single);
