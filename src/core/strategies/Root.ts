import { property, LitElement, query } from 'lit-element';
import { load, bootstrap } from '../elara';
import crayon from 'crayon';

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
		return load(route, this._content);
	}

	public createRenderRoot(){
        return this;
    }
}