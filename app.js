// Vérifier si l'utilisateur est déjà connecté
const jwt = localStorage.getItem('jwt');
if (jwt) {
    showProfile();
}

// Gérer le formulaire de connexion
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const credentials = btoa(`${username}:${password}`);

    fetch('https://learn.zone01dakar.sn/api/auth/signin', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Invalid credentials');
            }
            return response.json();
        })
        .then(data => {
            console.log('Authentication Response:', data); // Pour vérifier la structure de la réponse
            if (data) {
                localStorage.setItem('jwt', data);
                showProfile();
            } else {
                throw new Error('No token received');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            document.getElementById('errorMessage').style.display = 'block';
        });

});

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

    if (!jwt) {
        console.error('No JWT found in localStorage.');
        return;
    }

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
        console.log('XP Graph Data:', data); // For debugging the data format

        if (data.data && data.data.transaction) {
            const transactions = data.data.transaction;

            // Check if transactions have data
            if (transactions.length === 0) {
                console.log('No transactions data available.');
                svg.innerHTML = '<text x="10" y="20">No data available</text>'; // Optional: display a message
                return;
            }

            // Determine the SVG dimensions
            const width = svg.clientWidth;
            const height = svg.clientHeight;

            // Get min and max values for scaling
            const minAmount = Math.min(...transactions.map(t => t.amount));
            const maxAmount = Math.max(...transactions.map(t => t.amount));
            const minDate = Math.min(...transactions.map(t => new Date(t.createdAt).getTime()));
            const maxDate = Math.max(...transactions.map(t => new Date(t.createdAt).getTime()));

            // Prepare points for polyline
            const points = transactions.map(t => {
                const date = new Date(t.createdAt).getTime();
                const scaledX = ((date - minDate) / (maxDate - minDate)) * width;
                const scaledY = height - ((t.amount - minAmount) / (maxAmount - minAmount)) * height;
                return `${scaledX},${scaledY}`;
            }).join(' ');

            // Clear previous content
            svg.innerHTML = '';

            // Create and append polyline
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke', 'blue');
            polyline.setAttribute('stroke-width', '2');
            polyline.setAttribute('points', points);

            svg.appendChild(polyline);

            // Optional: Add axes, labels, or grid for better visualization
            // Example: Add X and Y axes (you might need to adjust according to your needs)
            const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            xAxis.setAttribute('x1', '0');
            xAxis.setAttribute('y1', height);
            xAxis.setAttribute('x2', width);
            xAxis.setAttribute('y2', height);
            xAxis.setAttribute('stroke', 'black');
            svg.appendChild(xAxis);

            const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            yAxis.setAttribute('x1', '0');
            yAxis.setAttribute('y1', '0');
            yAxis.setAttribute('x2', '0');
            yAxis.setAttribute('y2', height);
            yAxis.setAttribute('stroke', 'black');
            svg.appendChild(yAxis);
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
