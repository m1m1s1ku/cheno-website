import { property, LitElement, query } from 'lit-element';
import { load, bootstrap } from '../elara';
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

	public abstract get loadables(): string[];
	public router: crayon.Router;

	public get bootstrap(){
		return bootstrap(this.loadables, this);
	}

	public async show(route: string): Promise<void> {
		this.router.navigate(route);
	}

	public connectedCallback(){
		super.connectedCallback();

		if(window.matchMedia(this._queries.DARK).matches){
			document.body.classList.add('night');
		}

		if(window.matchMedia(this._queries.LIGHT).matches){
			document.body.classList.add('day');
		}
	}

	public disconnectedCallback(){
		super.disconnectedCallback();
	}
	
	/**
	 * Togglee dark|light (lightswitch)
	 *
	 * @returns
	 * @memberof Root
	 */
	public switchColors(){
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
		return load(route, this._content);
	}

	protected async _helmetize(route: string){
		await this._fetchHelmet(route);
	}

	private async _fetchHelmet(route: string){
		const component = route.split('/')[0];

		let helmetReq = null;
		if(component === 'page'){
			helmetReq = await fetch(Constants.base + '/' + route);
		} else {
			helmetReq = await fetch(Constants.base + '/' + component);
		}

		const helmet = await helmetReq.json();
		const defaultTitle = 'Cheno';

		if(helmet.title.indexOf('Cheno') === -1){
			helmet.title += ' | ' + defaultTitle;
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

	public createRenderRoot(){
        return this;
    }
}