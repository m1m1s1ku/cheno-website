import { html, TemplateResult, css, CSSResult, property, customElement } from 'lit-element';

import PureElement from '../core/strategies/Element';
import { repeat } from 'lit-html/directives/repeat';

/**
 * @class Placeholder
 * @extends {PureElement}
 */
@customElement('ui-placeholder')
export class Placeholder extends PureElement {
    public static readonly is: string = 'ui-placeholder';

    @property({type: Number, reflect: true})
    public max = null;
    @property({type: Number, reflect: false})
    public width: number = null;
    @property({type: Number, reflect: false})
    public height: number = null;

    public static get styles(): CSSResult {
        return css`
        .container {
            width: 100%;
        }

        .line {
            background-color: var(--elara-placeholder-background, rgba(165, 165, 165, .5));
            transition: width .3s;
            margin: 5em auto 10% 5em;
        }
        `;
    }

    private  _rand(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) ) + min;
    }

    private _height(): number {
        const next = this.height ? this.height : this._rand(100, window.innerHeight / (this.max * 2));
        return next > 0 ? next : 10;
    }

    private _width(): number {
        const next = this.width ? this.width : this._rand(0, window.innerWidth / 2.5);
        return next > 0 ? next : 30;
    }

    private _refresh(){
        requestAnimationFrame(() => {
            this.requestUpdate();
        });
    }

    public firstUpdated(){
        setTimeout(() => {
            this._refresh();
        }, 500);
    }

	public render(): TemplateResult { 
        const bars = new Array(this.max);
        return html`
        <div class='container'>
            ${repeat(bars, () => html`
                <div class='line' .style="width: ${this._width()}px; height: ${this._height()}px"></div>
            `)}
        </div>
        `;
    }
}