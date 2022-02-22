'use strict';

// !CONFIG IS HERE START
let config = {
  redirectUrl: '',
  oauthUrl: '',
  serverUrl: '',
};
// !CONFIG IS HERE END

const infoBlock = document.querySelector('.info');
const loginButton = document.querySelector('.button');
const inputs = document.querySelectorAll('input');
const saveButton = document.querySelector('.save_button');
const containerBlock = document.querySelector('.container');
const ls = localStorage;
let user, hasRole;

loginButton.href = config.oauthUrl;

function isAlreadyLoggedIn(user) {
  infoBlock.className = 'info';
  loginButton.textContent = 'Already  logged in';
  loginButton.href = window.location;
  loginButton.classList.add('logged');
  infoBlock.textContent = `Logged in as ${user.username}#${user.discriminator}`;
  infoBlock.classList.add('logged');
}

function setInputs(hasRole) {
  if (hasRole === 'oneField') {
    inputs[0].style.display = 'block';
  } else if (hasRole === 'twoFields') {
    inputs.forEach((input) => (input.style.display = 'block'));
  } else {
    infoBlock.className = 'info';
    infoBlock.textContent = "You don't have the required role";
    infoBlock.classList.add('err');
    return;
  }
  saveButton.style.display = 'block';
}

function setInfoBlock(text, className) {
  infoBlock.className = 'info';
  infoBlock.textContent = text;
  infoBlock.classList.add(className);
}

function handleJsonCheck(json) {
  containerBlock.style.display = 'flex';
  if (json.status === 429) throw new Error('Too many request to Discord token');
  if (json.status >= 300 && json.status !== 400) throw new Error('Something went wrong. Try again later', 'err');
  return json.json();
}

window.onload = () => {
  const accessToken = ls.getItem('access_token');

  const fragment = new URLSearchParams(window.location.search);
  const code = fragment.get('code');

  if (!config.oauthUrl || !config.serverUrl) {
    console.error('INVALID CONFIG');
    return;
  }
  if (!code && !accessToken) return;

  infoBlock.className = 'info';

  if (!accessToken) {
    fetch(`${config.serverUrl}/api${window.location.search}`)
      .then(handleJsonCheck)
      .then((response) => {
        if (response.error) {
          setInfoBlock(response.error_description, 'err');
          return;
        }
        if (response) {
          ls.setItem('access_token', response.accessToken);
          [hasRole, user] = [response.hasRole, response.user];
          isAlreadyLoggedIn(response.user);
          setInputs(response.hasRole);
          window.history.pushState('', '', config.redirectUrl);
          return;
        }
        throw new Error('Something went wrong');
      })
      .catch((err) => {
        setInfoBlock(err, 'err');
      });
  } else {
    if (code) window.history.pushState('', '', config.redirectUrl);
    
    fetch(`${config.serverUrl}/api/update?accessToken=${ls.getItem('access_token')}`)
      .then(handleJsonCheck)
      .then((response) => {
        if (response.error) {
          setInfoBlock(response.error_description, 'err');
          return;
        }
        if (response) {
          [hasRole, user] = [response.hasRole, response.user];
          isAlreadyLoggedIn(response.user);
          setInputs(response.hasRole);
          return;
        }
        throw new Error('Something went wrong');
      })
      .catch((err) => {
        setInfoBlock(err, 'err');
      });
  }
};

saveButton.addEventListener('click', (e) => {
  if (ls.getItem('access_token')) {
    const firstField = inputs[0].value.trim();
    const secondField = inputs[1].value.trim();

    const mainUrl = `${config.serverUrl}/api/save?accessToken=${ls.getItem('access_token')}`;

    const jsonChecker = (json) => {
      if (json.status === 500) return setInfoBlock('Something went broke', 'err');
      if (json.status === 429) return setInfoBlock('Too many request to Discord token', 'err');
      if (json.status === 400) return setInfoBlock('Already registered', 'err');
      return setInfoBlock('Successful registered', 'success');
    };

    if (hasRole === 'oneField' && firstField) {
      return fetch(mainUrl + `&firstText=${firstField}`).then(jsonChecker);
    }
    if (hasRole === 'twoFields' && firstField && secondField) {
      return fetch(mainUrl + `&firstText=${firstField}&secondText=${secondField}`).then(jsonChecker);
    }
    return setInfoBlock('Fields must be filled', 'err');
  }
});

inputs.forEach((input) => {
  input.addEventListener('input', (e) => {
    if (infoBlock.textContent !== `Logged in as ${user.username}#${user.discriminator}`) {
      isAlreadyLoggedIn(user);
    }
  });
});
