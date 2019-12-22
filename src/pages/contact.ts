import { html, TemplateResult } from 'lit-html';
import { css, query } from 'lit-element';

import Page from '../core/strategies/Page';
import { navigate } from '../core/routing/routing';
import { TextField } from '@material/mwc-textfield';
import { TextArea } from '@material/mwc-textarea';
import { Button } from '@material/mwc-button';

class ContactController extends Page {
    public static readonly is: string = 'ui-contact';

    @query('.simple #name') protected name!: TextField;
    @query('.simple #email') protected email!: TextField;
    @query('.simple #phone') protected phone!: TextField;
    @query('.simple #message') protected message!: TextArea;
    @query('.simple #send') protected send!: Button;

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
                align-items: flex-start;
                margin: 4em;
                padding: 2em;
                border-left: 1px solid #CCC;
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

            .book {
                align-self: flex-end;
            }

            .ecology-smile {
                display: flex;
                align-items: center;
            }

            .side.layer svg, .side.layer mwc-icon {
                display: inline-block;
                width: 30px;
                height: 30px;
                cursor: pointer;
            }

            .helper {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
            }
            `
        ];
    }

    public render(): void | TemplateResult {
        return html`
        <div id="contact" class="contact" role="main">
            <div class="side">
                <h2>Remplissez juste, le formulaire.</h2>
                <h4 class="helper">Réponse rapide, c'est promis !</h4>
                <form class="simple" @input=${(e: KeyboardEvent) => {
                    const field = e.target as TextField;
                    if(field.validity.customError){
                        field.setCustomValidity('');
                        this.email.reportValidity();
                    }

                    const fields = Array.from(this.shadowRoot.querySelectorAll('.field mwc-textfield, .field mwc-textarea')) as TextField[];
                    this.send.disabled = fields.some(field => field.checkValidity() === false);
                }}>
                    <div class="field">
                        <mwc-textfield
                            id="name"
                            label="Nom"
                            iconTrailing="account_box"
                            required
                            pattern=".{1,}"
                        ></mwc-textfield>
                    </div>
                    <div class="field">
                        <mwc-textfield
                            type="email"
                            id="email"
                            label="E-mail"
                            required
                            iconTrailing="mail_outline"
                        ></mwc-textfield>
                    </div>
                    <div class="field">
                        <mwc-textfield
                            required
                            id="phone"
                            label="Téléphone"
                            iconTrailing="phone"
                        ></mwc-textfield>
                    </div>
                    <div class="field">
                        <mwc-textarea 
                            id="message"
                            required
                            label="Message"
                            pattern=".{1,}"
                        ></mwc-textarea>
                    </div>
                    <div class="field send">
                        <mwc-button id="send" disabled raised label="Envoyer" icon="send" trailingIcon @click=${async() => {
                            if(!(this.name.value && this.name.value.length > 0 &&
                                this.email.value && this.email.value.length > 0 &&
                                this.message.value && this.message.value.length > 0 && 
                                this.phone.value && this.phone.value.length > 0))
                            {

                                return;
                            }

                            const formData = new FormData();
                            formData.set('name', this.name.value);
                            formData.set('email', this.email.value);
                            formData.set('telephone', this.phone.value);
                            formData.set('message', this.message.value);
                            const headers = new Headers();
                            headers.append('Accept', 'application/json');
                            const sending = await fetch('https://formspree.io/mdoaggpz',{
                                method: 'POST',
                                body: formData,
                                headers
                            }).then(res => res.json());

                            if(sending.ok){
                                this.name.disabled = true;
                                this.email.disabled = true;
                                this.phone.disabled = true;
                                this.message.disabled = true;
                                this.send.disabled = true;
                            } else {
                                if(sending.error && sending.error.indexOf('_replyto') !== -1){
                                    this.email.setCustomValidity('E-mail invalide');
                                    this.email.reportValidity();
                                    this.send.disabled = true;
                                    
                                    return;
                                }

                                throw new Error(sending.error);
                            }
                        }}></mwc-button>
                    </div>
                </form>
            </div>
            <div class="side layer">
                <h2>Besoin d'une présentation ?</h2>
                <p>Des visites dans le "Jardin des Sculptures" sont possibles sur simple demande, n'hésitez pas !</p>
                <h3>Un rendu papier ?</h3>
                <mwc-button class="book" disabled raised label="Book numérique" icon="picture_as_pdf"></mwc-button>
                <p class="ecology-smile">(à n'imprimer que si nécessaire ! <mwc-icon>tag_faces</mwc-icon>)</p>
                <h3>Réseaux sociaux</h3>
                <div class="social-menu">
                    <svg id="facebook" @click=${() => {
                        navigate('https://www.facebook.com/artistecheno');    
                    }} class="social facebook" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"/></g></svg>
                    <svg @click=${() => {
                        navigate('https://www.instagram.com/valeriecheno');    
                    }} id="instagram" class="social instagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 4.622c2.403 0 2.688.01 3.637.052.877.04 1.354.187 1.67.31.42.163.72.358 1.036.673.315.315.51.615.673 1.035.123.317.27.794.31 1.67.043.95.052 1.235.052 3.638s-.01 2.688-.052 3.637c-.04.877-.187 1.354-.31 1.67-.163.42-.358.72-.673 1.036-.315.315-.615.51-1.035.673-.317.123-.794.27-1.67.31-.95.043-1.234.052-3.638.052s-2.688-.01-3.637-.052c-.877-.04-1.354-.187-1.67-.31-.42-.163-.72-.358-1.036-.673-.315-.315-.51-.615-.673-1.035-.123-.317-.27-.794-.31-1.67-.043-.95-.052-1.235-.052-3.638s.01-2.688.052-3.637c.04-.877.187-1.354.31-1.67.163-.42.358-.72.673-1.036.315-.315.615-.51 1.035-.673.317-.123.794-.27 1.67-.31.95-.043 1.235-.052 3.638-.052M12 3c-2.444 0-2.75.01-3.71.054s-1.613.196-2.185.418c-.592.23-1.094.538-1.594 1.04-.5.5-.807 1-1.037 1.593-.223.572-.375 1.226-.42 2.184C3.01 9.25 3 9.555 3 12s.01 2.75.054 3.71.196 1.613.418 2.186c.23.592.538 1.094 1.038 1.594s1.002.808 1.594 1.038c.572.222 1.227.375 2.185.418.96.044 1.266.054 3.71.054s2.75-.01 3.71-.054 1.613-.196 2.186-.418c.592-.23 1.094-.538 1.594-1.038s.808-1.002 1.038-1.594c.222-.572.375-1.227.418-2.185.044-.96.054-1.266.054-3.71s-.01-2.75-.054-3.71-.196-1.613-.418-2.186c-.23-.592-.538-1.094-1.038-1.594s-1.002-.808-1.594-1.038c-.572-.222-1.227-.375-2.185-.418C14.75 3.01 14.445 3 12 3zm0 4.378c-2.552 0-4.622 2.07-4.622 4.622s2.07 4.622 4.622 4.622 4.622-2.07 4.622-4.622S14.552 7.378 12 7.378zM12 15c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm4.804-8.884c-.596 0-1.08.484-1.08 1.08s.484 1.08 1.08 1.08c.596 0 1.08-.484 1.08-1.08s-.483-1.08-1.08-1.08z"/></g></svg>
                </div>
            </div>
        </div>
        `;
    }
}
customElements.define(ContactController.is, ContactController);