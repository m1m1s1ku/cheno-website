import { html, TemplateResult } from 'lit-html';
import { property, css, PropertyValues, query, queryAll } from 'lit-element';

import Page from '../core/strategies/Page';
import { repeat } from 'lit-html/directives/repeat';
import Constants from '../constants';
import { wrap } from '../core/errors/errors';
import { WPCategory } from '../interfaces';
import { pulseWith, fadeWith } from '../core/animations';
import { timer, fromEvent, BehaviorSubject, merge, scheduled, animationFrameScheduler, Subject, EMPTY } from 'rxjs';
import { switchMap, tap, takeUntil, startWith, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
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

    @query('.series') protected series!: HTMLElement;
    @query('#unfold') protected unfold!: HTMLElement;
    @query('#pause') protected pause!: HTMLElement;
    @queryAll('[will-pause]') protected pausables: NodeListOf<HTMLElement>;

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
    @property({type: Object, reflect: false})
    private _focused: Sculpture;

    /* Non-updating values */
    private _currentAnimation: Animation;
    private _enforcePauseSub: BehaviorSubject<boolean>;
    private _stop: Subject<unknown>;

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
                position: relative;
                padding: .5em 0;
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

            .series {
                z-index: 4;
            }

            .series .single-container {
                margin-top: 120px;
                margin-left: 3em;
            }

            .series .single-container img {
                max-width: 30vw;
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

            .preview .unfold mwc-icon, .preview .count mwc-icon {
                opacity: .5;
                cursor: pointer;
                transition: opacity .3s linear;
            }

            .preview .count mwc-icon.disabled {
                opacity: 0 !important;
                cursor: default;
            }

            .preview .unfold mwc-icon:hover, .preview .count mwc-icon:hover {
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

            .preview .progress mwc-linear {
                width: 50vw;
            }

            .single-cat {
                display: inline;
                cursor: crosshair;
            }

            .selected .big {
                background-image: linear-gradient(120deg, #002Fa7 0%, #8fd3f4 100%);
                background-repeat: no-repeat;
                background-size: 100% 0.1em;
                background-position: 25px 88%;
                transition: all 0.25s ease-out;
            }
            `
        ];
    }
    
    public disconnectedCallback(){
        super.disconnectedCallback();
        this._stop.next(true);
        this._stop.complete();
    }

    private _setupWalk(){
        this._stop = new Subject();
        this._enforcePauseSub = new BehaviorSubject<boolean>(false);
        const pauseBS = new BehaviorSubject<boolean>(false);

        const items = Array.from(this.pausables);
        const objects = [];
        for(const item of items){
            const click$ = fromEvent<MouseEvent>(item, 'click', (_, key) => key).pipe(
                tap(() => {
                    pauseBS.next(true);
                })
            );
            objects.push(click$);
        };

        const pause$ = pauseBS.asObservable().pipe(
            distinctUntilChanged()
        );

        const events = scheduled(merge(...objects), animationFrameScheduler);
        return events.pipe(
            debounceTime(300),
            startWith(null as Event),
            switchMap(_ => {
                return pause$;
            }),
            map((paused) => {
                const enforced = this._enforcePauseSub.getValue();
                if(paused !== enforced){
                    return enforced;
                } else {
                    return paused;
                }
            }),
            switchMap((paused) => {                    
                this.pause.innerText = paused ? 'pause' : 'play_arrow';

                if(paused) return EMPTY;

                return timer(3500, 3500);
            }),
            takeUntil(this._stop),
            switchMap(async() => {                               
                if(this._canNext()){
                    await this._onNextSculpture();
                } else {
                    let next = this.selected;
                    
                    if(this.selected == this._catMax){
                        next = 0;
                    } else {
                        this.selected++;
                        next = this.selected;
                    }

                    await this._onCatClick(next);
                }
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
        await this.updateComplete;
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

        let animation = pulseWith(300);
        this._currentAnimation = this._previewed.animate(animation.effect, animation.options);
        if(this._focused){
            animation = fadeWith(300, true);
            this.shadowRoot.querySelector('.series').animate(animation.effect, animation.options);
        }
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

    private async _onSingle(){
        const config = fadeWith(300, false);
        const animation = this.series.animate(config.effect, config.options);
        await animation.finished;

        const willFocus = this._focused !== this.categories[this.selected].sculptures.nodes[this.sculpture];
        
        if(willFocus){
            this.unfold.innerText = 'minimize';
            this._focused = this.categories[this.selected].sculptures.nodes[this.sculpture];
            this._enforcePauseSub.next(false);
        } else {
            this.unfold.innerText = 'maximize';
            this._focused = null;
            this._enforcePauseSub.next(true);
        }
    }

    public render(): void | TemplateResult {
        return html`
        <div class="home-container" will-pause>
            ${!this._focused ? html`<div class="series" will-pause>
                <nav>
                    <ul>
                        ${repeat(this.categories, (category, idx) => html`<li class="serie serie-${idx} ${this.selected === idx ? 'selected disabled' : ''}" @click=${() => this.selected === idx ? null : this._onCatClick(idx)}><h1 class="big" will-pause>${category.name}</h1></li>`)}
                    </ul>
                </nav>
            </div>` : html`
            <div class="series" will-pause>
                <div class="single-container" will-pause>
                    <h3 will-pause class="single-cat" @click=${this._onSingle}>- ${this.categories[this.selected].name}</h3>
                    <div class="title-container">
                        <h1 will-pause>${decodeHTML(this._focused.title)}</h1>
                    </div>
                    <div class="content">
                        ${unsafeHTML(this._focused.content)}
                    </div>
                </div>
            </div>
            `}

            <div class="preview">
                <iron-image id="previewed" class="previewed" src=${this.previewing} sizing="contain" fade @click=${this._onSingle}></iron-image>
                <div class="unfold">
                    <mwc-icon id="unfold" @click=${this._onSingle}>maximize</mwc-icon>
                </div>
                <div class="count">
                    <mwc-icon class="${this.selected === 0 && this.sculptureIndex === 1 ? 'disabled' : ''}" @click=${this._onPrevSculpture}>chevron_left</mwc-icon>
                    <div class="pagination"><span class="current">${this.sculptureIndex}</span> / <span class="total">${this.sculptureMax}</span></div> 
                    <mwc-icon @click=${this._onNextSculpture}>chevron_right</mwc-icon>
                    <mwc-icon id="pause" @click=${() => {
                        this._enforcePauseSub.next(!this._enforcePauseSub.getValue());
                    }}>play_arrow</mwc-icon>
                </div>
                <div class="progress">
                    <mwc-linear-progress id="main-progress" progress=${this.sculptureIndex / this.sculptureMax} buffer=${this.selected / this._catMax}></mwc-linear-progress>
                </div>
            </div>
        </div>
        `;
    }
}
customElements.define(Home.is, Home);