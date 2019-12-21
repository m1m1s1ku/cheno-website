import { html, TemplateResult } from 'lit-html';
import { css, query } from 'lit-element';

import Page from '../core/strategies/Page';
import { fadeWith } from '../core/animations';

class ContactController extends Page {
    public static readonly is: string = 'ui-contact';

    @query('.simple #name') protected name!: HTMLInputElement;
    @query('.simple #email') protected email!: HTMLInputElement;
    @query('.simple #phone') protected phone!: HTMLInputElement;
    @query('.simple #message') protected message!: HTMLTextAreaElement;

    public static get styles(){
        return [
            ... super.styles,
            css`
            .contact {
                display: grid;
                margin-top: 4em;

                grid-template-columns: repeat(2, 1fr);

                padding: 2em;
                padding-top: 6em;

                --mdc-notched-outline-leading-width: 10px;
                --mdc-notched-outline-trailing-border-radius: 0 10px 10px 0;
                --mdc-radio-unchecked-color:  var(--elara-primary);
                --mdc-theme-primary: var(--elara-primary);
            }


            mdc-formfield {
                color: white;
            }

            form {
                display: flex;
                flex-direction: column;
                width: auto;
            }

            form .field.send {
                display: flex;
                justify-content: flex-end;
                padding: 0;
            }

            form .field > mwc-textfield,
            form .field > mwc-textarea {
                margin: 1em 0;
                width: 100%;
            }

            form .field.send > mwc-button {
                width: auto;
            }

            .side.layer {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                background-color: rgba(0, 47, 167, 0.75);
                color: white;
                margin: -2em 0 2em 1em;
                padding: 2em;
                margin-top: -2em;
                transition: all .3s;
            }

            .side.layer h3,
            .side.layer p {
                user-select: none;
            }

            .side.layer form {
                background: whitesmoke;
                padding: 1em;
                margin: 1em 0;
                border-radius: 2px;
            }

            .ask {
                margin: 1em .5em;
                align-self: flex-end;
            }

            .quality {
                padding: 2em;
            }

            .quality label {
                color: var(--elara-secondary);
            }

            @media (max-width: 485px){
                .contact {
                    display: block;
                }
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div id="contact" class="contact" role="main">
            <div class="side">
                <h1>Contact</h1>
                <form class="simple">
                    <div class="field">
                        <mwc-textfield
                            id="name"
                            label="Nom"
                            iconTrailing="account_box"
                        ></mwc-textfield>
                    </div>
                    <div class="field">
                        <mwc-textfield
                            id="email"
                            label="E-mail"
                            iconTrailing="mail_outline"
                        ></mwc-textfield>
                    </div>
                    <div class="field">
                        <mwc-textfield
                            id="phone"
                            label="Téléphone"
                            iconTrailing="phone"
                        ></mwc-textfield>
                    </div>
                    <div class="field">
                        <mwc-textarea 
                            id="message"
                            label="Message"
                        ></mwc-textarea>
                    </div>
                    <div class="field send">
                        <mwc-button disabled raised label="Envoyer" icon="send" trailingIcon @click=${async() => {
                            console.warn('will send', {
                                name: this.name.value,
                                email: this.email.value,
                                phone: this.phone.value,
                                message: this.message.value
                            });
                        }}></mwc-button>
                    </div>
                </form>
            </div>
            <div class="side layer">
                <h3>Visite</h3>
                <p>Envie d'entrer dans un monde de Coccinelles ?</p>
                <form>
                    <mwc-textfield required label="Date" icon="event"></mwc-textfield>
                    <mwc-textarea label="Message" placeholder="J'aimerais visiter le jardin pour..."></mwc-textarea>
                    <div class="quality" @change=${async (_e: Event) => {
                        const radio = _e.target as HTMLInputElement;
                        let animationConfig = fadeWith(100, false);
                        let animation = this._qualityLabel.animate(animationConfig.effect, animationConfig.options);
                        await animation.finished;

                        if(radio.value === 'particulier'){
                            this._qualityLabel.innerText = 'un';
                        } else {
                            this._qualityLabel.innerText = 'une';
                        }

                        animationConfig = fadeWith(100, true);
                        animation = this._qualityLabel.animate(animationConfig.effect, animationConfig.options);
                        await animation.finished;
                    }}>
                        <label>Je suis <span id="quality-label">une</span></label>
                        <mwc-formfield label="Entreprise">
                            <mwc-radio value="entreprise" name="location" checked></mwc-radio>
                        </mwc-formfield>
                        <mwc-formfield label="Particulier">
                            <mwc-radio value="particulier" name="location"></mwc-radio>
                        </mwc-formfield>
                    </div>
                    <div class="ask">
                        <mwc-button disabled raised icon="send" trailingIcon ></mwc-button>
                    </div>
                </form>
            </div>
        </div>
        `;
    }

    private get _qualityLabel(): HTMLSpanElement {
        return this.shadowRoot.querySelector('#quality-label');
    }
}
customElements.define(ContactController.is, ContactController);