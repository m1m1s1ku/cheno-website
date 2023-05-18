// @ts-check
const replace = require('replace-in-file');
const {join} = require('path');
const {renameSync, writeFileSync, readFileSync} = require('fs');
const { exec } = require('child_process');

console.warn('deploying php into html');

const distFolder = join(__dirname, 'dist');

const configFile = join(distFolder, 'config.json');
const htmlFile = join(distFolder, 'index.html');
const htaccessFile = join(distFolder, '.htaccess');

try {
    exec('git rev-parse --short HEAD', (_err, stdout) => {
        const rev = stdout.replace('\n', '');
        writeFileSync(configFile, JSON.stringify({
          name: 'Cheno',
          revision: 'cheno-' + rev,
          domain: 'cheno.fr'
        }, null, 2));
        console.log('config ok');

        const options = {
          files: htmlFile,
          from: '<!-- {{SSRFunctions}} -->',
          to: readFileSync('ssr.php').toString('utf-8')
        };

        replace.sync(options);
        console.log('replaced functions');
    
        options.from = '<!-- {{SSRHead}} -->';
        options.to = '<?= ogFor($title, $url, $description, $image); ?>';
        replace.sync(options);
        console.log('replaced head');

        options.from = '<!-- {{Segment}} -->';
        options.to = `
        <script>
          !function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on"];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t,e){var n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src="https://cdn.segment.com/analytics.js/v1/"+t+"/analytics.min.js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(n,a);analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.1.0";
          analytics.load("ZeRGElPrUyplyBhgGOuDqoRBOYAd2649");
          analytics.page();
          }}();
        </script>
        `;
        replace.sync(options);
        console.log('added tracking');

        const newFile = htmlFile.replace('.html', '.php');
        renameSync(htmlFile, newFile);
        console.log('Rename ok');    
    });

    writeFileSync(htaccessFile, `
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^(.+)$ index.php [QSA,L]
    
    ## EXPIRES HEADER CACHING ##

    ExpiresActive On
    ExpiresByType image/jpg "access 1 year"
    ExpiresByType image/jpeg "access 1 year"
    ExpiresByType image/gif "access 1 year"
    ExpiresByType image/png "access 1 year"
    ExpiresByType image/svg "access 1 year"
    ExpiresByType text/css "access 1 month"
    ExpiresByType application/pdf "access 1 month"
    ExpiresByType application/javascript "access 1 month"
    ExpiresByType application/x-javascript "access 1 month"
    ExpiresByType application/x-shockwave-flash "access 1 month"
    ExpiresByType image/x-icon "access 1 year"
    ExpiresDefault "access 2 days"

    ## EXPIRES HEADER CACHING ##
    `);
    console.log('htaccess ok');
} catch (err) {
    throw new Error('error during deploy' + err ? err.message : err);
}