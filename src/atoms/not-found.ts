import { property, css, CSSResult, customElement, html, LitElement } from 'lit-element';
import { Elara } from '../core/elara';

@customElement('ui-not-found')
export class NotFound extends LitElement {
    @property({type: String, reflect: true})
    public asked: string;

    public constructor(asked: string){
        super();
        this.asked = asked;
    }

    public static get styles(): CSSResult {
        return css`
        h1, p {
            user-select: none;
            z-index: 1;
        }

        a {
            color: var(--elara-primary);
            text-decoration: none;
            cursor: pointer;
        }
        `;
    }

	public render() {
        return html`
        <div>
            <h1>You are lost !</h1>
            <p>You asked for : ${this.asked}.</p>
            <a @click=${() => Elara().router.navigate('home')}><mwc-icon icon="home"></mwc-icon> Homepage</a>
        </div>
        `;
    }
}

declare global {
	interface HTMLElementTagNameMap {
		'ui-not-found': NotFound;
	}
}