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
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Fonction pour créer un élément SVG texte
    function createText(x, y, textContent, anchor = 'middle') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', anchor);
        text.textContent = textContent;
        return text;
    }

    // Nettoyer le SVG avant de dessiner le nouveau graphique
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }

    // Créer un groupe pour le graphique
    const plot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    plot.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    svg.appendChild(plot);

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
            const monthlyTotals = transactions.reduce((acc, t) => {
                const date = new Date(t.createdAt);
                const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
                acc[monthYear] = (acc[monthYear] || 0) + t.amount;
                return acc;
            }, {});

            const dataArray = Object.entries(monthlyTotals).map(([label, value]) => ({ label, value }));

            // Définir les échelles
            const xScale = dataArray.map((d, i) => i * (graphWidth / dataArray.length));
            const yMax = d3.max(dataArray, d => d.value); // Trouver la valeur maximale pour l'échelle Y

            // Créer les barres
            dataArray.forEach((d, i) => {
                const x = xScale[i];
                const barWidth = graphWidth / dataArray.length - 10;
                const barHeight = graphHeight - (d.value / yMax) * graphHeight;
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('class', 'bar');
                rect.setAttribute('x', x);
                rect.setAttribute('y', barHeight);
                rect.setAttribute('width', barWidth);
                rect.setAttribute('height', graphHeight - barHeight);
                plot.appendChild(rect);
            });

            // Créer et ajouter les axes X et Y
            const xAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            xAxisGroup.setAttribute('class', 'axis');
            xAxisGroup.setAttribute('transform', `translate(0,${graphHeight})`);
            svg.appendChild(xAxisGroup);

            const yAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            yAxisGroup.setAttribute('class', 'axis');
            svg.appendChild(yAxisGroup);

            // Ajouter les labels de l'axe X
            dataArray.forEach((d, i) => {
                const x = xScale[i] + (graphWidth / dataArray.length) / 2;
                const text = createText(x, graphHeight + margin.bottom / 2, d.label);
                svg.appendChild(text);
            });

            // Ajouter les labels de l'axe Y
            const yAxisLabels = [0, yMax];
            yAxisLabels.forEach(label => {
                const y = graphHeight - (label / yMax) * graphHeight;
                const text = createText(-margin.left / 2, y, label, 'end');
                svg.appendChild(text);
            });

            // Dessiner les axes X et Y
            const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            xAxisLine.setAttribute('x1', 0);
            xAxisLine.setAttribute('y1', graphHeight);
            xAxisLine.setAttribute('x2', graphWidth);
            xAxisLine.setAttribute('y2', graphHeight);
            xAxisLine.setAttribute('stroke', '#000');
            svg.appendChild(xAxisLine);

            const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            yAxisLine.setAttribute('x1', 0);
            yAxisLine.setAttribute('y1', 0);
            yAxisLine.setAttribute('x2', 0);
            yAxisLine.setAttribute('y2', graphHeight);
            yAxisLine.setAttribute('stroke', '#000');
            svg.appendChild(yAxisLine);

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
