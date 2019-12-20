import { html, TemplateResult } from 'lit-html';
import { css } from 'lit-element';

import Page from '../core/strategies/Page';

class ContactController extends Page {
    public static readonly is: string = 'ui-contact';

    public static get styles(){
        return [
            ... super.styles,
            css`
            .contact {
                padding: 2em;
                padding-top: 6em;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div id="contact" class="contact" role="main">
            <h1>Get in touch</h1>
            <form>
                <mwc-textfield
                    label="E-mail"
                    iconTrailing="mail_outline"
                    outlined
                >
                </mwc-textfield>
                <mwc-textarea 
                    label="message"
                    iconTrailing="note_Add"
                    outlined
                ></mwc-textarea>
            </form>
        </div>
        `;
    }
}
customElements.define(ContactController.is, ContactController);