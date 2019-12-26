import { html, CSSResult, property, SVGTemplateResult, query } from 'lit-element';

import crayon from 'crayon';

import Root from './core/strategies/Root';

import './pages/index';
import './atoms/not-found';

import Constants from './constants';
import { wrap } from './core/errors/errors';

import { Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat';
import { navigate } from './core/routing/routing';
import { MainStyling } from './main-styling';
import { SVGLogo, HamburgerIcon } from './icons';

// Polyfills
import('./polyfill');

interface WPLink {
	id: string; label: string; url: string;
	icon?: SVGTemplateResult;
}

export class ElaraApp extends Root {
	public static readonly is: string = 'elara-app';

	public default = 'home';

	@property({type: Array, reflect: false, noAccessor: true})
	private _menuItems: ReadonlyArray<WPLink> = [];

	@property({type: Array, reflect: false, noAccessor: true})
	public legalLinks: WPLink[] = [];
	@property({type: Array, reflect: false, noAccessor: true})
	public socialLinks: WPLink[] = [];
	@query('svg.logo') logoPath!: SVGElement;

	@property({type: Array, reflect: false, noAccessor: true})
	public socialThumbs: {
		src: string;
		shortcode: string;
	}[];

	@property({type: String, reflect: false, noAccessor: true})
	public logo: string;

	public router: crayon.Router;
	public theme: 'dark' | 'light' = 'light';

	private _subscriptions: Subscription;
	private _onSchemeChangeListener: (e: CustomEvent<{colorScheme: 'dark' | 'light'}>) => void;

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

		this._subscriptions.add(this.router.events.subscribe(event => {
			if (event.type !== crayon.RouterEventType.SameRouteAbort) {
				return;
			}

			this.load(event.data.replace('/', ''));
		}));

		this._onSchemeChangeListener = this._onSchemeChange.bind(this);
		this.hasElaraRouting = true;
	}

	public connectedCallback(){
		super.connectedCallback();
		document.addEventListener('colorschemechange', this._onSchemeChangeListener);
	}

	public disconnectedCallback(){
		super.disconnectedCallback();
		document.removeEventListener('colorschemechange', this._onSchemeChangeListener);
	}

	private _onSchemeChange(e: CustomEvent<{colorScheme: 'dark' | 'light'}>){
		this.theme = e.detail.colorScheme;

		if(this.theme === 'dark'){
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
			if(this.theme === 'dark'){
				this.logoPath.querySelector('path').style.stroke = 'white';
			} else {
				this.logoPath.querySelector('path').style.stroke = 'black';
			}


			const switchSVG = () => {
				if(this.theme === 'dark'){
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
		}).then(res => res.json()).catch(_ => this.dispatchEvent(wrap(_)));

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
			import('./polymer'),
			import('./mwc'),
			import('./labs')
		]);
	}

	public static get styles(): CSSResult[] {
		return [MainStyling];
	}

	private _toggleMenu(event: Event){
		this.shadowRoot.querySelector('.main-menu').classList.toggle('visible');
		const activated = this.shadowRoot.querySelector('.menu').classList.toggle('active');
		
		if(activated){
			// cancel first click event
			event.preventDefault();
			event.stopPropagation();
			// then set escape listener
			this._hideOnClickOutside();
		}
	}

	private _hideOnClickOutside() {
		const outsideClickListener = (event: Event) => {
			if(event.target instanceof ElaraApp){
				this.shadowRoot.querySelector('.main-menu').classList.remove('visible');
				this.shadowRoot.querySelector('.menu').classList.remove('active');
				document.removeEventListener('click', outsideClickListener);
			}
		};
	
		document.addEventListener('click', outsideClickListener);
	}

	private _menuItem(item: WPLink){
		return html`<li><h3 @click=${() => {
			if(item.url.indexOf(Constants.base) !== -1){
				item.url = item.url.replace(Constants.base, '');
			}

			navigate(item.url);
		}}>${item.label}</h3></li>`;
	}
	
	public render() {
		return html`
			<header>
				<span @click=${() => this.route !== Constants.defaults.route ? navigate('home') : null} class="drawing-logo">
					${SVGLogo}
				</span>
				<button aria-label="Menu" class="menu" @click=${this._toggleMenu}>${HamburgerIcon}</button>
				<div class="main-menu">
					<dark-mode-toggle permanent id="dark-mode" appearance="toggle"></dark-mode-toggle>
					<nav>
						<ul>
						${repeat(this._menuItems, this._menuItem)}
						</ul>
					</nav>
				</div>
			</header>
			<main id="main" class="content"></main>
			<footer>
				<span class="copy">&copy; ${new Date().getFullYear()}. Cheno</span>
			</footer>
		`;
	}
}

customElements.define(ElaraApp.is, ElaraApp);
