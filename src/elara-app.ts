import { html, property, SVGTemplateResult, query, customElement } from 'lit-element';

import crayon from 'crayon';

import Root from './core/strategies/Root';

import Constants from './constants';

import { repeat } from 'lit-html/directives/repeat';
import { SVGLogo, HamburgerIcon } from './icons';

import './pages/index';
import './atoms/index';
import { Home } from './pages/home';

import(/* webpackChunkName: "polyfill" */'./polyfill');

interface WPLink {
	id: string; label: string; url: string;
	icon?: SVGTemplateResult;
}

@customElement('elara-app')
export class ElaraApp extends Root {
	// NOTE : Home is the only loadable, but we are not using a global loader on this website
	public get loadables(): string[] {
		return [];
	}

	public static readonly is: string = 'elara-app';

	public default = 'home';

	@query('svg.logo') _logoPath!: SVGElement;
	@query('.menu') _menu!: HTMLDivElement;
	@query('.main-menu') _menuContainer!: HTMLDivElement;

	@property({type: Array, reflect: false, noAccessor: true})
	private _menuItems: ReadonlyArray<WPLink> = [];

	@property({type: Array, reflect: false, noAccessor: true})
	public legalLinks: WPLink[] = [];
	@property({type: Array, reflect: false, noAccessor: true})
	public socialLinks: WPLink[] = [];
	@property({type: Boolean, reflect: true, noAccessor: true})
	public loaded: boolean;

	@property({type: Array, reflect: false, noAccessor: true})
	public socialThumbs: {
		src: string;
		shortcode: string;
	}[];

	@property({type: String, reflect: false, noAccessor: true})
	public logo: string;

	public theme: 'night' | 'day' = 'day';

	public constructor(){
		super();

		this.router = crayon.create();
		this.router.path('/', this._routerLoad('home'));
		this.router.path('home', this._routerLoad('home'));
		this.router.path('expos', this._routerLoad('expos'));
		this.router.path('/page/:page', this._routerLoad('page', 'page'));
		this.router.path('/exposition/:slug', this._routerLoad('exposition', 'slug'));
		this.router.path('**', this._routerLoad(null));
	}

	private _routerLoad(path: string, param?: string): crayon.handlerFunc {
		return (ctx, _state, _app) => {
			if(!path){
				return this.load(ctx.pathname.replace('/', ''));
			}

			if(param){
				return this.load(path + '/' + ctx.params[param]);
			}
			
			return this.load(path);
		};
	}

	public connectedCallback(){
		super.connectedCallback();
		this._defineColors();
		window.matchMedia('(prefers-color-scheme: dark)').addListener(
			e => e.matches && this._defineColors('night')
		);
		window.matchMedia('(prefers-color-scheme: light)').addListener(
			e => e.matches && this._defineColors('day')
		);
	}

	public disconnectedCallback(){
		super.disconnectedCallback();
	}

	private _defineColors(enforce?: 'night' | 'day'){
		this.theme = enforce ? enforce : document.body.classList.contains('night') ? 'night' : 'day';

		requestAnimationFrame(() => {
			this._logoPath.classList.add('write');
			if(this.theme === 'night'){
				this._logoPath.querySelector('path').style.stroke = 'white';
			} else {
				this._logoPath.querySelector('path').style.stroke = 'black';
			}

			const switchSVG = () => {
				if(this.theme === 'night'){
					this._logoPath.querySelector('path').style.fill = 'white';
				} else {
					this._logoPath.querySelector('path').style.fill = 'black';
				}
			};

			setTimeout(() => {
				switchSVG();
			}, 300);
		});
	}

	/**
	 * Setup bootstrap for website
	 *
	 * @private
	 * @memberof ElaraApp
	 */
	private async _setup(){
		const requestR = await fetch(Constants.graphql, {
			method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `{
					terrazzo {
					  logo
					}
					menus {
                        edges {
                          node {
                            id
                            name
                            slug
                            menuItems {
                              edges {
                                node {
                                  id
                                  url
                                  label
                                }
                              }
                            }
                          }
                        }
                      }
				  }`
            })
		}).then(res => res.json());

		const colors = requestR.data.terrazzo;
		this.logo = colors.logo;
		const mainMenu = requestR.data.menus.edges.find(menu => menu.node.slug === 'menu');
		let items = mainMenu.node.menuItems.edges;
		items = items.map(item => item.node);
		this._menuItems = items;
		await this.performUpdate();
	}

	public async firstUpdated(): Promise<void> {
		await this.router.load();

		this.loaded = true;
	}

	/**
	 * Bootstrap is launched by boot.js
	 * Could contains any kind of promise who will be handled by global promise loader
	 *
	 * @readonly
	 * @memberof ElaraApp
	 */
	public get bootstrap(){		
		return Promise.all([
			this._setup(),
			import(/* webpackChunkName: "polymer" */'./polymer'),
			import(/* webpackChunkName: "mwc" */'./mwc')
		]);
	}

	private _toggleMenu(_event: Event){
		this._menuContainer.classList.toggle('visible');
		this._menu.classList.toggle('active');

		if(this._menu.classList.contains('active')){
			if(this.shown instanceof Home){
				this.shown.pause();
			}
		}
	}

	private _hideMenu(){
		this._menuContainer.classList.remove('visible');
		this._menu.classList.remove('active');
	}

	private _menuItem(item: WPLink){
		return html`<li><h3 @click=${() => {
			if(item.url.indexOf(Constants.base) !== -1){
				item.url = item.url.replace(Constants.base, '');
			}

			this.router.navigate(item.url);
			this._hideMenu();
		}}>${item.label}</h3></li>`;
	}
	
	public render() {
		const menu = this._menuItem.bind(this);

		return html`
			<header>
				<span @click=${() => this.route !== Constants.defaults.route ? this.router.navigate('home') : null} class="drawing-logo">
					${SVGLogo}
				</span>
				<button aria-label="Menu" class="menu" @click=${this._toggleMenu}>${HamburgerIcon}</button>
				<div class="main-menu">
					<nav>
						<ul>
						${repeat(this._menuItems, menu)}
						</ul>
					</nav>
				</div>
			</header>
			<main id="content" class="content"></main>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'elara-app': ElaraApp;
	}
}
