import { html, TemplateResult } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { css, property, query, queryAll, customElement } from 'lit-element';

import Page from '../core/strategies/Page';

import Constants from '../constants';
import RafPool from 'raf-pool';
import { fadeWith } from '../core/animations';
import { decodeHTML, Elara } from '../core/elara';

export interface ArticleMinimal {
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

@customElement('ui-expos')
export class Expos extends Page {
    public static readonly is: string = 'ui-expos';

    @property({type: Array, reflect: false})
    public articles: ReadonlyArray<ArticleMinimal> = [];
    @property({type: Array, reflect: false})
    private ghost: ReadonlyArray<ArticleMinimal> = [];

    @query('.card-grid') protected grid!: HTMLElement;
    @queryAll('.card') protected cards!: NodeListOf<HTMLElement>;

    private rafPool: RafPool;
    @property({type: Object, reflect: false})
    private exposByYear: Map<number, ArticleMinimal[]> = new Map<number, ArticleMinimal[]>();
    private _year: number;
    private _intersectionObserver: IntersectionObserver;

    public static get styles(){
        return [
            css`
            .expos {
                --text-light: rgba(255,255,255,0.9);
                --mdc-tab-text-transform: normal;
                --spacing-s: 8px;
                --spacing-l: 24px;
                --spacing-xl: 64px;
                --mdc-tab-text-label-color-default: var(--elara-font-color);

                height: 100%;
                width: 100%;
                color: var(--elara-font-color);
            }

            .title-search {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-direction: row;
                width: 100%;
            }

            .title-search mwc-textfield {
                margin: 0 0 0 1em;
            }
            
            .card {
                list-style: none;
                position: relative;
                transition: opacity .3s;
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
                margin: 0;
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
                width: 100%;
                transition: filter .3s;
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

            .card.hide {
                opacity: 0;
            }

            .periods {
                width: 100%;
            }

            .expositions-grid {
                padding: 0em 3em;
                margin-top: 7em;
                width: 90vw;
            }
            `
        ];
    }
    
    public async firstUpdated(){
        this._load();
        if(!document.title){
            document.title = 'Expositions' + ' | ' + Constants.title;
        }
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
                          sourceUrl(size: MEDIUM_LARGE)
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

        const exposByYear = new Map<number, ArticleMinimal[]>();
        for(const expo of res){
            const period = parseInt(expo.date_expo.match(/\d{4}/)[0], 10);
            if(period && exposByYear[period]){
                exposByYear.set(period, [...exposByYear[period], expo]);
            } else {
                exposByYear.set(period, [expo]);
            }
        }

        this.exposByYear = new Map([...exposByYear.entries()].sort((a, b) => b[0]-a[0]));
        await this.updateComplete;

        this.rafPool = new RafPool();

        const canUpdate = function(entry: IntersectionObserverEntry){ return entry.intersectionRatio >= 0; };

        const update = (card: HTMLElement) => {
            return function() {
                card.classList.remove('hide');
            };
        };

        const setup = (pool: RafPool) => {
            return new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
                for(const entry of entries){
                    if(!canUpdate(entry)) continue;

                    const target = entry.target as HTMLElement;
                    pool.add(target.id, update(target));

                    this._intersectionObserver.unobserve(target);
                };
            });
        };

        this._intersectionObserver = setup(this.rafPool);
        const cards = Array.from(this.cards);
        for(const card of cards){
            this._intersectionObserver.observe(card);
        }
    }

    public disconnectedCallback(){
        super.disconnectedCallback();
        this.rafPool.reset();
    }

    public search(value: string){
        this.articles = this.ghost.filter(item => item.title.toLowerCase().indexOf(value.toLowerCase()) !== -1);
    }

    public render(): void | TemplateResult {
        return html`
        <div class="expos" role="main">
            <div class="expositions-grid">
            <div class="title-search">
                <h1>Expositions</h1>
                <mwc-textfield label="Recherche" @input=${(event: CustomEvent) => {
                    const target = event.target as HTMLInputElement;
                    this.search(target.value);
                }}></mwc-textfield>
            </div>
            <div class="periods">
                <mwc-tab-bar scrolling>
                    ${repeat(this.exposByYear, ([year, _expos]) => html`<mwc-tab dir label=${year} @click=${async () => {     
                        if(this._year === year) return;

                        const filtering = this.ghost.filter((article) => parseInt(article.date_expo.match(/\d{4}/)[0], 10) == year);
                        this.articles = filtering;
                        await this.updateComplete;
                        Array.from(this.grid.querySelectorAll('.card.hide')).forEach((item) => {
                            item.classList.remove('hide');
                            item.classList.add('reveal');
                        });

                        const animation = fadeWith(300, true);
                        this.grid.animate(animation.effect, animation.options);
                        this._year = year;
                    }}></mwc-tab>`)}
                <mwc-tab-bar>
            </div>
            ${!this.loaded ? html`<div class="loader"><paper-spinner active></paper-spinner></div>` : html``}
            <div class="card-grid">
                ${repeat(this.articles, article => html`
                <a id=${article.id} class="card hide" @click=${() => {
                    Elara().router.navigate('exposition/'+article.slug);
                }}>
                    <div class="card__background" style="background-image: url(${article.featuredImage?.sourceUrl}); background-color: #333;"></div>
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
        </div>
        `;
    }
}