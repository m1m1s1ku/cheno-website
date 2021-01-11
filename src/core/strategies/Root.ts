import { property, LitElement, query } from 'lit-element';
import { load } from '../elara';
import crayon from 'crayon';
import Constants from '../../constants';

/**
 * Abtract <*-app> component strategy
 *
 * @export
 * @abstract
 * @class Root
 * @extends {LitElement}
 */
export default abstract class Root extends LitElement {
	@property({reflect: true, type: String})
	public route: string;

	@query('#content')
	protected _content: HTMLDivElement;

	private _queries = {
		DARK: '(prefers-color-scheme: dark)',
		LIGHT: '(prefers-color-scheme: light)',
	};

	public router: crayon.Router;

	public abstract get bootstrap(): Promise<unknown>;

	public async show(route: string): Promise<void> {
		this.router.navigate(route);
	}

	public connectedCallback(): void {
		super.connectedCallback();

		if(window.matchMedia(this._queries.DARK).matches){
			document.body.classList.add('night');
		}

		if(window.matchMedia(this._queries.LIGHT).matches){
			document.body.classList.add('day');
		}
	}

	public get shown(): HTMLElement {
		return this._content.firstChild as HTMLElement;
	}
	
	/**
	 * Togglee dark|light (lightswitch)
	 *
	 * @returns
	 * @memberof Root
	 */
	public switchColors(): {
		day: boolean;
		night: boolean;
	}{
		const day = document.body.classList.contains('day');
		const night = document.body.classList.contains('night');

		if(day){
			document.body.classList.remove('day');
			document.body.classList.add('night');
		}

		if(night){
			document.body.classList.remove('night');
			document.body.classList.add('day');
		}

		return {
			day,
			night
		};
	}
		
	public async load(route: string): Promise<void> {
		await this._helmetize(route);
		await load(route, this._content);
		const marker = document.querySelector('meta[name=helmetized]');
		if(marker){
			marker.parentElement.removeChild(marker);
		}
	}

	protected async _helmetize(route: string): Promise<void> {
		await this._fetchHelmet(route);
	}

	private async _fetchHelmet(route: string){
		const component = route.split('/')[0];

		let helmetReq = null;
		if(component === 'page' || component  === 'exposition'){
			helmetReq = await fetch(Constants.base + '/' + route);
		} else {
			helmetReq = await fetch(Constants.base + '/' + component);
		}

		const helmet = await helmetReq.json();
		const defaultTitle = 'Cheno';

		// Nup. PHP helmet already define that correctly
		if(helmet.title  === document.title || helmet.title.indexOf('404') !== -1){
			return;
		}

		document.title = helmet.title ? helmet.title : defaultTitle;

		const desc = helmet.description ? helmet.description : 'Artiste sculpteur sur Fer | Nice';
		const descMeta = document.querySelector('meta[name=description]');
		if(descMeta){
			descMeta.parentElement.removeChild(descMeta);
		}

		const newDesc = document.createElement('meta');
		newDesc.name = 'description';
		newDesc.content =  desc;
		document.head.appendChild(newDesc);
	}

	public createRenderRoot(): Root {
        return this;
    }
}