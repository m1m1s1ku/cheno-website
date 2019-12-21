import { html, TemplateResult } from 'lit-html';
import { css, query } from 'lit-element';

import Page from '../core/strategies/Page';

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
                margin: 0 0 2em 1em;
                margin-top: -2em;
                transition: all .3s;
                padding: 4em;
            }

            .side.layer h3,
            .side.layer p {
                user-select: none;
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
                <h2>Remplissez juste, le formulaire.</h2>
                <h4>On répond vite, c'est promis !</h4>
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
                <h4>Envie de voir les oeuvres dans leur milieu naturel ?</h4>
                <p>Des visites dans le "Jardin des Sculptures" sont possibles sur simple demande, n'hésitez pas !</p>

            </div>
        </div>
        `;
    }
}
customElements.define(ContactController.is, ContactController);