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
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                padding: 2em;
                padding-top: 6em;
                --mdc-notched-outline-leading-width: 10px;
                --mdc-notched-outline-trailing-border-radius: 0 10px 10px 0;
            }

            form {
                display: flex;
                flex-direction: column;
                width: auto;
            }

            form .field {
                display: flex;
                justify-content: flex-end;
                padding: 0;
            }

            form .field > * {
                margin: 1em 0;
                width: 100%;
            }

            .side.layer {
                padding: 2em;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div id="contact" class="contact" role="main">
            <div class="side">
            <h1>Contact</h1>
            <form>
                <div class="field">
                    <mwc-textfield
                        label="E-mail"
                        iconTrailing="mail_outline"
                        outlined
                    ></mwc-textfield>
                </div>
                <div class="field">
                    <mwc-textarea 
                        label="Message"
                        outlined
                    ></mwc-textarea>
                </div>
                <div class="field">
                    <mwc-button raised label="Envoyer" icon="send" trailingIcon></mwc-button>
                </div>
            </form>
            </div>
            <div class="side layer">
                Otheer side
            </div>
        </div>
        `;
    }
}
customElements.define(ContactController.is, ContactController);