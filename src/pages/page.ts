import { html, TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { css, property } from 'lit-element';
import { oc } from 'ts-optchain';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { Utils, onImageContainerClicked } from '../core/ui/ui';
import { fadeWith } from '../core/animations';
import { ProjectMinimal } from './project';
import { wrap } from '../core/errors/errors';

class PageController extends Page {
    public static readonly is: string = 'ui-page';

    public static readonly hasRouting: boolean = true;

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
        }).then(res => res.json()).then(res => res.data.pageBy).catch(_ => this.dispatchEvent(wrap(_))) as ProjectMinimal;

        this.loaded = true;

        const post = first;
        document.title = post.title + ' | ' + Constants.title;
        this.article = post;
        this.featured = oc<ProjectMinimal>(post).featuredImage.sourceUrl('/assets/logo.png');

        if(Utils.animationsReduced()){
            return;
        }
        const fade = fadeWith(300, true);
        this._page.animate(fade.effect, fade.options);
    }

    public static get styles(){
        return [
            ... super.styles,
            css`
            .page {
                padding: 2em;
                padding-top: 6em;
            }

            li {
                list-style: initial;
            }

            .content {
                padding: 1em;
                width: 100%;
            }

            .cols {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
            }

            iron-image {
                width: 25vw; 
                height: 400px;
            }

            .image-container {
                padding: 1em;
            }

            h3 {
                margin: 0;
            }

            @media (max-width: 600px){
                .cols {
                    flex-direction: column-reverse;
                }

                .image-container {
                    text-align: center;
                }

                iron-image {
                    width: 250px;
                }
            }

            img {
                max-width: 300px;
            }

            h1,
            h2,
            p,
            i,
            a,
            .first-letter,
            .authorName a {
                color: rgba(0, 0, 0, 0.84);
                text-rendering: optimizeLegibility;
            }

            h1 {
                font-size: 48px;
                text-align: left;
                margin-bottom: 8px;
            }

            h2 {
                font-size: 26px;
                font-weight: 700;
                padding: 0;
                margin: 56px 0 -13px -1.883px;
                text-align: left;
                line-height: 34.5px;
                letter-spacing: -0.45px;
            }

            p, i, a {
                margin-top: 21px;
                font-family: "Lora";
                font-size: 21px;
                letter-spacing: -0.03px;
                line-height: 1.58;
            }

            a {
                text-decoration: underline;
            }

            blockquote {
                font-family: var(--elara-font-display);
                font-size: 30px;
                font-style: italic;
                letter-spacing: -0.36px;
                line-height: 44.4px;
                overflow-wrap: break-word;
                margin: 55px 0 33px 0;
                /* text-align: center; */
                color: rgba(0, 0, 0, 0.68);
                padding: 0 0 0 50px;
            }

            code {
                font-size: 18px;
                background: rgba(0,0,0,.05);
                border-radius: 2px;
                padding: 3px 5px;
            }

            mark, .highlighted {
                background: #7DFFB3;
            }

            .first-letter {
                overflow-wrap: break-word;
                font-family: var(--elara-font-primary);
                font-size: 60px;
                line-height: 60px;
                display: block;
                position: relative;
                float: left;
                margin: 0px 7px 0 -5px;
            }

            .subtitle {
                font-family: var(--elara-font-primary);
                color: rgba(0, 0, 0, 0.54);
                margin: 0 0 24px 0;
            }

            ::selection{background-color: lavender}
            `
        ];
    }

    public async firstUpdated(){
        await this._load(this._toLoad);
    }

    public render(): void | TemplateResult {
        return html`
        <div id="page" class="page" role="main">
            ${!this.loaded ? html`
            <div class="loading">
                <paper-spinner active></paper-spinner>
            </div>` : html``}
            ${this.article ? html`
            <div class="cols">
                <div class="content">
                    <h2>${this.article.title}</h2>
                    ${unsafeHTML(this.article.content)}
                </div>
                ${this.featured ? html`
                <div class="image-container" @click=${onImageContainerClicked}>
                    <iron-image sizing="contain" src="${this.featured}"></iron-image>
                </div>
                ` : html``}
            </div>
            ` : html``}
        </div>
        `;
    }

    private get _page(){
        return this.shadowRoot.querySelector('#page');
    }
}
customElements.define(PageController.is, PageController);