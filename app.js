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
        if (data.data && data.data.transaction) {
            const transactions = data.data.transaction;

            // Vérifiez s'il y a des transactions
            if (transactions.length === 0) {
                console.log('No transactions data available.');
                svg.innerHTML = '<text x="10" y="20">No data available</text>'; // Affiche un message
                return;
            }

            // Calculer la somme totale des montants pour le graphique
            const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

            // Préparer les données pour le graphique
            let startAngle = 0;
            const radius = Math.min(svg.clientWidth, svg.clientHeight) / 2;
            const centerX = svg.clientWidth / 2;
            const centerY = svg.clientHeight / 2;
            const pieSlices = transactions.map(t => {
                const sliceAngle = (t.amount / totalAmount) * 2 * Math.PI;
                const endAngle = startAngle + sliceAngle;
                const path = describeArc(centerX, centerY, radius, startAngle * 180 / Math.PI, endAngle * 180 / Math.PI);
                startAngle = endAngle;
                return { path, color: getRandomColor() };
            });

            // Effacer le contenu précédent
            svg.innerHTML = '';

            // Ajouter chaque secteur de tarte au graphique
            pieSlices.forEach(slice => {
                const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathElement.setAttribute('d', slice.path);
                pathElement.setAttribute('fill', slice.color);
                svg.appendChild(pathElement);
            });

            // Fonction pour créer un arc (secteur de tarte) en SVG
            function describeArc(x, y, radius, startAngle, endAngle) {
                const start = polarToCartesian(x, y, radius, endAngle);
                const end = polarToCartesian(x, y, radius, startAngle);
                const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

                return [
                    'M', start.x, start.y,
                    'A', radius, radius, 0, arcSweep, 0, end.x, end.y,
                    'L', x, y,
                    'Z'
                ].join(' ');
            }

            function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
                const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
                return {
                    x: centerX + radius * Math.cos(angleInRadians),
                    y: centerY + radius * Math.sin(angleInRadians)
                };
            }

            function getRandomColor() {
                const letters = '0123456789ABCDEF';
                let color = '#';
                for (let i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }
        } else {
            throw new Error('Transaction data not found');
        }
    })
    .catch(error => {
        console.error('XP Pie Chart fetch error:', error);
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
