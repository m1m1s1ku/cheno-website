/* eslint-disable @typescript-eslint/ban-ts-ignore */
// @ts-check

function makeGenericHandler(){
  const handler = document.createElement('div');
  handler.id = handler.className = 'handler';
  handler.innerHTML = '<div class="handler-content"><div id="spinner" class="spinner large"></div></div>';
  return handler;
}

function _onDomLoaded(){
  const handler = makeGenericHandler();
  document.body.appendChild(handler);

  const loadingPromises = [];
  const neededElements = [];

  const elara = document.querySelector('elara-app');
  // @ts-ignore
  loadingPromises.push(document.fonts.ready);
  // @ts-ignore
  loadingPromises.push(elara.bootstrap);

  for(const elementName of neededElements){
    loadingPromises.push(customElements.whenDefined(elementName));
  }

  return Promise.all(loadingPromises).then(() => {    
    window.requestAnimationFrame(() => {
      const spinner = document.querySelector('#spinner');
      if(spinner){
        spinner.parentElement.removeChild(spinner);
      }

      handler.classList.add('hidden');
      handler.parentElement.removeChild(handler);
    });
  });
}

(() => {
  document.addEventListener('DOMContentLoaded', _onDomLoaded);
})();