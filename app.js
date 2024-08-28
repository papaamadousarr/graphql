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

            // Define XP ranges (bins)
            const binSize = 1000; // Define the bin size for XP ranges
            const xpRange = d3.bin().thresholds(d3.range(0, d3.max(transactions, d => d.amount) + binSize, binSize));

            // Process data into bins
            const binnedData = xpRange(transactions.map(d => d.amount));

            // Calculate counts for each bin
            const dataArray = binnedData.map(bin => ({
                x0: bin.x0,
                x1: bin.x1,
                count: bin.length
            }));

            // Define the scales
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(dataArray, d => d.x1)])
                .range([0, graphWidth]);

            const yScale = d3.scaleLinear()
                .domain([0, d3.max(dataArray, d => d.count)])
                .nice()
                .range([graphHeight, 0]);

            // Create bars
            plot.selectAll('.bar')
                .data(dataArray)
                .enter().append('rect')
                .attr('class', 'bar')
                .attr('x', d => xScale(d.x0))
                .attr('y', d => yScale(d.count))
                .attr('width', d => xScale(d.x1) - xScale(d.x0))
                .attr('height', d => graphHeight - yScale(d.count))
                .attr('fill', '#69b3a2');

            // Create and add the X and Y axes
            const xAxis = d3.axisBottom(xScale).tickSize(-graphHeight).ticks(10);
            const yAxis = d3.axisLeft(yScale).ticks(10);

            plot.append('g')
                .attr('class', 'x axis')
                .attr('transform', `translate(0,${graphHeight})`)
                .call(xAxis);

            plot.append('g')
                .attr('class', 'y axis')
                .call(yAxis);

            // Add labels for X axis
            plot.append('text')
                .attr('x', graphWidth / 2)
                .attr('y', graphHeight + margin.bottom - 10)
                .attr('text-anchor', 'middle')
                .text('XP Range');

            // Add labels for Y axis
            plot.append('text')
                .attr('x', -margin.left / 2)
                .attr('y', -margin.top / 2)
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .text('Number of Students');

            // Create the legend if needed
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
