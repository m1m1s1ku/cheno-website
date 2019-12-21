export async function dumpSeries(){
    const oldhtmL = await fetch('http://corsunblock.herokuapp.com/https://cheno.fr').then(res => res.text());

    const oldStub = document.implementation.createHTMLDocument('stub');
    oldStub.body.innerHTML = oldhtmL;

    const root = oldStub.body;
    const seriesLinks = Array.from(root.querySelectorAll('.article-continue')).map((item: HTMLLinkElement) => item.href.replace('http://localhost:3000', 'https://cheno.fr')).reverse();

    const currentDocument = document.implementation.createHTMLDocument('current');
    const series = [];

    let count = 0;
    for(const serieURL of seriesLinks){
        const oldContent = await fetch('http://corsunblock.herokuapp.com/'+serieURL).then(res => res.text());
        currentDocument.body.innerHTML = oldContent;

        const newRoot = currentDocument.body;
        const title = (newRoot.querySelector('.title') as HTMLDivElement).innerText.trim();
        const excerpt = (newRoot.querySelector('.title-desc') as HTMLDivElement).innerText.trim();
        const items = Array.from(newRoot.querySelectorAll('.grid__item')).reverse();

        const category = {
            title,
            excerpt,
            sculptures: []
        };

        const firstItem = newRoot.querySelector('.firstcat');
        const firstSculpture = {
            title: (firstItem.querySelector('.article-title') as HTMLElement).innerText.trim(),
            excerpt: (firstItem.querySelector('.article-desc') as HTMLElement).innerText.trim(),
            size: (firstItem.querySelector('.size-img') as HTMLElement).innerText.trim(),
            image: (firstItem.querySelector('.sculpt-img') as HTMLImageElement).src.replace('http://localhost:3000', 'https://cheno.fr')
        };

        if(firstSculpture.title){
            count++;
            category.sculptures.push(firstSculpture);
        }

        for(const sculptureBlock of items){
            const sculpture = {
                title: (sculptureBlock.querySelector('.grid__item--title') as HTMLElement).innerText.trim(),
                excerpt: (sculptureBlock.querySelector('.article-desc') as HTMLElement).innerText.trim(),
                size: (sculptureBlock.querySelector('.size-img') as HTMLElement).innerText.trim(),
                image: (sculptureBlock.querySelector('.sculpt-img') as HTMLImageElement).src.replace('http://localhost:3000', 'https://cheno.fr')
            };
            count++;
            category.sculptures.push(sculpture);
        }

        series.push(category);
    }

    console.warn('count', count);

    return series;
}

/* 
function import(){
        const expos = await dumpExpositions();
        const login = await fetch(Constants.api+Constants.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Ghostfly',
                password: null
            })
        }).then(res => res.json());

        const maker = new Bridge(login.token, null).maker;

        const retrieveAsBlob = async (url: string, proxy: string) => {
            try {
                return await fetch(proxy.concat(url)).then(r => r.blob());
            } catch {
                return null;
            }
        };

        const retrieveAsFile = async (url: string, proxy: string) => {
            try {
                const blob = await retrieveAsBlob(url, proxy);
                return new File([blob], url.replace(/[\#\?].*$/,'').substring(url.lastIndexOf('/')+1));
            } catch {
                return null;
            }
        };

        for(const expo of expos){
            console.warn(expo);

            const mediaFile = await retrieveAsFile(expo.image, Constants.proxy);
            const mediaId = await maker.media(mediaFile, expo.title).toPromise();

            const post = await maker.post({
                title: expo.title,
                // eslint-disable-next-line @typescript-eslint/camelcase
                date_expo: expo.date,
                place: expo.place,
                status: WPArticleStatus.publish,
                content: expo.content,
                categories: [],
                tags: [],
                date: new Date().toISOString(),
                excerpt: expo.content,
                password: '',
                // eslint-disable-next-line @typescript-eslint/camelcase
                featured_media: mediaId,
                slug: slugify(expo.title, '-'),
            }).toPromise();

            if(post){
                console.warn('created', post);
            }
        }
}
*/


export async function dumpExpositions(): Promise<{
    date: string;
    title: string;
    content: string;
    place: string;
    image: string;
}[]>{
    const oldhtmL = await fetch('http://corsunblock.herokuapp.com/https://cheno.fr/expos').then(res => res.text());

    const oldStub = document.implementation.createHTMLDocument('stub');
    oldStub.body.innerHTML = oldhtmL;

    const root = oldStub.body;

    const expositionsCards = Array.from(root.querySelectorAll('.card-media')).reverse();

    const selectors = {
        date: '.subtle',
        title: '.card-media-body-heading',
        content: '.card-media-body-supporting-bottom span:first-child',
        place: '.card-media-body-supporting-bottom span:last-child',
        image: '.card-media-object'
    };

    const expos = [];
    for(const card of expositionsCards){
        const expo = {};
        for(const selectorKey of Object.keys(selectors)){
            const element = card.querySelector(selectors[selectorKey]);
            if(element && selectorKey !== 'image'){
                expo[selectorKey] = element.innerText.trim();
            } else if(element && selectorKey === 'image'){
                expo[selectorKey] = 'https://cheno.fr/'+element.style.backgroundImage.replace('url(','').replace(')','').replace(/\"/gi, '');
            }
        }
        expos.push(expo);
    }

    // console.warn(expos);

    return expos;
}