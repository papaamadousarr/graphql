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
            if (data.token) {
                localStorage.setItem('jwt', data.token);
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

function renderXpGraph() {
    const svg = document.getElementById('xpGraph');
    const tooltip = document.getElementById('tooltip');
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
        if (data.data && data.data.transaction) {
            const transactions = data.data.transaction;

            // Grouper les transactions par date
            const groupedData = transactions.reduce((acc, transaction) => {
                const date = new Date(transaction.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
                if (!acc[date]) {
                    acc[date] = 0;
                }
                acc[date] += transaction.amount;
                return acc;
            }, {});

            const sortedDates = Object.keys(groupedData).sort();
            const dataPoints = sortedDates.map(date => ({
                date,
                amount: groupedData[date]
            }));

            // Dimensions du SVG
            const width = 800;
            const height = 400;
            const margin = { top: 20, right: 20, bottom: 30, left: 40 };
            const barWidth = (width - margin.left - margin.right) / dataPoints.length;
            const maxAmount = Math.max(...dataPoints.map(d => d.amount));

            // Clear existing content
            while (svg.firstChild) {
                svg.removeChild(svg.firstChild);
            }

            // Dessiner les barres
            dataPoints.forEach((point, index) => {
                const x = margin.left + index * barWidth;
                const y = height - margin.bottom - (point.amount / maxAmount * (height - margin.top - margin.bottom));
                const heightBar = height - margin.bottom - y;

                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x);
                rect.setAttribute('y', y);
                rect.setAttribute('width', barWidth - 1); // Laisser un petit espace entre les barres
                rect.setAttribute('height', heightBar);
                rect.setAttribute('fill', 'blue');
                rect.setAttribute('data-date', point.date);
                rect.setAttribute('data-amount', point.amount);
                
                rect.addEventListener('mouseover', (e) => {
                    tooltip.textContent = `Date: ${e.target.getAttribute('data-date')} - Amount: ${e.target.getAttribute('data-amount')}`;
                    tooltip.style.left = `${e.pageX + 10}px`;
                    tooltip.style.top = `${e.pageY + 10}px`;
                    tooltip.style.display = 'block';
                });
                
                rect.addEventListener('mouseout', () => {
                    tooltip.style.display = 'none';
                });

                svg.appendChild(rect);
            });

            // Dessiner les axes
            drawAxis(svg, width, height, margin, maxAmount);
        } else {
            console.error('Transaction data not found');
        }
    })
    .catch(error => {
        console.error('XP Graph fetch error:', error);
    });
}

function drawAxis(svg, width, height, margin, maxAmount) {
    // Dessiner l'axe X
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left);
    xAxis.setAttribute('y1', height - margin.bottom);
    xAxis.setAttribute('x2', width - margin.right);
    xAxis.setAttribute('y2', height - margin.bottom);
    xAxis.setAttribute('stroke', 'black');
    svg.appendChild(xAxis);

    // Dessiner l'axe Y
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left);
    yAxis.setAttribute('y1', margin.top);
    yAxis.setAttribute('x2', margin.left);
    yAxis.setAttribute('y2', height - margin.bottom);
    yAxis.setAttribute('stroke', 'black');
    svg.appendChild(yAxis);

    // Ajouter des labels aux axes
    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', margin.left - 30);
    yLabel.setAttribute('y', margin.top);
    yLabel.setAttribute('transform', 'rotate(-90, ' + (margin.left - 30) + ',' + margin.top + ')');
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.textContent = 'XP Amount';
    svg.appendChild(yLabel);

    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', width / 2);
    xLabel.setAttribute('y', height - 5);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.textContent = 'Date';
    svg.appendChild(xLabel);
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
