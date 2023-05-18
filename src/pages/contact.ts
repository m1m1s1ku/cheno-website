import { html, TemplateResult } from 'lit';
import { query, customElement, property } from 'lit/decorators.js';

import Page from '../core/strategies/Page';
import { TextField } from '@material/mwc-textfield';
import { TextArea } from '@material/mwc-textarea';
import { Button } from '@material/mwc-button';
import { pulseWith } from '../core/animations';

import { PDFDocument, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import Constants from '../constants';
import { WPCategory } from '../interfaces';
import { decodeHTML } from '../core/elara';

@customElement('ui-contact')
export class ContactController extends Page {
    public static readonly is: string = 'ui-contact';

    @query('#helper') protected helper!: HTMLTitleElement;
    @query('.simple #name') protected name!: TextField;
    @query('.simple #email') protected email!: TextField;
    @query('.simple #phone') protected phone!: TextField;
    @query('.simple #message') protected message!: TextArea;
    @query('.simple #send') protected send!: Button;

    @property({type: String, reflect: false})
    private preview: string;

    @property({type: Number, reflect: false})
    private current = 0;

    @property({type: Number, reflect: false})
    private max = 0;

    @property({type: Boolean, reflect: true})
    public generating: boolean;

    public loadComponents(): Promise<unknown> {
        return import(/* webpackChunkName: "contact-comps" */'./contact-comps');
    }

    public async connectedCallback(): Promise<void> {
        super.connectedCallback();
        await this.loadComponents();
    }

    private get _contactForm(){
        return html`
    <form class="simple" @input=${(e: KeyboardEvent) => {
        const field = e.target as TextField;
        if(field.validity.customError){
            field.setCustomValidity('');
            this.email.reportValidity();
        }

        const fields = Array.from(this.querySelectorAll('.field mwc-textfield, .field mwc-textarea')) as TextField[];
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

                // const sending = {ok: true, error: null};

                if(sending.ok){
                    this.name.disabled = true;
                    this.email.disabled = true;
                    this.phone.disabled = true;
                    this.message.disabled = true;
                    this.send.disabled = true;

                    this.helper.innerText = 'E-mail envoyé !';

                    const fade = pulseWith(300);
                    const pulse = this.helper.animate(fade.effect, fade.options);

                    await pulse.finished;
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
        `;
    }

    private get _socialLinks(){
        return html`
        <h3>Réseaux sociaux</h3>
        <div class="social-menu">
            <svg id="facebook" @click=${() => {
                window.open('https://www.facebook.com/artistecheno', '_blank');
            }} class="social facebook" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"/></g></svg>
            <svg @click=${() => {
                window.open('https://www.instagram.com/valeriecheno', '_blank');
            }} id="instagram" class="social instagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M12 4.622c2.403 0 2.688.01 3.637.052.877.04 1.354.187 1.67.31.42.163.72.358 1.036.673.315.315.51.615.673 1.035.123.317.27.794.31 1.67.043.95.052 1.235.052 3.638s-.01 2.688-.052 3.637c-.04.877-.187 1.354-.31 1.67-.163.42-.358.72-.673 1.036-.315.315-.615.51-1.035.673-.317.123-.794.27-1.67.31-.95.043-1.234.052-3.638.052s-2.688-.01-3.637-.052c-.877-.04-1.354-.187-1.67-.31-.42-.163-.72-.358-1.036-.673-.315-.315-.51-.615-.673-1.035-.123-.317-.27-.794-.31-1.67-.043-.95-.052-1.235-.052-3.638s.01-2.688.052-3.637c.04-.877.187-1.354.31-1.67.163-.42.358-.72.673-1.036.315-.315.615-.51 1.035-.673.317-.123.794-.27 1.67-.31.95-.043 1.235-.052 3.638-.052M12 3c-2.444 0-2.75.01-3.71.054s-1.613.196-2.185.418c-.592.23-1.094.538-1.594 1.04-.5.5-.807 1-1.037 1.593-.223.572-.375 1.226-.42 2.184C3.01 9.25 3 9.555 3 12s.01 2.75.054 3.71.196 1.613.418 2.186c.23.592.538 1.094 1.038 1.594s1.002.808 1.594 1.038c.572.222 1.227.375 2.185.418.96.044 1.266.054 3.71.054s2.75-.01 3.71-.054 1.613-.196 2.186-.418c.592-.23 1.094-.538 1.594-1.038s.808-1.002 1.038-1.594c.222-.572.375-1.227.418-2.185.044-.96.054-1.266.054-3.71s-.01-2.75-.054-3.71-.196-1.613-.418-2.186c-.23-.592-.538-1.094-1.038-1.594s-1.002-.808-1.594-1.038c-.572-.222-1.227-.375-2.185-.418C14.75 3.01 14.445 3 12 3zm0 4.378c-2.552 0-4.622 2.07-4.622 4.622s2.07 4.622 4.622 4.622 4.622-2.07 4.622-4.622S14.552 7.378 12 7.378zM12 15c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm4.804-8.884c-.596 0-1.08.484-1.08 1.08s.484 1.08 1.08 1.08c.596 0 1.08-.484 1.08-1.08s-.483-1.08-1.08-1.08z"/></g></svg>
        </div>
        `;
    }

    public render(): void | TemplateResult {
        return html`
        <div id="contact" class="contact" role="main">
            <div class="side">
                <h2>Contact</h2>
                <h4 id="helper" class="helper">
                    Réponse rapide, c'est promis !
                </h4>
                ${this._contactForm}
            </div>
            <div class="side layer">
                <h2>Besoin d'une présentation ?</h2>
                <p>Des visites dans le "Jardin des Sculptures" sont possibles sur simple demande, n'hésitez pas !</p>
                <h3>Un rendu papier ?</h3>
                ${this.preview ? html`
                <mwc-button class="book" raised label="Book" icon="picture_as_pdf" @click=${this._download}></mwc-button>
                ` : html`${this.max !== 0 ? html`<div style="width: 100%">Génération en cours ... <mwc-linear-progress progress=${this.current / this.max}></mwc-linear-progress></div>
                ` : html`
                <mwc-button class="book" raised label="Générer le book" icon="picture_as_pdf" @click=${this._generate}></mwc-button>
                `}`}
                <p class="ecology-smile">(à n'imprimer que si nécessaire ! <mwc-icon>tag_faces</mwc-icon>)</p>
                ${this._socialLinks}
            </div>
        </div>
        `;
    }

    private async _pagesMaker(doc: PDFDocument){
        const logoBytes = await fetch(location.origin + '/assets/images/logo.png').then(res => res.arrayBuffer());

        const displayFontBytes = await fetch(location.origin + '/assets/fonts/andika.ttf').then(res => res.arrayBuffer());
        const normalFontBytes = await fetch(location.origin + '/assets/fonts/comfortaa.ttf').then(res => res.arrayBuffer());

        doc.registerFontkit(fontkit);

        const titleSize = 40;
        const detailTitleSize = 20;
        const footerTextSize = 13;

        const currentYear = new Date().getFullYear();
        const period = `${currentYear - 1} - ${currentYear}`;

        const footerText = 'Workbook | ' + currentYear;
        const displayFont = await doc.embedFont(displayFontBytes);
        const normalFont = await doc.embedFont(normalFontBytes);
    
        const logoImage = await doc.embedPng(logoBytes);

        const padding = 30;

        return {
            meta: () => {
                doc.setTitle('Cheno | Book');
                doc.setAuthor('Cheno');
                doc.setSubject('Work');
                doc.setKeywords(['sculpteur', 'fer', 'récupération']);
                doc.setProducer('Cheno-website');
                doc.setCreator('Léonard Cherouvrier');
                doc.setCreationDate(new Date());
                doc.setModificationDate(new Date());
        
                doc.registerFontkit(fontkit);
            },
            first: async (page: PDFPage) => {
                const height = page.getHeight();
                const logoDims = logoImage.scale(.75);
        
                page.drawImage(logoImage, {
                    x: 20,
                    y: height - logoDims.height - padding,
                    width: logoDims.width,
                    height: logoDims.height,
                });
        
                const subject = 'Workbook -';
                const subjectSize = 40;

                const subjectWidth = displayFont.widthOfTextAtSize(subject, subjectSize);
                page.drawText(subject, {
                    x: 30,
                    y: height - logoDims.height - 150,
                    size: subjectSize,
                    font: displayFont
                });
        
                page.drawText('- ' + period, {
                    x: 30 + subjectWidth,
                    y: height - logoDims.height - 225,
                    size: 25,
                    font: displayFont
                });
            },
            series: async (description: ReadonlyArray<WPCategory>, maker) => {
                let page = null;
                let prevY = null;
                let isSub = false;

                this.current = 0;
                this.max = description.length - 1;

                for(const category of description){
                    page = doc.addPage();
                    isSub = false;

                    const {width, height} = page.getSize();
                    prevY = height - padding - titleSize;

                    const categorySize = displayFont.widthOfTextAtSize(category.name, titleSize);

                    prevY = prevY - padding;

                    page.drawText(category.name, {
                        x: width - categorySize - padding,
                        y: prevY,
                        size: titleSize,
                        font: displayFont
                    });

                    let isFirstPage = true;
                    for(const sculpture of category.sculptures.nodes){
                        const extension =  sculpture.featuredImage.node.sourceUrl.substr(sculpture.featuredImage.node.sourceUrl.lastIndexOf('.') + 1);
                        const image = sculpture.featuredImage.node.sourceUrl;
                        const imageBytes = await fetch(image).then(res => res.arrayBuffer());
                        let sculptureImage = null;
                        if(extension == 'jpg' || extension == 'jpeg'){
                            sculptureImage = await doc.embedJpg(imageBytes);
                        } else {
                            sculptureImage = await doc.embedPng(imageBytes);
                        }

                        let sculptureDimension = sculptureImage.scale(.40);
                        if(prevY > 100){
                            maker.footer(page, category.name);
                        }

                        if(isFirstPage){
                            isFirstPage = false;
                        } else {
                            isSub = true;
                            page = doc.addPage();
                            prevY = height - titleSize - padding;
                        }

                        if(isSub){
                            const detailCatSize = displayFont.widthOfTextAtSize(category.name, detailTitleSize);

                            page.drawText('- ' + category.name, {
                                x: width - detailCatSize - padding,
                                y: prevY,
                                size: detailTitleSize,
                                font: displayFont
                            });
                            
                            isSub = false;
                        }

                        prevY = prevY - detailTitleSize - padding - padding;
                        page.drawText(decodeHTML(sculpture.title), {
                            x: padding,
                            y: prevY,
                            size: detailTitleSize,
                            font: displayFont
                        });
                        
                        prevY = prevY - 10 - padding;
                        if(sculpture.taille_sculpture){
                            page.drawText(sculpture.taille_sculpture, {
                                x: padding,
                                y: prevY,
                                size: 10,
                                font: normalFont
                            });
                        }

                        try {
                            if(sculptureImage){
                                const cachePrevY = prevY;
                                prevY = prevY - sculptureDimension.height - padding;

                                const lines = maker.split(sculpture.content);
                                if(prevY - padding - (lines.length * 10) < 0){
                                    console.warn(sculpture.title, 'will overflow, reducing');
                                    sculptureDimension = sculptureImage.scale(.20);

                                    prevY = cachePrevY -sculptureDimension.height - padding;
                                }

                                page.drawImage(sculptureImage, {
                                    x: padding, 
                                    y: prevY,
                                    width: sculptureDimension.width,
                                    height: sculptureDimension.height,
                                });

                                let current = 0;
                                for(const line of lines){
                                    if(!line) continue;

                                    if(current !== 0){
                                        prevY = prevY - 10;
                                    } else {
                                        prevY = prevY - padding - 10;
                                    }

                                    page.drawText(line, {
                                        x: padding,
                                        y: prevY,
                                        size: 10,
                                        font: normalFont
                                    });
                                    current++;
                                }
                            }
                        } catch(err){
                            console.error(err);
                        }
                    }

                    this.current++;

                    maker.footer(page, category.name);
                }
            },
            footer: (page: PDFPage, text = footerText) => {
                const logoDims = logoImage.scale(.25);

                const {width} = page.getSize();

                page.drawImage(logoImage, {
                    x: width - logoDims.width - padding,
                    y: 50,
                    width: logoDims.width,
                    height: logoDims.height,
                });

                if(text){
                    page.drawText(/*doc.getPageCount() - 1 + ' | ' + */text, {
                        x: padding,
                        y: 50,
                        size: footerTextSize,
                        font: normalFont
                    });
                }
            },
            split(content: string){
                const fake = document.createElement('p');
                fake.innerHTML = content;
                content = fake.innerText;
        
                const maxSplit = 90;
                const lines = [''];

                let ch: string;
                let i: number;

                let lineCounter = 0, lineIndex = 0;
    
                for (i = 0; i < content.length; i++) {
                    ch = content[i];
                    if ((ch === ' ' || ch === '\n' || ch === ',')  && lineCounter >= maxSplit) {
                        ch = '';
                        lineCounter = -1;
                        lineIndex++;
                        lines.push('');
                    }

                    lines[lineIndex] += ch;
                    lineCounter++;
                }

                return [].concat(...lines.map(line => line.split('\n')));
            }
        };
    }

    private async _generate(){
        if(this.generating){
            return;
        }
        
        this.generating = true;
        const haslink = document.querySelector('#book-url') as HTMLLinkElement;
        if(haslink){
            this.preview = haslink.href;
            return;
        }

        console.time('Generator');
        const doc = await PDFDocument.create();
        const maker = await this._pagesMaker(doc);
        maker.meta();

        const page = doc.addPage();
        await maker.first(page);
        maker.footer(page, null);

        const requestR = await fetch(Constants.graphql, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `{
                    categories(first: 500) {
                        nodes {
                        sculptures(where: {orderby: {field: MODIFIED, order: DESC}}) {
                            nodes {
                            featuredImage {
                                node {
                                    sourceUrl(size: MEDIUM_LARGE)
                                }
                            }
                            taille_sculpture
                            content(format: RENDERED)
                            title(format: RENDERED)
                            }
                        }
                        name
                        slug
                        }
                    }
                    }`})}).then(res => res.json());

        const categories = requestR.data.categories.nodes.filter(cat => cat.slug !== 'non-classe');

        await maker.series(categories, maker);

        const pdfBytes = await doc.save();
        const blob = new Blob([pdfBytes], {type: 'application/pdf' });

        const bookURL = window.URL.createObjectURL(blob);
        this.preview = bookURL;
        console.timeEnd('Generator');
        this._download();
    }

    private _download(){
        const a = document.createElement('a');
        a.id = 'book-url';
        a.href = this.preview;
        a.download = 'Cheno-book.pdf';
        document.body.appendChild(a);
        a.click();
    }
}
