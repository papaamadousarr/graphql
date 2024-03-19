// Code pour le l'index
const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const usernameOrEmail = form.elements['username-or-email'].value;
  const password = form.elements['password'].value;
  localStorage.setItem('username', usernameOrEmail);
  localStorage.setItem('password', password);


  const url = 'https://learn.zone01dakar.sn/api/auth/signin';

  // Les informations d'identification doivent être encodées en base64 avec btoa()
  const info = usernameOrEmail + ':' + password;
  const credentials = btoa(info);

  // Envoi de la requête POST pour obtenir un JWT
  fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({}),
  })
  .then(response => response.json())
  .then(data => {
    // Extraire le JWT de la réponse
    const jwt = data;

    // Vérifier la validité du JWT
    if (jwt && jwt.length > 0) {
    // Rediriger l'utilisateur vers la page "home.html"
      window.location.href = 'home.html';
    } else {
    // Afficher un message d'erreur si le JWT n'est pas valide
    const errorMessage = 'Invalid Username or password';
    document.getElementById('error-message').textContent = errorMessage;
    console.error(errorMessage);
  }
    
    // Vérifier la validité du JWT en extractant le payload et en le décodant
    //const payload = jwt.split('.')[1];
    //const decodepayload = atob(payload)
    //console.log(decodepayload)


  })
  .catch(error => console.error(error));
});
