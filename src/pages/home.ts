import { html, TemplateResult } from 'lit-html';
import { property, css, PropertyValues } from 'lit-element';

import Page from '../core/strategies/Page';
import { repeat } from 'lit-html/directives/repeat';
import Constants from '../constants';
import { wrap } from '../core/errors/errors';
import { WPCategory } from '../interfaces';
import { pulseWith } from '../core/animations';
import { timer, fromEvent, BehaviorSubject, EMPTY, merge } from 'rxjs';
import { exhaustMap, concatMapTo, switchMap, tap, startWith, distinctUntilChanged } from 'rxjs/operators';
import { PaperProgressElement } from '@polymer/paper-progress';
import { Utils } from '../core/ui/ui';

enum SwitchingState {
    willPrev = 'prev',
    willNext = 'next'
};

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
    public sculptureIndex = 1;
    @property({type: Number, reflect: false})
    public sculptureMax = 0;

    @property({type: Number, reflect: false})
    public serieProgress = 0;

    /* Non-updating values */
    private _currentAnimation: Animation;

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

            .series ul li.selected {
               cursor: default;
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
                cursor: pointer;
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

            .preview .progress {
                position: absolute;
                bottom: 0;
                width: 50vw;
            }

            .preview .progress paper-progress {
                width: 50vw;
                --paper-progress-active-color: rgb(0, 47, 167);
                --paper-progress-secondary-color: rgba(0, 47, 167, .5);
                --paper-progress-transition-duration: 0.08s;
                --paper-progress-transition-timing-function: ease;
                --paper-progress-transition-delay: 0.08s;
            }
            `
        ];
    }

    private _setupWalk(){
        const pauseBS = new BehaviorSubject<boolean>(false);
        const pause$ = pauseBS.pipe(
            distinctUntilChanged()
        );

        const items = Array.from(this.shadowRoot.querySelectorAll('[will-pause]'));
        const objects = [];
        for(const item of items){
            const enter$ = fromEvent<MouseEvent>(item, 'mouseenter', (_, key) => key).pipe(
                tap(() => {
                    pauseBS.next(true);
                })
            );
    
            const leave$ = fromEvent<MouseEvent>(item, 'mouseout', (_, key) => key).pipe(
                tap(() => {
                    pauseBS.next(false);
                })
            );
            objects.push(enter$, leave$);
        };

        const pauseHandle = merge(...objects).pipe(
            concatMapTo(pause$),
            startWith(false)
        );

        return pauseHandle.pipe(
            switchMap(paused => {
                if(paused === true){
                    return EMPTY;
                }

                return timer(3000, 3000).pipe(
                    exhaustMap(async () => {
                        const progress = this.shadowRoot.querySelector('#main-progress') as PaperProgressElement;
        
                        const animations = progress.getAnimations();
                        progress.classList.add('transiting');
        
                        if(this._canNext()){
                            await this._onNextSculpture();
                        } else {
                            let next = this.selected;
                            
                            if(this.selected == this._catMax){
                                next = 0;
                                this._onCatClick(0);
                            } else {
                                this.selected++;
                                next = this.selected;
                            }
        
                            await this._onCatClick(next);
                        }
        
                        for(const animation of animations){
                            await animation.finished;
                        }
        
                        requestAnimationFrame(() => {
                            progress.classList.remove('transiting');
                        });
                    }),
                );
            })
        ).toPromise();
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

        await this._onCatClick(0);
        this.loaded = true;

        await this._setupWalk();
    }

    private async _onCatClick(idx: number){
        this.selected = idx;
        this.sculptureIndex = 1;
        this.sculptureMax = this.categories[idx].sculptures.nodes.length;
        await this._definePreviewed();

        const catItem = this.shadowRoot.querySelector('.series ul li.serie-'+idx+'');
        if(!catItem){
            return;
        }
        
        if(!Utils.isInViewport(catItem)){
            const y = catItem.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({top: y, behavior: 'smooth'});
        }

        if(this._currentAnimation){
            await this._currentAnimation.finished;
        }

        await this._fadeCurrent();
    }

    private async _fadeCurrent(){
        if(this._currentAnimation){
            await this._currentAnimation.finished;
        }

        const animation = pulseWith(300);
        this._currentAnimation = this._previewed.animate(animation.effect, animation.options);
        this._currentAnimation = null;
    }

    private get _previewed(){
        return this.shadowRoot.querySelector('#previewed');
    }

    private get _catMax(){
        return this.categories.length - 1;
    }

    private _canPrev(){
        return this.sculpture > 0;
    }

    private _canNext(){
        return this.sculptureIndex+1 <= this.sculptureMax;
    }

    private get sculpture(){
        return this.sculptureIndex-1;
    }

    private async _definePreviewed(){
        this.previewing = this.categories[this.selected].sculptures.nodes[this.sculpture].featuredImage.sourceUrl;
        await this.updateComplete;
    }

    private async _move(state: SwitchingState){
        switch(state){
            case SwitchingState.willPrev:
                this.sculptureIndex--;
                break;
            case SwitchingState.willNext:
                this.sculptureIndex++;
                break;
        }

        await this._definePreviewed();
        await this._fadeCurrent();   
    }

    private async _onPrevSculpture(_e?: Event){
        if(!this._canPrev()){ return; }

        await this._move(SwitchingState.willPrev);
    }

    private async _onNextSculpture(_e?: Event){
        if(!this._canNext()){ return; }

        await this._move(SwitchingState.willNext);
    }

    public render(): void | TemplateResult {
        return html`
        <div class="home-container">
            <div class="series">
                <nav>
                    <ul>
                        ${repeat(this.categories, (category, idx) => html`<li class="serie-${idx} ${this.selected === idx ? 'selected disabled' : ''}" @click=${() => this.selected === idx ? null : this._onCatClick(idx)}><h1 class="big">${category.name}</h1></li>`)}
                    </ul>
                </nav>
            </div>
            <div class="preview">
                <iron-image will-pause id="previewed" class="previewed" src=${this.previewing} sizing="contain" fade></iron-image>
                <div class="unfold">
                    <iron-icon will-pause icon="unfold-more"></iron-icon>
                </div>
                <div class="count">
                    <iron-icon will-pause icon="chevron-left" class="${this.sculpture === 0 ? 'disabled' : ''}" @click=${this._onPrevSculpture}></iron-icon> 
                    <div class="pagination"><span class="current">${this.sculptureIndex}</span> / <span class="total">${this.sculptureMax}</span></div> 
                    <iron-icon will-pause icon="chevron-right" class="${this.sculptureIndex === this.sculptureMax ? 'disabled' : ''}" @click=${this._onNextSculpture}></iron-icon>
                </div>
                <div class="progress">
                    <paper-progress 
                        id="main-progress" 
                        active 
                        value=${(this.sculptureIndex / this.sculptureMax) * 100}
                        secondary-progress=${(this.selected / this._catMax) * 100}
                    ></paper-progress>
                </div>
            </div>
        </div>
        `;
    }
}
customElements.define(Home.is, Home);