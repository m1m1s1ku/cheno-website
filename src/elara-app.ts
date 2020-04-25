import { html, property, SVGTemplateResult, query, customElement } from 'lit-element';

import crayon from 'crayon';

import Root from './core/strategies/Root';

import Constants from './constants';

import { Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat';
import { SVGLogo, HamburgerIcon } from './icons';

import './pages/index';
import './atoms/index';

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

	@property({type: Array, reflect: false, noAccessor: true})
	private _menuItems: ReadonlyArray<WPLink> = [];

	@property({type: Array, reflect: false, noAccessor: true})
	public legalLinks: WPLink[] = [];
	@property({type: Array, reflect: false, noAccessor: true})
	public socialLinks: WPLink[] = [];
	@query('svg.logo') logoPath!: SVGElement;	
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
	private _subscriptions: Subscription;

	public constructor(){
		super(); 

		if(!document.title){
			document.title = Constants.title;
		}

		this._subscriptions = new Subscription();

		this.router = crayon.create();
		this.router.path('/', async () => {
			await this.load('home');
		});

		this.router.path('/page/:page', async (req) => {
			await this.load('page/'+req.params.page);
		});

		this.router.path('/exposition/:slug', async (req) => {
			await this.load('exposition/'+req.params.slug);
		});

		this.router.path('/**', async (req) => {
			await this.load(req.pathname.replace('/', ''));
		});

		this._subscriptions.add(this.router.events.subscribe(async event => {
			if (event.type !== crayon.RouterEventType.SameRouteAbort) {
				return;
			}

			const route = event.data.replace('/', '');
			await this.load(route);
		}));
	}

	public connectedCallback(){
		super.connectedCallback();
		this._defineColors();
	}

	public disconnectedCallback(){
		super.disconnectedCallback();
	}

	private _defineColors(){
		this.theme = document.body.classList.contains('night') ? 'night' : 'day';

		if(document.body.classList.contains('night')){
			document.documentElement.style.setProperty('--mdc-theme-primary', 'var(--elara-font-color)');
			document.documentElement.style.setProperty('--elara-placeholder-background', 'rgba(165,165,165,.5)');
			document.documentElement.style.setProperty('--elara-background-color', '#373737');
			document.documentElement.style.setProperty('--elara-font-color', '#f0f0f0');
			document.documentElement.style.setProperty('--elara-font-hover', '#9e9e9e');
		} else {
			document.documentElement.style.setProperty('--mdc-theme-primary', 'var(--elara-primary)');
			document.documentElement.style.setProperty('--elara-placeholder-background', 'rgba(67, 84, 128, 0.5)');
			document.documentElement.style.removeProperty('--elara-background-color');
			document.documentElement.style.removeProperty('--elara-font-color');
			document.documentElement.style.removeProperty('--elara-font-hover');
		}

		requestAnimationFrame(() => {
			this.logoPath.classList.add('write');
			if(this.theme === 'night'){
				this.logoPath.querySelector('path').style.stroke = 'white';
			} else {
				this.logoPath.querySelector('path').style.stroke = 'black';
			}


			const switchSVG = () => {
				if(this.theme === 'night'){
					this.logoPath.querySelector('path').style.fill = 'white';
				} else {
					this.logoPath.querySelector('path').style.fill = 'black';
				}
			};

			if(this.loaded){
				switchSVG();
				return;
			}

			setTimeout(() => {
				switchSVG();
			}, 2000);
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
		setTimeout(() => {
			this.loaded = true;
		}, 2000);
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
		this.querySelector('.main-menu').classList.toggle('visible');
		this.querySelector('.menu').classList.toggle('active');
	}

	private _menuItem(item: WPLink){
		return html`<li><h3 @click=${() => {
			if(item.url.indexOf(Constants.base) !== -1){
				item.url = item.url.replace(Constants.base, '');
			}

			this.router.navigate(item.url);
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
			<footer>
				<span class="copy">&copy; ${new Date().getFullYear()}. Cheno</span>
			</footer>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'elara-app': ElaraApp;
	}
}
