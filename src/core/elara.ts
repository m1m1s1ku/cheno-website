import { pulseWith } from './animations';

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