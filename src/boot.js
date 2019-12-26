// @ts-check
// @ts-ignore
window.polymerSkipLoadingFontRoboto = true;

const neededElements = [];

function dismiss(){
  const handler = document.querySelector('#handler');
  handler.parentElement.removeChild(handler);
}

function reload(){
  location.reload();
}

function makeGenericHandler(error = null){
  if(error && error.message === 'Expected identifier, string or number'){
    return null;
  }

  const handler = document.createElement('div');
  handler.id = handler.className = 'handler';
  handler.innerHTML = `
  <div class="content">
    ${error !== null ? `
      <h4>Oops.</h4>
      ${error.message ? `<p>${error.message}</p>` : ''}
      <div class="actions">
        ${error.continue == true ? '<button class="continue" onclick="dismiss()">Pas grave, je continue.</button>' : ''}
        <button class="reload" onclick="reload()" raised toggles>Rafraîchir</button>
      </div>
    ` : ''}
  </div>
  `;
  return handler;
}

function _onDomLoaded(){
  let handler = null;

  const loadingPromises = [
    // When elara is defined we directly run her bootstrap to load website while global loading.
    // We do this to ensure dynamic elements are loaded right on time, and to please lighthouse on main-thread work
    // if we do that while lit-component is ready dom mutations will lead to browser computing time, useless cause it's needed to first paint
    customElements.whenDefined('elara-app').then(() => {
      const elara = document.querySelector('elara-app');
      // @ts-ignore
      return elara.bootstrap;
    })
  ];

  for(const elementName of neededElements){
    loadingPromises.push(customElements.whenDefined(elementName));
  }

  return Promise.all(loadingPromises).then(() => {
    if(!handler){
      handler = document.querySelector('#handler');
    }
  });
}

/**
 *
 *
 * @param {ErrorEvent|CustomEvent<Error>} event
 * @returns
 */
function _onGenericError(event) {
  const willThrow = event instanceof ErrorEvent ? event.error : event.detail;
  const handler = makeGenericHandler(willThrow);
  if(handler){
    document.body.appendChild(handler);  
  }
}

function _onUnload(){
  window.removeEventListener('error', _onGenericError);
}

(() => {
  document.addEventListener('DOMContentLoaded', _onDomLoaded, {passive: true});
  document.addEventListener('unload', _onUnload, {passive: true});
  window.addEventListener('error', _onGenericError, {passive: true});
})();