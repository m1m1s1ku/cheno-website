import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { css, property } from 'lit-element';

import Page from '../core/strategies/Page';
import { navigate } from '../core/routing/routing';

import Constants from '../constants';
import { decodeHTML } from '../core/ui/ui';

interface ArticleMinimal {
    content: string;
    date_expo: string;
    excerpt: string;
    featuredImage: {
        sourceUrl: string;
    };
    id: string;
    place: string;
    slug: string;
    title: string;
};

class Expos extends Page {
    public static readonly is: string = 'ui-expos';

    @property({type: Array, reflect: false})
    public articles: ReadonlyArray<ArticleMinimal> = [];
    @property({type: Array, reflect: false})
    private ghost: ReadonlyArray<ArticleMinimal> = [];

    public static get styles(){
        return [
            ... super.styles,
            css`
            .expos {
                --text-light: rgba(255,255,255,0.9);
                --spacing-s: 8px;
                --spacing-l: 24px;
                --spacing-xl: 64px;
                --width-container: 100vw;

                padding: var(--spacing-xl) var(--spacing-l);
                align-items: flex-start;
                display: flex;
                min-height: 100%;
                justify-content: center;
                flex-direction: column;

                margin-top: 3em;
            }

            .title-search {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-direction: row;
                width: 100%;
            }

            .card {
                list-style: none;
                position: relative;
            }
              
            .card:before {
                content: '';
                display: block;
                padding-bottom: 150%;
                width: 100%;
            }
              
            .card__background {
                background-size: cover;
                background-position: center;
                border-radius: 4px;
                bottom: 0;
                filter: brightness(0.75) saturate(1.2) contrast(0.85);
                left: 0;
                position: absolute;
                right: 0;
                top: 0;
                transform-origin: center;
                trsnsform: scale(1) translateZ(0);
                transition: 
                    filter 200ms linear,
                    transform 200ms linear;
            }
              
            .card:hover .card__background {
                transform: translateZ(0);
            }
            
            .card-grid:hover > .card:not(:hover) .card__heading,
            .card-grid:hover > .card:not(:hover) .card__date,
            .card-grid:hover > .card:not(:hover) .card__place {
                mix-blend-mode: overlay;
            }
            .card-grid:hover > .card:not(:hover) .card__background {
                filter: brightness(.8) contrast(.7) blur(2px);
            }
              
            .card__content {
                left: 0;
                padding: var(--spacing-l);
                position: absolute;
                top: 0;
            }
              
            .card__place, .card__date {
                color: var(--text-light);
                font-size: 1em;
                margin-bottom: var(--spacing-s);
            }
              
            .card__heading {
                color: var(--text-light);
                font-size: 1.5em;
                text-shadow: 2px 2px 20px rgba(0,0,0,0.2);
                line-height: 1.4;
                word-spacing: 3px;
            }

            .card-grid {
                display: grid;
                grid-template-columns: repeat(1, 1fr);
                grid-column-gap: var(--spacing-l);
                grid-row-gap: var(--spacing-l);
                margin-top: 2em;
                max-width: var(--width-container);
                width: 100%;
                transition: all 2s;
            }
            
            @media(min-width: 540px) {
                .card-grid {
                    grid-template-columns: repeat(2, 1fr); 
                }
            }
            
            @media(min-width: 960px) {
                .card-grid {
                    grid-template-columns: repeat(4, 1fr); 
                }
            }
            `
        ];
    }
    
    public async firstUpdated(){
        this._load();
        document.title = 'Expositions' + ' | ' + Constants.title;
    }
    
    private async _load(){
        const articlesR = await fetch(Constants.graphql, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `{
                    expositions(first: 500) {
                      nodes {
                        id
                        title(format: RENDERED)
                        slug
                        excerpt(format: RENDERED)
                        content
                        place
                        date_expo
                        featuredImage {
                          sourceUrl(size: LARGE)
                          title(format: RAW)
                        }
                      }
                    }
                  }`
            })
        });

        const articlesJson = await articlesR.json();
        const res = articlesJson.data.expositions.nodes;

        this.articles = res;
        this.ghost = res;
        this.loaded = true;
    }

    public search(value: string){
        this.articles = this.ghost.filter(item => item.title.toLowerCase().indexOf(value.toLowerCase()) !== -1);
    }

    public render(): void | TemplateResult {
        return html`
        <div class="expos" role="main">
            <div class="title-search">
                <h1>Expositions</h1>
                <div class="periods">
                    
                </div>
                <mwc-textfield label="Recherche" @input=${(event: CustomEvent) => {
                    const target = event.target as HTMLInputElement;
                    this.search(target.value);
                }}></mwc-textfield>
            </div>
            ${!this.loaded ? html`<paper-spinner active></paper-spinner>` : html``}
            <div class="card-grid">
                ${repeat(this.articles, article => html`
                <a class="card" @click=${() => {
                    navigate('post/'+article.slug);
                }}>
                    <div class="card__background" style="background-image: url(${article.featuredImage.sourceUrl})"></div>
                    <div class="card__content">
                        <p class="card__place">${article.place}</p>
                        <h3 class="card__heading">${decodeHTML(article.title)}</h3>
                        <p class="card__date">${article.date_expo}</p>
                    </div>
                </a>
                `)}
            </div>

            ${this.loaded && this.articles.length === 0 ? html`
                <p>Aucune exposition à afficher</p>
            ` : html``}
        </div>
        `;
    }
}
customElements.define(Expos.is, Expos);