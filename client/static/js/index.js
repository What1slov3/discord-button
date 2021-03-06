'use strict';

import config from './config.js';

const infoBlock = document.querySelector('.info');
const loginButton = document.querySelector('.button');
const input = document.querySelector('input');
const saveButton = document.querySelector('.save_button');
const containerBlock = document.querySelector('.container');
const alreadyBlock = document.querySelector('.already');
const roleBlock = document.querySelector('.role');

const ls = localStorage;
let globalUser, globalHasRole;

loginButton.href = config.oauthUrl;

function isAlreadyLoggedIn(user) {
  infoBlock.className = 'info';
  loginButton.textContent = 'Already  logged in';
  loginButton.href = window.location;
  loginButton.classList.add('logged');
  infoBlock.textContent = `Logged in as ${user.username}#${user.discriminator}`;
  infoBlock.classList.add('logged');
}

function setInfoBlock(text, className) {
  infoBlock.className = 'info';
  infoBlock.textContent = text;
  infoBlock.classList.add(className);
}

function setAlreadyBlock(alreadyText) {
  input.style.display = 'none';
  alreadyBlock.textContent = `You've entered the following: ${alreadyText}`;
  alreadyBlock.style.display = 'block';
  saveButton.style.display = 'none';
}

function handleJsonCheck(json) {
  containerBlock.style.display = 'flex';
  if (json.status === 429) throw new Error('Too many request to Discord token');
  if (json.status >= 300 && json.status !== 400) throw new Error('Something went wrong. Try again later', 'err');
  return json.json();
}

function setRole(role) {
  if (role) {
    roleBlock.textContent = role === 'oneField' ? 'Regular member' : 'Club member';
  } else {
    infoBlock.className = 'info';
    infoBlock.textContent = "You don't have the required role";
    infoBlock.classList.add('err');
  }
}

function setInput(hasRole) {
  if (hasRole) {
    input.style.display = 'block';
    saveButton.style.display = 'block';
  }
}

function commonResponse(response) {
  const { hasRole, user, already } = response;
  isAlreadyLoggedIn(user);
  if (already) {
    setAlreadyBlock(already);
  } else {
    setInput(hasRole);
  }
  setRole(hasRole);
  globalUser = user;
  globalHasRole = hasRole;
}

window.onload = () => {
  const accessToken = ls.getItem('access_token');

  const fragment = new URLSearchParams(window.location.search);
  const code = fragment.get('code');

  if (!config.oauthUrl || !config.serverUrl) {
    setInfoBlock('INVALID CONFIG', 'err');
    return console.error('INVALID CONFIG');
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
          commonResponse(response);
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
          commonResponse(response);
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
    const text = input.value.trim();

    const jsonChecker = (json) => {
      if (json.status === 500) return setInfoBlock('Something went broke', 'err');
      if (json.status === 429) return setInfoBlock('Too many request to Discord token', 'err');
      if (json.status === 400) return setInfoBlock('Already registered', 'err');
      setAlreadyBlock(text);
      return setInfoBlock('Successful registered', 'success');
    };

    if (globalHasRole && text) {
      return fetch(`${config.serverUrl}/api/save?accessToken=${ls.getItem('access_token')}&text=${text}`).then(
        jsonChecker
      );
    }
    return setInfoBlock('Fields must be filled', 'err');
  }
});

input.addEventListener('input', (e) => {
  if (infoBlock.textContent !== `Logged in as ${globalUser.username}#${globalUser.discriminator}`) {
    isAlreadyLoggedIn(globalUser);
  }
});
