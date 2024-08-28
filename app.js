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
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Fonction pour créer un élément SVG texte
    function createText(x, y, textContent, anchor = 'middle') {
        return d3.create('svg:text')
            .attr('x', x)
            .attr('y', y)
            .attr('text-anchor', anchor)
            .text(textContent);
    }

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
            const monthlyTotals = transactions.reduce((acc, t) => {
                const date = new Date(t.createdAt);
                const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
                acc[monthYear] = (acc[monthYear] || 0) + t.amount;
                return acc;
            }, {});

            const dataArray = Object.entries(monthlyTotals).map(([label, value]) => ({ label, value }));

            // Définir les échelles
            const xScale = d3.scaleBand()
                .domain(dataArray.map(d => d.label))
                .range([0, graphWidth])
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(dataArray, d => d.value)])
                .nice()
                .range([graphHeight, 0]);

            // Créer les barres
            plot.selectAll('.bar')
                .data(dataArray)
                .enter().append('rect')
                .attr('class', 'bar')
                .attr('x', d => xScale(d.label))
                .attr('y', d => yScale(d.value))
                .attr('width', xScale.bandwidth())
                .attr('height', d => graphHeight - yScale(d.value));

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
