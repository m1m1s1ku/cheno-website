export async function dump(){
    const oldhtmL = await fetch('http://corsunblock.herokuapp.com/https://cheno.fr').then(res => res.text());

    const oldStub = document.implementation.createHTMLDocument('stub');
    oldStub.body.innerHTML = oldhtmL;

    const root = oldStub.body;
    const seriesLinks = Array.from(root.querySelectorAll('.article-continue')).map((item: HTMLLinkElement) => item.href.replace('http://localhost:3000', 'https://cheno.fr'));
    
    
    const currentDocument = document.implementation.createHTMLDocument('current');
    const series = [];

    let count = 0;
    for(const serieURL of seriesLinks){
        const oldContent = await fetch('http://corsunblock.herokuapp.com/'+serieURL).then(res => res.text());
        currentDocument.body.innerHTML = oldContent;

        const newRoot = currentDocument.body;
        const title = (newRoot.querySelector('.title') as HTMLDivElement).innerText.trim();
        const excerpt = (newRoot.querySelector('.title-desc') as HTMLDivElement).innerText.trim();
        const items = Array.from(newRoot.querySelectorAll('.grid__item'));

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

        /*const dumped = await import('../../dump.json');
        const oldData = dumped.default;

        const login = await fetch(Constants.api+Constants.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Ghostfly',
                password: '@PkP@%Q^P4EYKW!u'
            })
        }).then(res => res.json());

        const retrieveAsFile = async (url: string, proxy: string) => {
            try {
                const blob = await retrieveAsBlob(url, proxy);
                return new File([blob], url.replace(/[\#\?].*$/,'').substring(url.lastIndexOf('/')+1));
            } catch {
                return null;
            }
        };

        const retrieveAsBlob = async (url: string, proxy: string) => {
            try {
                return await fetch(proxy.concat(url)).then(r => r.blob());
            } catch {
                return null;
            }
        };

        const maker = new WPBridge(login.token, null).maker;
        for(const category of oldData){
            const catID = await maker.category({
                description: category.excerpt,
                name: category.title,
                slug: slugify(category.title, '-'),
                parent: null
            }).toPromise();

            for(const sculpture of category.sculptures){
                const media = await retrieveAsFile(sculpture.image, Constants.proxyB);
                const mediaID = await maker.media(media, slugify(sculpture.title, '-')).toPromise();
                const sculptureID = await maker.post({
                    title: sculpture.title,
                    status: WPArticleStatus.publish,
                    content: sculpture.excerpt,
                    categories: [catID],
                    tags:[],
                    date: new Date().toISOString(),
                    excerpt: sculpture.excerpt,
                    password: '',
                    featured_media: mediaID,
                    slug: slugify(sculpture.title, '-')
                }).toPromise();

                console.warn('added sculpture', sculptureID);
            }
        }*/