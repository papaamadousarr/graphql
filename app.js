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
    const svg = d3.select('#xpGraph');
    const jwt = localStorage.getItem('jwt');
    const width = +svg.attr('width');
    const height = +svg.attr('height');
    const margin = { top: 20, right: 150, bottom: 50, left: 60 }; // Added space for legend
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Nettoyer le SVG avant de dessiner le nouveau graphique
    svg.selectAll('*').remove();

    // Créer un groupe pour le graphique
    const plot = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

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
            
            // Compter le nombre de étudiants pour chaque montant XP
            const xpCounts = transactions.reduce((acc, t) => {
                acc[t.amount] = (acc[t.amount] || 0) + 1;
                return acc;
            }, {});

            const dataArray = Object.entries(xpCounts).map(([xp, count]) => ({ xp: +xp, count }));

            // Définir les échelles
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(dataArray, d => d.xp)])
                .range([0, graphWidth]);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(dataArray, d => d.count)])
                .nice()
                .range([graphHeight, 0]);

            // Créer les barres
            plot.selectAll('.bar')
                .data(dataArray)
                .enter().append('rect')
                .attr('class', 'bar')
                .attr('x', d => xScale(d.xp))
                .attr('y', d => yScale(d.count))
                .attr('width', d => xScale(d.xp + 1) - xScale(d.xp))
                .attr('height', d => graphHeight - yScale(d.count))
                .attr('fill', '#69b3a2');

            // Créer et ajouter les axes X et Y
            const xAxis = d3.axisBottom(xScale);
            const yAxis = d3.axisLeft(yScale);

            plot.append('g')
                .attr('class', 'x axis')
                .attr('transform', `translate(0,${graphHeight})`)
                .call(xAxis);

            plot.append('g')
                .attr('class', 'y axis')
                .call(yAxis);

            // Créer la légende
            const legendData = [
                { color: '#69b3a2', label: 'Number of Students' }
            ];

            const legend = svg.append('g')
                .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);

            legend.selectAll('.legend')
                .data(legendData)
                .enter().append('g')
                .attr('class', 'legend')
                .attr('transform', (d, i) => `translate(0,${i * 20})`);

            legend.selectAll('.legend')
                .append('rect')
                .attr('x', 0)
                .attr('width', 18)
                .attr('height', 18)
                .style('fill', d => d.color);

            legend.selectAll('.legend')
                .append('text')
                .attr('x', 25)
                .attr('y', 15)
                .text(d => d.label);

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
