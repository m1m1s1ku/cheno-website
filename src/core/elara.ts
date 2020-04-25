import { pulseWith } from './animations';
import { css, TemplateResult } from 'lit-element';

export interface Root extends HTMLElement {
    loadables: ReadonlyArray<string>;
    links: ReadonlyArray<{name: string; route: string}>;
    menu(isHide: boolean): Promise<void>;
    show(route: string): Promise<void>;
}
export interface UpdatableElement extends HTMLElement {
    requestUpdate(name?: PropertyKey, oldValue?: unknown): Promise<unknown>;
}
export interface LoadableElement extends UpdatableElement { loaded: boolean }

export function Elara(){ return document.querySelector('elara-app'); }

export function bootstrap(loadables: string[], host: HTMLElement) {
    const loadPromises = [];
    for(const element of loadables){
        const load = new Promise((resolve) => {
            const elem = host.querySelector(element) as LoadableElement;
            const config = { attributes: true };
            const observer = new MutationObserver((mutation) => {
                if(!mutation.length){ return; }
                if (mutation[0].type == 'attributes' && mutation[0].attributeName === 'loaded') {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(elem, config);
        });
        loadPromises.push(load);
    }
    
    return Promise.all(loadPromises);
}

class NetworkError extends Error {
    public underlyingError: Error;
}

export function wrap(underlying: Error): CustomEvent<Error> {
    const err = new NetworkError('Erreur réseau');
    err.underlyingError = underlying;

    return new CustomEvent('error', {
        detail: err,
        composed: true,
        bubbles: true
    });
}

export async function load(route: string, content: HTMLElement) {
    const defaultTitle = 'Cheno';
    const component = route.split('/')[0];

    const Component = customElements.get('ui-' + component);
    const NotFound = customElements.get('ui-not-found');

    route = route.replace(component + '/', '');

    const loaded = Component ? new Component(route) : new NotFound(route);

    if(!document.title){
        document.title = defaultTitle;
    }

    for(const child of Array.from(content.children)){
        content.removeChild(child);
    }

    content.appendChild(loaded);
    
    if(loaded instanceof NotFound){
        throw new Error(route);
    }

    window.scrollTo(0,0);

    const handle = window.requestAnimationFrame(() => {
        const pageContent = loaded.querySelector('div');
        if(!pageContent){
            cancelAnimationFrame(handle);
            return;
        }

        const animation = pulseWith(300);			
        pageContent.animate(animation.effect, animation.options);
    });
}

export function Router(){
    return {
        redirect: (url: string, target = '_blank'): boolean => {
            return !!window.open(url, target);
         },
         navigate: (route: string): boolean => {
             location.hash = `#!${route}`;
             return true;
         },
         hashChange(event: HashChangeEvent): string | null {
             const routeWithPrefix = event.newURL.replace(location.origin + location.pathname, '');
 
             const routingParams = routeWithPrefix.split('#!').filter(Boolean);
             let route = null;
             if(routingParams.length === 0){
                 route = routingParams.shift();
             } else {
                 route = routingParams.pop();
             }
 
             const defaultRoute = 'home';
         
              // if same has current, no.
             if(event.oldURL === event.newURL){
                 return null;
             }
         
             // If loaded component has routing, let him decide
             const current = customElements.get('ui-'+route);
             if(current && current.hasRouting === true){
                 return route;
             }
         
             // if index asked, go to default or if nothing asked, go to default
             if(event.newURL === location.origin + location.pathname || !route){
                 return defaultRoute;
             }
         
             return route;
          }
    };
}

/**
* Convert a remote url to an image data-url
* 
* @param src remote url
*/
export function toDataURL(src: string): Promise<string> {
   return new Promise((resolve, reject) => {
       const image = new Image();
       image.crossOrigin = 'Anonymous';
       image.src = src;

       setTimeout(() => {
           if(image.complete === false){
               // abort image loading if exceeds 500ms : https://stackoverflow.com/questions/5278304/how-to-cancel-an-image-from-loading
               console.warn('Elara ::: Image loading was too slow, rejecting');
               image.src = '';
               reject();
           }
       }, 1200);
       
       image.onload = () => {
           const canvas = document.createElement('canvas');
           const context = canvas.getContext('2d');
           canvas.height = image.naturalHeight;
           canvas.width = image.naturalWidth;
           context.drawImage(image, 0, 0);
           resolve(canvas.toDataURL('image/jpeg'));
       };

       image.onerror = () => {
           reject();
       };
   });
}

export const Utils = {
    isMobile: (): boolean => {
        return window.innerWidth <= 570;
    },
    isInViewport(elem: Element) {
        const bounding = elem.getBoundingClientRect();

        return (
            bounding.top >= 0 &&
            bounding.left >= 0 &&
            bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
};

export function chunk<T>(arr: T[], size: number): T[][] {
    const R = [];
    for (let i=0, len=arr.length; i<len; i+=size){
        R.push(arr.slice(i,i+size));
    }
    return R;
}

export function decodeHTML(html: string){
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

export const Processing = {
    /**
     * Convert a remote url to an image data-url
     * 
     * @param src remote url
     */
    toDataURL(src: string, quality = 1): Promise<string> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'Anonymous';
            
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = image.naturalHeight;
                canvas.width = image.naturalWidth;
                context.drawImage(image, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };

            image.onerror = image.onabort = () => {
                reject();
            }; 
        
            image.src = src;
        });
    },
    async retrieveAsFile(url: string, proxy: string): Promise<File> {
        try {
            const blob = await Processing.retrieveAsBlob(url, proxy);
            return new File([blob], url.replace(/[\#\?].*$/,'').substring(url.lastIndexOf('/')+1));
        } catch {
            return null;
        }
    },
    async retrieveAsBlob(url: string, proxy: string): Promise<Blob> {
        try {
            return await fetch(proxy.concat(url)).then(r => r.blob());
        } catch {
            return null;
        }
    }
};

/**
 * Return a word without accents using normalize \o/
 * @param str "Crème au chocolat"
 * @return {string} "Creme au chocolat"
 */
export function normalize(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function slugify(str: string, separator: string){
    str = str.trim();
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from = 'åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;';
    const to = 'aaaaaaeeeeiiiioooouuuunc------';

    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    return str
        .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-') // collapse dashes
        .replace(/^-+/, '') // trim - from start of text
        .replace(/-+$/, '') // trim - from end of text
        .replace(/-/g, separator);
}

export function ifDefined(property: unknown, template: TemplateResult, initial: TemplateResult){
    if(!property) return initial;

    return template;
}


export const CSS = {
    spinner: css`
    .loading {
        display: flex;
        width: 100%;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
    paper-spinner {
        position: absolute;
        --paper-spinner-layer-1-color: var(--elara-primary);
        --paper-spinner-layer-2-color: var(--elara-secondary);
        --paper-spinner-layer-3-color: var(--elara-primary);
        --paper-spinner-layer-4-color: var(--elara-secondary);
    }
    `,
    images: css`
    .image-container {
        cursor: pointer;
    }
    
    .image-container.opened {
        transition: .3s;
        position: fixed;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255,255,255, .8);
        overflow: hidden;
        z-index: 999;
    }

    .image-container.opened iron-image {
        width: 100%;
        height: 100%;
    }
    `,
    cards: css`
    .cards {
        text-shadow: 0 0.1px 0 white;
        display: grid;
        grid-row-gap: 5em;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
        /* 
        background: repeating-linear-gradient(35deg,#fff,#fff 0, #fff 0px,#eecfcb 100vw);
        background-repeat: no-repeat;
        background-size: 100vw 190vh;
        */
       grid-column-gap: 1em;
        padding: 1em 2em;
    }

    @media (max-width: 475px){
        .cards {
            background-size: 100vw;
            grid-template-columns: repeat(auto-fill, minmax(100%, 1fr)); 
        }
    }

    .card {
        /* box-shadow: 0 7px 30px -10px rgba(150,170,180,0.5); */
        background: linear-gradient( to bottom, rgba(255, 255, 255, 0), rgba(249, 249, 249, 0.8) );
        cursor: pointer;
        text-align: center;
    }

    .card.reveal {
        opacity: 0;
    }

    .card.revealed {
        opacity: 1;
        transition: opacity .3s;
    }

    @media (prefers-reduced-motion: reduce){
        .card.reveal {
            opacity: 1;
        }

        .card.revealed {
            transition: 0s;
        }
    }

    .card iron-image {
        margin: 1em 0 0 .5em;
        width: 100%;
        height: 240px;
    }

    .card .text .title {
        font-size: 1.3em;
        margin: 0 0 .5em 0;
    }

    .card .text span {
        margin: 1em;
    }
    `,
    grid: css`.grid { display: flex; flex-wrap: wrap; } .grid > div { flex: 1 0 5em; }`,
    typography: {
        buttons: css`button:focus, button:hover {outline: 1px solid var(--elara-primary); background-color: var(--elara-secondary)}; `,
        lists: css`li { list-style: none }`,
        links: css`a { cursor: pointer; color: var(--elara-font-color); text-decoration: none; transition: color .3s; } a:hover { color: var(--elara-font-hover)}`,
        heading: css`h1, h2, h3 { user-select: none; font-family: var(--elara-font-display); } h1::first-letter { font-size: 1.3em; } h2::first-letter { font-size: 1.2em }`
    },
    shortcodes: css`
    .elara_row {overflow:auto; margin-bottom:20px;}

    .elara_cfull {width:100%;}
    .elara_chalf {width:50%;}
    .elara_cthird {width:33.3%;}
    .elara_ctwo-thirds {width:66.6%;}
    .elara_cquarter {width:25%;}
    .elara_cthree-quarters {width:75%;}

    .elara_column {float:left;}
    .elara_column div.elara_inner {padding:0 20px;}

    .elara_column:first-of-type .elara_inner {padding-left:0;}
    .elara_column:last-of-type .elara_inner {padding-right:0;}

    @media only screen and (max-width: 40em) {
        .elara_cfull {width:100%;}
        .elara_chalf {width:100%;}
        .elara_cthird {width:100%;}
        .elara_ctwo-thirds {width:100%;}
        .elara_cquarter {width:100%;}
        .elara_cthree-quarters {width:100%;}
        .elara_column .elara_inner {padding:0 !important;}
        .elara_column {margin-bottom:20px;}
    }
    `
};
