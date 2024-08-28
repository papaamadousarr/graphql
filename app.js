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
    const radius = 16;
    const centerX = 16;
    const centerY = 16;
    const total = 2 * Math.PI * radius;

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
            console.log('XP Graph Data:', data);
            if (data.data && data.data.transaction) {
                const transactions = data.data.transaction;
                const monthlyTotals = transactions.reduce((acc, t) => {
                    const date = new Date(t.createdAt);
                    const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
                    acc[monthYear] = (acc[monthYear] || 0) + t.amount;
                    return acc;
                }, {});

                const totalAmount = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
                let accumulatedAngle = 0;

                Object.entries(monthlyTotals).forEach(([label, amount], index) => {
                    const percentage = amount / totalAmount;
                    const angle = percentage * 360;
                    const startAngle = accumulatedAngle;
                    const endAngle = accumulatedAngle + angle;
                    accumulatedAngle = endAngle;

                    const start = polarToCartesian(centerX, centerY, radius, endAngle - angle);
                    const end = polarToCartesian(centerX, centerY, radius, endAngle);
                    const largeArcFlag = angle > 180 ? 1 : 0;

                    const d = [
                        `M ${centerX} ${centerY}`,
                        `L ${start.x} ${start.y}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
                        'Z'
                    ].join(' ');

                    const slice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    slice.setAttribute('d', d);
                    slice.setAttribute('fill', getColor(index));
                    slice.setAttribute('class', 'slice');
                    slice.setAttribute('data-label', label);
                    slice.setAttribute('data-value', amount);
                    svg.appendChild(slice);
                });

                svg.addEventListener('mousemove', (event) => {
                    const target = event.target;
                    if (target.classList.contains('slice')) {
                        const label = target.getAttribute('data-label');
                        const value = target.getAttribute('data-value');
                        console.log(`Label: ${label}, Value: ${value}`);
                    }
                });
            } else {
                throw new Error('Transaction data not found');
            }
        })
        .catch(error => {
            console.error('XP Graph fetch error:', error);
        });

    function polarToCartesian(centerX, centerY, radius, angle) {
        const radians = (angle - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(radians)),
            y: centerY + (radius * Math.sin(radians))
        };
    }

    function getColor(index) {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#FF5733', '#C70039'];
        return colors[index % colors.length];
    }
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
