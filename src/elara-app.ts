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

	private _subscriptions: Subscription;

	public router: crayon.Router;

	public constructor(){
		super(); 

		// TODO XXX : Remove after SSR complete
        document.title = Constants.title;
		this._subscriptions = new Subscription();

		this.router = crayon.create();
		this.router.path('/', () => {
			return this.load('home');
		});
		this.router.path('/home', () => {
			return this.load('home');
		});

		this.router.path('/page/:page', (req) => {
			return this.load('page/'+req.params.page);
		});

		this.router.path('/blog', () => {
			return this.load('blog');
		});

		this.router.path('/projet/:slug', req => {
			return this.load('projet/'+req.params.slug);
		});

		this.router.path('/post/:slug', (req) => {
			return this.load('post/'+req.params.slug);
		});

		this.router.path('/**', (req) => {
			return this.load(req.pathname.replace('/', ''));
		});

		this._subscriptions.add(this.router.events.subscribe(event => {
			if (event.type === crayon.RouterEventType.SameRouteAbort) {
				this.load(event.data.replace('/', ''));
			}
		 }));

		this.hasElaraRouting = true;
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
		this.router.load();

		requestAnimationFrame(() => {
			this.logoPath.classList.add('write');
			setTimeout(() => {
				this.logoPath.querySelector('path').style.fill = '#000';
			}, 2000);
		});
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
			import('./mwc')
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
		const outsideClickListener = event => {
			if(event.target instanceof ElaraApp){
				this.shadowRoot.querySelector('.main-menu').classList.remove('visible');
				this.shadowRoot.querySelector('.menu').classList.remove('active');
				document.removeEventListener('click', outsideClickListener);
			}
		};
	
		document.addEventListener('click', outsideClickListener);
	}
	
	public render() {
		return html`
			<header>
				<svg @click=${() => {
					if(this.route !== 'home'){
						navigate('home');
					}
				}} class="logo" id="logo" x="0px" y="0px" viewBox="0 0 1556 723">
					<path fill="transparent" stroke="black" stroke-width="4" d="M508.52,508.89c-26.21,1.87-47.48,17.07-71.62,24.68c3.39,63.68,22.43,117.43-3.4,125.48
					c-12.48,1.83-14.59-8.19-17.12-18.81c-4.77-24.93-10.72-52.28-3.04-74.52c-2.69-33.8-28.83-8.56-45.87-5.6
					c-46.85,17.61-92.75,31.77-141.35,44.12c-358.76,95.4-188.94-107.58-148.86-134.23c282.79-214.74,484.72-277.82,525.9-309.22
					c15.11-16.37,55.87-3.79,29.47,9.02c-52.96,36.03-111.25,52.72-166.62,83.74C371.04,301.5-5.12,522.35,32.54,584
					c17.6,41.3,198.46-13.77,219.91-13.53c48.48-12.81,90.17-37.17,139.51-47.4c26.09-5.26,9.61-59.66,14.27-75.58
					c17.12-25.87,1.73-54.8-2-87.32c0.37-7.77,3.94-12.43,9.41-16.8c49.68-29.66,20.35,49.41,23.17,72.68
					c0.33,45.12-4.22,77.79,4.19,86.71c31.76-0.83,70.93-15.47,70.85-50.44c3.84-78.96-14.8-111.31,14.07-122.91
					c33.64-5.55,18.59,33.46,16.76,51.55c-3.01,23.97-3.69,46.65-3.27,71.11c0.84,33.11,37.01,0.39,53.85-1.7
					c72.79-14.79,72.36-75.27,112.81-119.79c14.53-15.83,67.43-78.05,66.01-35.98c-30.85,36.95-67.37,69.99-84.62,118.17
					c268.73-60.97,187.84-283.1,265.12-88.67c6.78-25.93,52.69-116.55,72.96-89.15c21.93,122.97,9.13,88.69,66.1,51.77
					c27.02-42.11,11.02-62.64,38.55-56.62c14.57,7.06,2.07,25.66,9.83,39.57c7.84,21.65,36.15,24.44,51.44,12.17
					c55.82-77.82-34.53-61.02-20.51-88.16c37.71-29.98,86.92-43.26,129.68-67.01c49.26-22.83,92.91-51.24,145.13-67.76
					c97.1-55.69,81.01-53.63,97.99-46.55c-6.13,21.17-79.3,44.5-86.67,54.32c-0.19-0.36-0.5-0.96-0.82-1.57
					c0.47,0.52,0.94,1.05,1.4,1.57c-25.72,16.47-49.95,39.92-78.86,52.97c-81.25,28.4-70.11,34.24-98.05,48.42
					c-18.55,4.17-32.06,18.32-51.16,21.95c-53.91,5.75,20.19,27.87-4.67,91.73c-7.11,20.64-23.92,33.26-46.6,34.14
					c-47.41,1.34-53.27-38.85-66.15-28.37c-41.03,84.21-82.39,70.47-109.71-5.7c-15.05,26.86-32.46,54.86-38.13,86.5
					c-5.62,44.23-27.09,2.63-32.1-14.46c-11.89-29.41-14.45-78.46-31.36-45.22c-91.68,129.64-236.32,106.87-221.76,152.63
					c-1.14,35.47,40.31,19.16,63.06,20.45c95.27-5.54,114.18-32.66,135.18-23.68c21.74,22.81-58.43,30.12-67.18,35.79
					C607.79,548.13,670.2,464.45,626.8,460.3c-26.5,13.65-50.86,21.6-79.47,32.87c-11.84,8.63,0.28,37.04-1,50.49
					c1.43,29.98,6.68,52.16,9.33,81.44c-0.06,8.27-0.75,19.52-12.42,16.98C495.14,637.45,518.15,538.14,508.52,508.89z"
					/>
				</svg>

				<button aria-label="Menu" class="menu" @click=${this._toggleMenu}>
					<svg viewBox="0 0 64 48">
						<path d="M19,15 L45,15 C70,15 58,-2 49.0177126,7 L19,37"></path>
						<path d="M19,24 L45,24 C61.2371586,24 57,49 41,33 L32,24"></path>
						<path d="M45,33 L19,33 C-8,33 6,-2 22,14 L45,37"></path>
					</svg>
				</button>
				<div class="main-menu">
					<nav>
						<ul>
							${repeat(this._menuItems, (item) => html`<li><h3 @click=${() => {
								if(item.url.indexOf(Constants.base) !== -1){
									item.url = item.url.replace(Constants.base, '');
								}

								navigate(item.url);
							}}>${item.label}</h3></li>`)}
						</ul>
					</nav>
				</div>
			</header>
			<main id="main" class="content"></main>
			<footer>
			&copy; ${new Date().getFullYear()}. Cheno
			</footer>
		`;
	}
}

customElements.define(ElaraApp.is, ElaraApp);
