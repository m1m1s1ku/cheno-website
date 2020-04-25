import { html, TemplateResult } from 'lit-html';
import { property, PropertyValues, query, queryAll, customElement } from 'lit-element';

import Page from '../core/strategies/Page';
import { repeat } from 'lit-html/directives/repeat';
import Constants from '../constants';
import { WPCategory } from '../interfaces';
import { pulseWith, fadeWith } from '../core/animations';
import { timer, BehaviorSubject, scheduled, animationFrameScheduler, Subject, EMPTY, fromEvent, combineLatest, Subscription } from 'rxjs';
import { switchMap, startWith, debounceTime, map } from 'rxjs/operators';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { LinearProgress } from '@material/mwc-linear-progress';
import { IronImageElement } from '@polymer/iron-image';
import { wrap, slugify, Utils, decodeHTML } from '../core/elara';

enum SwitchingState {
    willPrev = 'prev',
    willNext = 'next'
};

interface Sculpture {
    taille_sculpture?: string;
    featuredImage: {
        sourceUrl: string;
    };
    content: {
        rendered: string;
    };
    title: string;
};

@customElement('ui-home')
export class Home extends Page {
    public static readonly is: string = 'ui-home';

    @query('.series') protected series!: HTMLElement;
    @query('#previewed') protected _previewed!: IronImageElement;
    @query('#pause') protected _pause!: HTMLElement;
    @query('#main-progress') protected progress!: LinearProgress;
    @query('#toggle-grid') protected gridToggle!: HTMLElement;
    @queryAll('ui-placeholder') protected loaders!: NodeListOf<HTMLElement>;

    @property({type: Boolean, reflect: true})
    public loaded = false;
    @property({type: Array, reflect: false})
    public categories: ReadonlyArray<WPCategory> = [];
    @property({type: String, reflect: false})
    public previewing: string | string[];
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
    @property({type: String, reflect: false})
    public viewMode: 'single' | 'multi' = 'single';

    /* Non-updating values */
    private _currentAnimation: Animation;
    private _enforcePauseSub: BehaviorSubject<boolean>;
    private _setup = false;
    private _resetSub: Subject<unknown>;
    private _subs: Subscription;

    public pause(): void {
        if(this._enforcePauseSub){
            this._enforcePauseSub.next(true);
        }
    }

    private _keyDownListener: (e: KeyboardEvent) => void;

    public async connectedCallback(){
        super.connectedCallback();
        this._subs = new Subscription();
        this._keyDownListener = this._onKeyDown.bind(this);

        const requestR = await fetch(Constants.graphql, {
			method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `{
                    categories(first: 500) {
                      nodes {
                        sculptures(where: {orderby: {field: MODIFIED, order: DESC}}) {
                          nodes {
                            featuredImage {
                              sourceUrl(size: MEDIUM_LARGE)
                            }
                            taille_sculpture
                            content(format: RENDERED)
                            title(format: RENDERED)
                          }
                        }
                        name
                        slug
                      }
                    }
                  }`})}).then(res => res.json()).catch(_ => this.dispatchEvent(wrap(_)));

        this.categories = requestR.data.categories.nodes.filter(cat => cat.slug !== 'non-classe');
        await this._restore();

        this.loaded = true;

        window.addEventListener('keydown', this._keyDownListener);
    }
    
    public disconnectedCallback(){
        super.disconnectedCallback();

        window.removeEventListener('keydown', this._keyDownListener);

        this._subs.unsubscribe();
        this._subs = null;
    }

    private _setupWalk(){
        this._enforcePauseSub = new BehaviorSubject<boolean>(false);
        this._resetSub = new Subject();

        const pause$ = combineLatest([this._enforcePauseSub, fromEvent(this._pause, 'click').pipe(startWith(null as Event))]).pipe(
            map(([enforced, _event]) => {
                if(enforced || this._pause.innerText === 'pause'){
                    return true;
                }

                return false;
            })
        );

        const resetOrWait$ = this._resetSub.pipe(
            startWith(undefined),
            switchMap(() => {
                return timer(5000, 5000);
            })
        );

        return scheduled(pause$, animationFrameScheduler).pipe(
            debounceTime(300),
            switchMap((paused) => {                    
                this._pause.innerText = paused ? 'play_arrow' : 'pause';
                if(paused){
                    this.progress.close();
                } else {
                    this.progress.open();
                }

                if(paused) return EMPTY;

                return resetOrWait$;
            }),
            switchMap(async() => {                               
                if(this._canNext()){
                    await this._onNextSculpture();                
                    return;
                }

                this.selected++;

                const next = this.selected == (this._catMax-1) ? 0 : this.selected;
                await this._onCatClick(next);
            })
        );
    }

    private async _onKeyDown(e: KeyboardEvent) {;
        switch(e.keyCode){
            // up arrow
            case 38:
                if(this._focused){
                    return;
                }

                e.preventDefault();
                await this._onCatClick(this.selected-1 < 0 ? this._catMax : this.selected-1);
                break;
            // down arrow
            case 40:
                if(this._focused){
                    return;
                }
                
                e.preventDefault();
                await this._onCatClick(this.selected == this._catMax ? 0 : this.selected+1);
                break;
            // left arrow
            case 37:
                await this._onPrevSculpture();
                break;
            // right arrow
            case 39:
                await this._onNextSculpture();
                break;
        }
    }

    public async firstUpdated(_changedProperties: PropertyValues){
        super.firstUpdated(_changedProperties);

        setTimeout(async() => {
            for(const loader of Array.from(this.loaders)){
                const fadeOut = fadeWith(300, false);
                const animation = loader.animate(fadeOut.effect, fadeOut.options);
                await animation.finished;
            }
        }, 1000);
    }

    private async _restore(){
        const catSculpture = location.pathname.split('/').filter((val) => val !== '' && val !== 'home');
        this.selected = this.categories.findIndex(category => category.slug === catSculpture[0]);

        if(this.selected === -1){
            await this._onCatClick(0);
        } else {
            this._focused = this.categories[this.selected].sculptures.nodes.find((sculpture) => slugify(sculpture.title, '-') === catSculpture[1]);
            const sculptIndex = this.categories[this.selected].sculptures.nodes.findIndex((sculpture) => slugify(sculpture.title, '-') === catSculpture[1]);

            this.sculptureIndex = sculptIndex === -1 ? 1 : sculptIndex + 1;
            this.sculptureMax = this.categories[this.selected].sculptures.nodes.length;
            await this._definePreviewed();
        }
    }

    public async updated(){
        if(this.loaded && !this._setup){
            this._setup = true;
            if(this._subs){
                this._subs.add(this._setupWalk().subscribe());
            }
        }
    }

    private async _onCatClick(idx: number){
        if(this.gridToggle){
            this.gridToggle.innerText = 'view_carousel';
        }

        this.selected = idx;
        this.sculptureIndex = 1;
        this.sculptureMax = this.categories[idx].sculptures.nodes.length;
        
        await this._definePreviewed();

        const catItem = this.querySelector('.series ul li.serie-'+idx+'');
        if(!catItem){
            return;
        }
        
        if(!Utils.isInViewport(catItem)){
            const y = catItem.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({top: y, behavior: 'smooth'});
        }

        await this._fadeCurrent();
        this._resetSub.next();
    }

    private async _fadeCurrent(){
        if(!this._previewed){
            return;
        }

        if(this._currentAnimation){
            this._currentAnimation.cancel();
        }

        const animate = () => {
            let animation = pulseWith(300);
            this._currentAnimation = this._previewed.animate(animation.effect, animation.options);
            if(this._focused){
                animation = fadeWith(300, true);
                this.series.animate(animation.effect, animation.options);
            }
        };

        animate();
    }

    private get _catMax(){
        return this.categories.length - 1;
    }

    private _canPrev(){
        return this.sculptureIndex !== 1;
    }

    private _canNext(){
        return this.sculptureIndex <= this.sculptureMax;
    }

    private get sculpture(){
        return this.sculptureIndex-1;
    }

    private async _definePreviewed(){
        if(this._focused){
            this._focused = this.categories[this.selected].sculptures.nodes[this.sculpture];
            history.pushState({}, this._focused.title, 'home/' + this.categories[this.selected].slug + '/' + slugify(this._focused.title, '-'));
        } else {
            history.pushState({}, this.categories[this.selected].name, 'home/' + this.categories[this.selected].slug);
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
        if(this.gridToggle){
            this.gridToggle.innerText = 'view_carousel';
        }

        if(this.sculptureIndex === 1 && this.selected > 0){
            this.selected--;
            await this._onCatClick(this.selected);
            return;
        }

        if(!this._canPrev()){ return; }

        await this._move(SwitchingState.willPrev);
    }

    private async _onNextSculpture(_e?: Event){
        if(this.gridToggle){
            this.gridToggle.innerText = 'view_carousel';
        }

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
        this._enforcePauseSub.next(willFocus);

        if(willFocus){
            this._focused = this.categories[this.selected].sculptures.nodes[this.sculpture];
            history.pushState({}, this._focused.title, 'home/' + this.categories[this.selected].slug + '/' + slugify(this._focused.title, '-'));
        } else {
            this._focused = null;
            history.pushState({}, this.categories[this.selected].name, 'home/' + this.categories[this.selected].slug);
        }
    }

    public render(): void | TemplateResult {
        return html`
        <div class="home-container">
            ${this.loaded ? html`
            ${!this._focused ? html`<div class="series">
                <nav>
                    <ul>
                        ${repeat(this.categories, (category, idx) => html`<li class="serie serie-${idx} ${this.selected === idx ? 'selected disabled' : ''}" @click=${() => this.selected === idx ? null : this._onCatClick(idx)}><h1 class="big">${category.name}</h1></li>`)}
                    </ul>
                </nav>
            </div>` : html`
            <div class="series">
                <div class="single-container">
                    <h3 class="single-cat" @click=${this._onSingle}>- ${this.categories[this.selected].name}</h3>
                    <div class="title-container">
                        <h1>${decodeHTML(this._focused.title)}</h1>
                    </div>
                    <div>${this._focused.taille_sculpture}</div>
                    <div class="content">
                        ${unsafeHTML(this._focused.content)}
                    </div>
                </div>
            </div>
            `}
            <div class="preview">
                <iron-image id="previewed" class="previewed" src=${this.previewing} sizing="contain" fade="true" @click=${this._onSingle}></iron-image>
                <div class="count">
                    <div class="pagination">
                        <span class="current">${this.sculptureIndex}</span> / <span class="total">${this.sculptureMax}</span>
                    </div> 
                    <div class="controls">
                        <mwc-icon class="${this.selected === 0 && this.sculptureIndex === 1 ? 'disabled' : ''}" @click=${this._onPrevSculpture}>chevron_left</mwc-icon>
                        <mwc-icon @click=${this._onNextSculpture}>chevron_right</mwc-icon>
                        <mwc-icon id="pause" @click=${() => {
                            this._enforcePauseSub.next(!this._enforcePauseSub.getValue());
                        }}>play_arrow</mwc-icon>
                    </div>
                </div>
                <div class="progress">
                    <mwc-linear-progress id="main-progress" progress=${this.sculptureIndex / this.sculptureMax} buffer=${this.selected / this._catMax}></mwc-linear-progress>
                </div>
            </div>
            ` : html`
            <div class="series">
                <div class="single-container loading">
                    <ui-placeholder max="10" height="10"></ui-placeholder>
                </div>
            </div>
            <div class="preview">
                <ui-placeholder max="1" width=${window.innerWidth / 3} height="300"></ui-placeholder>
            </div>
            `}
        </div>
        `;
    }
}