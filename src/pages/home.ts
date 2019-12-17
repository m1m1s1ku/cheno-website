import { html, TemplateResult } from 'lit-html';
import { property, css, PropertyValues } from 'lit-element';

import Page from '../core/strategies/Page';
import { repeat } from 'lit-html/directives/repeat';
import Constants from '../constants';
import { wrap } from '../core/errors/errors';
import { WPCategory } from '../interfaces';
import { fadeWith } from '../core/animations';

class Home extends Page {
    public static readonly is: string = 'ui-home';

    @property({type: Boolean, reflect: false})
    public loaded = false;
    @property({type: Array, reflect: false})
    public categories: ReadonlyArray<WPCategory> = [];
    @property({type: String, reflect: false})
    public previewing: string;
    @property({type: Number, reflect: false})
    public selected = 0;
    @property({type: Number, reflect: false})
    public sculptureIndex = 0;
    @property({type: Number, reflect: false})
    public sculptureMax = 0;

    public static get styles(){
        return [
            ... super.styles,
            css`
            .home-container {
                display: grid;
                height: 100%;
                grid-auto-columns: 1fr;
                grid-auto-flow: column;
            }

            .series ul {
                margin-top: 100px;
                text-align: right;
            }

            .series ul li {
                line-height: 3em;
                margin-right: 3em;
                font-weight: bold;
                cursor: pointer;
                opacity: .5;
                transition: .3s opacity;
            }

            .series ul li:hover, .series ul li.selected {
                opacity: 1;
            }

            .series ul li h1.big {
                font-family: var(--elara-font-display);
                font-size: 1.2em;
            }

            @media (min-width: 500px){
                .series ul li {
                    line-height: 5em;
                    margin-right: 5em;
                }

                .series ul li h1.big {
                    font-size: 1.5em;
                }
            }

            .previewed {
                height: 75vh;
                width: 50vw;
            }

            .series, .preview {
                height: 100vh;
                width: 50vw;
            }

            .preview {
               display: flex;
               align-items: center;
               position: fixed;
               right: 0;
            }

            .preview .count, .preview .unfold  {
                position: absolute;
                right: 10px;
                bottom: 30px;
                user-select: none;
                display: flex;
                justify-content: flex-end;
                line-height: 1.4em;
            }

            .preview .unfold {
                left: 10px;
                justify-content: flex-start;
            }

            .preview .unfold iron-icon, .preview .count iron-icon {
                opacity: .5;
                cursor: pointer;
                transition: opacity .3s linear;
            }

            .preview .count iron-icon.disabled {
                opacity: 0 !important;
                cursor: default;
            }

            .preview .unfold iron-icon:hover, .preview .count iron-icon:hover {
                opacity: 1;
            }

            .preview .count .pagination {
                display: inline;
            }
            `
        ];
    }

    public async firstUpdated(_changedProperties: PropertyValues){
        super.firstUpdated(_changedProperties);

        const requestR = await fetch(Constants.graphql, {
			method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `{
                    categories {
                      nodes {
                        sculptures {
                          nodes {
                            featuredImage {
                              sourceUrl(size: LARGE)
                            }
                            title(format: RENDERED)
                          }
                        }
                        name
                        slug
                      }
                    }
                  }`})})
            .then(res => res.json()).catch(_ => this.dispatchEvent(wrap(_)));

            this.categories = requestR.data.categories.nodes;

            this._onCatClick(0);
            this.loaded = true;
    }

    private _onCatClick(idx: number){
        this.selected = idx;
        this.sculptureIndex = 0;
        this.sculptureMax = 0;
        this.sculptureMax = this.categories[idx].sculptures.nodes.length;
        this.previewing = this.categories[idx].sculptures.nodes[this.sculptureIndex].featuredImage.sourceUrl;
        this._fadeCurrent();
    }

    private _fadeCurrent(){
        const animation = fadeWith(300, true);
        this._previewed.animate(animation.effect, animation.options);
    }

    private get _previewed(){
        return this.shadowRoot.querySelector('#previewed');
    }

    public render(): void | TemplateResult {
        return html`
        <div class="home-container">
            <div class="series">
                <nav>
                    <ul>
                        ${repeat(this.categories, (category, idx) => html`<li class="${this.selected === idx ? 'selected' : ''}" @click=${() => this._onCatClick(idx)}><h1 class="big">${category.name}</h1></li>`)}
                    </ul>
                </nav>
            </div>
            <div class="preview">
                <iron-image id="previewed" class="previewed" src=${this.previewing} sizing="contain" fade></iron-image>
                <div class="unfold">
                    <iron-icon icon="unfold-more"></iron-icon>
                </div>
                <div class="count">
                    <iron-icon icon="chevron-left" class="${this.sculptureIndex === 0 ? 'disabled' : ''}" @click=${() => {
                        if(this.sculptureIndex-1 >= 0){
                            this.sculptureIndex--;
                            this.previewing = this.categories[this.selected].sculptures.nodes[this.sculptureIndex].featuredImage.sourceUrl;
                            this._fadeCurrent();
                        }
                    }}></iron-icon> 
                    <div class="pagination"><span class="current">${this.sculptureIndex+1}</span> / <span class="total">${this.sculptureMax}</span></div> 
                    <iron-icon icon="chevron-right" class="${this.sculptureIndex === this.sculptureMax-1 ? 'disabled' : ''}" @click=${() => {
                        if(this.sculptureIndex+1 <= this.sculptureMax-1){
                            this.sculptureIndex++;
                            this.previewing = this.categories[this.selected].sculptures.nodes[this.sculptureIndex].featuredImage.sourceUrl;
                            this._fadeCurrent();
                        }
                    }}></iron-icon>
                </div>
            </div>
        </div>
        `;
    }
}
customElements.define(Home.is, Home);