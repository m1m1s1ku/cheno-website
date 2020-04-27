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
        h1, p { user-select: none; }

        a {
            color: var(--elara-primary);
            text-decoration: none;
            cursor: pointer;
        }

        .body {
            position: absolute;
            width: 78px;
            height: 100px;
            top: 50%;
            left: 50%;
            border-radius: 100%;
            border-width: 0;
            border-left:solid 40px #000;
            background-color: #0149ff;
        }
        .body:after {
          display: block;
          content: '';
          width: 100%;
          height: 2px;
          position: absolute;
          background: var(--elara-primary);
          top: 50%;
        }
        .body > .eyes {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
        }
        
        .body > .eyes:after {
          display: block;
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #000;
          position: absolute;
        }
        .body > .eyes.left { top: 25%; left: -30%; }
        .body > .eyes.right { top: 65%; left: -30%; }
        
        .body > .spot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #000;
          position: absolute;
         }
        .body > .spot1 { top:25%; left:50%; }
        .body > .spot2 { top:57%; left:65%; }
        .body >.spot3 { top:30%; left:20%; }
        
        .body > .spot4 {
          top:70%;
          left:45%;
        }
        
        .body > .spot5 {
          top:60%;
          left:26%;
        }
        
        .ladybug {
            position: absolute;
            bottom: 0;
            right: 100px;
            top: 0;
            pointer-events: none;
            transform: rotate(45deg);
        }
        `;
    }

	public render() {
        return html`
        <div>
            <h1>You are lost !</h1>
            <p>You asked for : ${this.asked}.</p>
            <mwc-button @click=${() => window.location.replace('https://cheno.fr')}><mwc-icon>home</mwc-icon> Homepage</mwc-button>

            <div class="ladybug">
                <div class="body">
                    <div class="eyes left"></div>
                    <div class="eyes right"></div>
                    <div class="spot spot1"></div>
                    <div class="spot spot2"></div>
                    <div class="spot spot3"></div>
                    <div class="spot spot4"></div>
                    <div class="spot spot5"></div>
                </div>
            </div>
        </div>
        `;
    }
}

declare global {
	interface HTMLElementTagNameMap {
		'ui-not-found': NotFound;
	}
}