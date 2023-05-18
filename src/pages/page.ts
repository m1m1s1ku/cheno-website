import { html, TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { property, customElement, query } from 'lit/decorators.js';

import Page from '../core/strategies/Page';
import Constants from '../constants';

import { fadeWith } from '../core/animations';

export interface ProjectMinimal {
    title: string;
    content: string;
    excerpt: string;
    featuredImage: {
        node: {
            sourceUrl: string;
        }
    };
}

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
        query MyQuery {
            pages(where: {name: "${uri}"}) {
              edges {
                node {
                  id
                  title(format: RAW)
                  featuredImage {
                    node {
                      sourceUrl(size: MEDIUM)
                    }
                  }
                  content(format: RENDERED)
                }
              }
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
        }).then(res => res.json()).then(res => res.data.pages.edges.pop().node) as ProjectMinimal;

        this.loaded = true;

        const post = first;

        this.article = post;
        if(post.featuredImage && post.featuredImage.node && post.featuredImage.node.sourceUrl){
            this.featured = post.featuredImage.node.sourceUrl;
        } else {
            this.featured = '';
        }

        const fade = fadeWith(300, true);
        this._page.animate(fade.effect, fade.options);
    }

    public async firstUpdated(): Promise<void> {
        await this._load(this._toLoad);
    }

    public render(): void | TemplateResult {
        return html`
        <div id="page" class="page" role="main">
            ${!this.loaded ? html`
            <div class="loading">
                <elara-spinner text="Chargement de la page"></elara-spinner>
            </div>` : html``}
            ${this.article ? html`
                <div class="content">
                    <h2>${this.article.title}</h2>
                    ${unsafeHTML(this.article.content)}
                </div>
                ${this.featured ? html`
                <div class="image-container">
                    <elara-image sizing="contain" placeholder="Chargement de l'image" src="${this.featured}"></elara-image>
                </div>
                ` : html``}
            ` : html``}
        </div>
        `;
    }
}
