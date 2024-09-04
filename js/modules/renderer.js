import { logout, setUpUser, submitForm } from "./session.js"

var parser = new DOMParser();

async function renderAuth() {
    let auth = await fetch('static/html/auth.html').then(resp => resp.text())
    let doc = parser.parseFromString(auth, 'text/html');

    document.getElementsByTagName('body')[0].innerHTML = doc.body.innerHTML
    document.getElementById('loginForm').onsubmit = submitForm
}

async function renderMain() {
    let main = await fetch('static/html/mainboard.html').then(resp => resp.text())
    let doc = parser.parseFromString(main, 'text/html');

    document.getElementsByTagName('body')[0].innerHTML = doc.body.innerHTML
    document.getElementById('logout').onclick = logout
    setUpUser()
}

async function renderPage() {
    (localStorage.getItem('currentUser') !== null) ? renderMain() : renderAuth()
}

export { renderPage }