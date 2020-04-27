import { property, css, CSSResult, customElement, html, LitElement } from 'lit-element';

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
            <mwc-button @click=${() => window.location.replace('https://cheno.fr')}><mwc-icon>home</mwc-icon> Homepage</mwc-button>
        </div>
        `;
    }
}

declare global {
	interface HTMLElementTagNameMap {
		'ui-not-found': NotFound;
	}
}