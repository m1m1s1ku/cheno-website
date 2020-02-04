import { ElaraApp } from '../../elara-app';
import Constants from '../../constants';

export async function helmetize(route: string){
    const apiURL = new URL(route, Constants.base);

    try {
        const fetching = await fetch(apiURL.href).then((req) => req.json());

        if(fetching.title){
            document.title = fetching.title;
        }
        
        if(fetching.description){
            const metaField = document.querySelector('meta[name="description"]');
            if(metaField){
                metaField.setAttribute('content', fetching.description);
            } else {
                const meta = document.createElement('meta');
                meta.name = 'description';
                meta.content = fetching.description;
                document.head.appendChild(meta);
            }
        }
    } catch (err){
        console.error('Error while retrieving helmet', err);
    }
}

/**
 * Navigate to an app route
 * 
 * FIXME: Handle deep urls (sub-nav capabilities)
 * @export
 * @param {string} route route without base prefix
 */
export async function navigate(route: string) {
    if(route.indexOf('http') !== -1 || route.indexOf('mailto') !== -1){
        window.open(route, '_blank');
        return true;
    }

    const app = document.body.querySelector<ElaraApp>('elara-app');

    // await helmetize(route);

    return app.router.navigate(route);
}