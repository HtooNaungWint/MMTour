export const alertElementShow = (severity, msg) => {
  alertElementHide();
  const alertElement = `<div class="alert alert--${severity}">
                            ${msg}
                            <a class="alert--close--button nav__el" id="alertClose" href="#" title="Close" onclick="return this.parentNode.remove();" style="position:absolute;top: 20%;">x</a>
                        </div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', alertElement);
};

export const alertElementHide = () => {
  const alertElement = document.querySelector('.alert');
  if (alertElement) alertElement.parentElement.removeChild(alertElement);
  window.setTimeout(alertElementHide, 5000);
};
const alertClose = document.querySelector('#alertClose');
if (alertClose) alertClose.addEventListener('click', hello);
