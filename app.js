// Vérifier si l'utilisateur est déjà connecté
const jwt = localStorage.getItem('jwt');
if (jwt) {
    showProfile();
}

// Gérer le formulaire de connexion
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // const username = document.getElementById('username').value;
    // const password = document.getElementById('password').value;
    // const credentials = btoa(`${username}:${password}`);

    function loginUser(credentials) {
        fetch('https://learn.zone01dakar.sn/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            // Log the status and headers for debugging
            console.log('Response Status:', response.status);
            console.log('Response Headers:', [...response.headers.entries()]);
    
            if (!response.ok) {
                // Handle HTTP errors
                return response.json().then(errorData => {
                    throw new Error(`HTTP Error ${response.status}: ${errorData.message || 'Unknown error'}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Authentication Response:', data); // Log the full response
    
            // Check for token in the response
            if (data.token) {
                localStorage.setItem('jwt', data.token);
                showProfile(); // Function to display user profile
            } else {
                throw new Error('No token received');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            const errorMessageElement = document.getElementById('errorMessage');
            if (errorMessageElement) {
                errorMessageElement.style.display = 'block';
                errorMessageElement.textContent = error.message; // Display the error message
            }
        });
    }
    
    // Example usage
    const credentials = btoa('username:password'); // Replace with actual Base64 encoded credentials
    loginUser(credentials);

// Afficher le profil utilisateur
function showProfile() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'block';
    document.getElementById('graphSection').style.display = 'block';

    const jwt = localStorage.getItem('jwt');
    fetch('https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ query: `{ user { id login } }` })
    })
        .then(response => response.json())
        .then(data => {
            console.log('GraphQL Response:', data); // Pour vérifier la structure de la réponse
            if (data.data && data.data.user) {
                const user = data.data.user[0];
                document.getElementById('userId').textContent = user.id;
                document.getElementById('userLogin').textContent = user.login;
                renderXpGraph();
                renderProjectResultsGraph();
            } else {
                throw new Error('Data not found');
            }
        })
        .catch(error => {
            console.error('GraphQL fetch error:', error);
        });

}

// Fonction de déconnexion
document.getElementById('logoutButton').addEventListener('click', function () {
    localStorage.removeItem('jwt');
    location.reload();
});

// Fonction pour dessiner le graphique XP
function renderXpGraph() {
    const svg = document.getElementById('xpGraph');
    const jwt = localStorage.getItem('jwt');

    fetch('https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
            query: `
                {
                    transaction(where: { type: { _eq: "xp" } }) {
                        amount
                        createdAt
                    }
                }
            `
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('XP Graph Data:', data); // Pour vérifier les données des transactions XP
            if (data.data && data.data.transaction) {
                const transactions = data.data.transaction;
                const points = transactions.map(t => {
                    const date = new Date(t.createdAt).getTime();
                    return `${date},${t.amount}`;
                }).join(" ");

                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                polyline.setAttribute('fill', 'none');
                polyline.setAttribute('stroke', 'blue');
                polyline.setAttribute('stroke-width', '2');
                polyline.setAttribute('points', points);
                svg.appendChild(polyline);
            } else {
                throw new Error('Transaction data not found');
            }
        })
        .catch(error => {
            console.error('XP Graph fetch error:', error);
        });

}

// Fonction pour dessiner le graphique des résultats des projets
function renderProjectResultsGraph() {
    const svg = document.getElementById('projectResultsGraph');
    const jwt = localStorage.getItem('jwt');

    fetch('https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
            query: `
                {
                    result {
                        id
                        grade
                        createdAt
                    }
                }
            `
        })
    })
        .then(response => response.json())
        .then(data => {
            const results = data.data.result;
            // Tracer les résultats des projets ici (exemple simple)
            const points = results.map(r => {
                // Convertir la date en nombre pour l'affichage (exemple simple)
                const date = new Date(r.createdAt).getTime();
                return `${date},${r.grade * 50}`; // Exemple d'échelle
            }).join(" ");

            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke', 'red');
            polyline.setAttribute('stroke-width', '2');
            polyline.setAttribute('points', points);
            svg.appendChild(polyline);
        });
}
