import { html, TemplateResult } from 'lit-html';
import { property, css, PropertyValues } from 'lit-element';

import Page from '../core/strategies/Page';
import { repeat } from 'lit-html/directives/repeat';
import Constants from '../constants';
import { wrap } from '../core/errors/errors';
import { WPCategory } from '../interfaces';
import { pulseWith } from '../core/animations';
import { timer, fromEvent, BehaviorSubject, EMPTY, merge, scheduled, animationFrameScheduler, of } from 'rxjs';
import { exhaustMap, concatMapTo, switchMap, tap, startWith, distinctUntilChanged, concatMap } from 'rxjs/operators';
import { PaperProgressElement } from '@polymer/paper-progress';
import { Utils, decodeHTML } from '../core/ui/ui';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';

enum SwitchingState {
    willPrev = 'prev',
    willNext = 'next'
};

interface Sculpture {
    featuredImage: {
        sourceUrl: string;
    };
    content: {
        rendered: string;
    };
    title: string;
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
    @property({type: Object, reflect: false})
    private _focused: Sculpture;

    private _enforcePauseSub: BehaviorSubject<boolean>;

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
                display: inline;
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
                margin: 10px;
            }

            .series, .preview {
                height: 100vh;
                width: 50vw;
            }

            .series .single-container {
                margin-top: 120px;
                margin-left: 3em;
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
                --paper-progress-indeterminate-cycle-duration: 7s;

                --paper-progress-transition-timing-function: ease;
                --paper-progress-transition-delay: 0.08s;
            }
            `
        ];
    }

    private get _progress(): PaperProgressElement{
        return this.shadowRoot.querySelector('#main-progress');
    }

    private _setupWalk(){
        this._enforcePauseSub = new BehaviorSubject<boolean>(false);
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

        const pauseHandle = scheduled(merge(...objects).pipe(
            concatMapTo(pause$),
            startWith(false)
        ), animationFrameScheduler);

        return pauseHandle.pipe(
            switchMap(paused => {
                return this._enforcePauseSub.pipe(
                    concatMap(enforced => enforced !== paused ? of(enforced) : of(paused))
                );
            }),
            switchMap(paused => {
                this._progress.indeterminate = !paused;
                if(paused === true){
                    return EMPTY;
                }

                return timer(3000, 3000).pipe(
                    exhaustMap(async() => {
                        const animations = this._progress.getAnimations();
                        this._progress.classList.add('transiting');
        
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
                            animation.cancel();
                        }
        
                        this._progress.classList.remove('transiting');
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
                        sculptures(where: {orderby: {field: MODIFIED, order: DESC}}) {
                          nodes {
                            featuredImage {
                              sourceUrl(size: LARGE)
                            }
                            content(format: RENDERED)
                            title(format: RENDERED)
                          }
                        }
                        name
                        slug
                      }
                    }
                  }
                  `})})
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

        await this._fadeCurrent();
    }

    private async _fadeCurrent(){
        if(this._currentAnimation){
            this._currentAnimation.cancel();
        }

        const animation = pulseWith(300);
        this._currentAnimation = this._previewed.animate(animation.effect, animation.options);
    }

    private get _previewed(){
        return this.shadowRoot.querySelector('#previewed');
    }

    private get _catMax(){
        return this.categories.length - 1;
    }

    private _canPrev(){
        return this.sculptureIndex !== 1;
    }

    private _canNext(){
        return this.sculptureIndex+1 <= this.sculptureMax;
    }

    private get sculpture(){
        return this.sculptureIndex-1;
    }

    private async _definePreviewed(){
        if(this._focused){
            this._focused = this.categories[this.selected].sculptures.nodes[this.sculpture];
        }

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
        if(this.sculptureIndex === 1 && this.selected > 0){
            this.selected--;
            await this._onCatClick(this.selected);
            return;
        }

        if(!this._canPrev()){ return; }

        await this._move(SwitchingState.willPrev);
    }

    private async _onNextSculpture(_e?: Event){
        if(this.sculptureIndex === this.sculptureMax){
            if(this.selected+1 <= this._catMax){
                this.selected++;
            } else {
                this.selected = 0;
            }

            await this._onCatClick(this.selected);
            return;
        }

        if(!this._canNext()){ return; }

        await this._move(SwitchingState.willNext);
    }

    public render(): void | TemplateResult {
        return html`
        <div class="home-container">
            ${!this._focused ? html`<div class="series">
                <nav>
                    <ul>
                        ${repeat(this.categories, (category, idx) => html`<li class="serie-${idx} ${this.selected === idx ? 'selected disabled' : ''}" @click=${() => this.selected === idx ? null : this._onCatClick(idx)}><h1  will-pause class="big">${category.name}</h1></li>`)}
                    </ul>
                </nav>
            </div>` : html`
            <div class="series">
                <div class="single-container">
                    <h1>${decodeHTML(this._focused.title)}</h1>
                    ${unsafeHTML(this._focused.content)}
                </div>
            </div>
            `}

            <div class="preview">
                <iron-image will-pause id="previewed" class="previewed" src=${this.previewing} sizing="contain" fade @click=${() => {
                    if(this._focused === this.categories[this.selected].sculptures.nodes[this.sculpture]){
                        this._focused = null;
                        this._enforcePauseSub.next(false);
                    } else {
                        this._focused = this.categories[this.selected].sculptures.nodes[this.sculpture];
                        this._enforcePauseSub.next(true);
                    }
                }}></iron-image>
                <div class="unfold">
                    <iron-icon will-pause icon="unfold-more"></iron-icon>
                </div>
                <div class="count">
                    <iron-icon will-pause icon="chevron-left" class="${this.selected === 0 && this.sculptureIndex === 1 ? 'disabled' : ''}" @click=${this._onPrevSculpture}></iron-icon> 
                    <div class="pagination"><span class="current">${this.sculptureIndex}</span> / <span class="total">${this.sculptureMax}</span></div> 
                    <iron-icon will-pause icon="chevron-right" @click=${this._onNextSculpture}></iron-icon>
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