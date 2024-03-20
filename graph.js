// Récupérer les informations de connexion depuis le stockage local
const username = localStorage.getItem('username');
const email = localStorage.getItem('email');

const password = localStorage.getItem('password');


// Afficher le nom d'utilisateur ou l'adresse e-mail dans la page
document.getElementById('username').textContent = username || email;


var logoutBtn = document.getElementById("logout-btn");

logoutBtn.addEventListener("click", function() {
  // Supprimez les informations de connexion stockées dans les cookies ou le stockage local
  // Redirigez l'utilisateur vers la page de connexion
  window.location.href = "index.html";
});

var graphbtn = document.getElementById("btn-graph");

graphbtn.addEventListener("click", function() {
  // Supprimez les informations de connexion stockées dans les cookies ou le stockage local
  // Redirigez l'utilisateur vers la page de connexion
  window.location.href = "graph.html";
});


// ----------------------------------

const url = 'https://learn.zone01dakar.sn/api/auth/signin';

// Les informations d'identification doivent être encodées en base64 avec btoa()
const info = username + ':' + password;
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
  console.log(credentials);

  // Vérifier la validité du JWT en extractant le payload et en le décodant
  //const payload = jwt.split('.')[1];
  //const decodepayload = atob(payload)
  //   console.log(decodepayload)

  //console.log(jwt)

//- -----------------------------------------------------------


// Send API REQUEST
// Définissez les options de la requête
const requestOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwt}` // Ajouter le JWT dans l'en-tête d'autorisation
  },
  body: JSON.stringify({
    query: `
      {
        user {
          transactions {
            type
            amount
            createdAt
          }
          auditRatio
         totalUp
         totalDown
          attrs
          firstName
          lastName
          campus
          email
          xps {
            amount
            path
            event {
              endAt
            }
          }
        }
      }
    `
  })
};

// Définissez une variable pour stocker la réponse JSON
let dt;

// Envoyez la requête à l'API
fetch('https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql', requestOptions)
  .then(response => response.json())
  .then(json => {
    dt = json;
    processData(dt)
  })
  .catch(error => console.log(error));


  function processData(data) {

    // Recup info
    var name = data.data.user[0].firstName;
    var lastName = data.data.user[0].lastName;
    var campus = data.data.user[0].campus;
    var email = data.data.user[0].email;
    var xps = data.data.user[0].xps;
    console.log(xps);
    var audit = data.data.user[0].auditRatio;
    var addresse = data.data.user[0].attrs.addressStreet;
    var city = data.data.user[0].attrs.addressCity;
    var transaction = data.data.user[0].transactions;

    //var ratio = data.data.user[0].auditRatio;
    var up=data.data.user[0].totalUp
    var down = data.data.user[0].totalDown
    console.log(data.data.user[0].totalDown,"data");

    var bar1Width = document.getElementById('bar1').getAttribute('width');
    bar1Width =up/10000
    console.log(bar1Width)
    bar1Width['width']=bar1Width
    bar1Width=document.getElementById('bar1').setAttribute('width',bar1Width);
    var bar2Width = document.getElementById('bar2').getAttribute('width');
    bar2Width =down/10000
    console.log(bar1Width)

    bar2Width=document.getElementById('bar2').setAttribute('width',bar2Width);
    var lienimage = data.data.user[0].attrs.image;

    document.getElementById("up").textContent=`${up/1000} Mb`
    document.getElementById("down").textContent=`${down/1000} Mb`
    document.getElementById('auditsRatio').textContent=`${audit.toFixed(1)} You can do better!`
    document.getElementById('auditsRatio').style.color="green"
    
    var image = document.createElement("img");
    image.setAttribute("src", lienimage);
    console.log(audit.toFixed(1));


    var lienimage = data.data.user[0].attrs.image;

    var image = document.createElement("img");
    image.setAttribute("src", "graph.jpeg");
    image.classList.add("responsive-img");
    image.style.border = "4px solid white";
    const a =document.createElement('a')
    a.href="/home.html"
    image.style.height="60px"
    image.style.width="700px"
    image.style.borderRadius="50%"
    a.appendChild(image)

    // Ajoute l'image à l'élément parent
    var header = document.querySelector("header");
    var user_info = header.querySelector(".banner");
    user_info.insertBefore(a, user_info.firstChild);


    // Calcul Total XP
    let total = 0;

   // console.log(xps)

    for(let i = 0; i < xps.length; i++){

      let path = xps[i].path;
      //console.log(path);

      if (path.includes("div")) {
          let amount = xps[i].amount;
          //console.log(amount);
          let nb = parseInt(amount);
          total += nb
         
      }
    }
    console.log(total/1000);
    
    total = total / 1000
    total = Math.round(total)
   
    // First Graphic

    var data = [
        // ...
    ];

    for(let i = 0; i < xps.length; i++) {

      let nbm = xps[i].amount;

      let path = xps[i].path;
      let dernierSlash = path.lastIndexOf("/");

      if (dernierSlash !== -1) {
        let nouvelleChaine = path.substring(dernierSlash + 1);
        var newelem = { exercice: nouvelleChaine, points: nbm }
        
      }

      data.push(newelem)
       // console.log(path)

    }

    $(document).ready(function() {
      
        // Extraire les noms des exercices et les points dans des tableaux distincts
        var exercices = data.map(function(item) {
          return item.exercice
        });
      
        var points = data.map(function(item) {
          return item.points/1000;
        });
        console.log(points[1]/100);
      
        // Créer le graphique avec Chart.js
        var ct = document.getElementById('myChart1').getContext('2d');
        var myChart = new Chart(ct, {
          type: 'bar',
          data: {
            labels: exercices,
            datasets: [{
              label: 'XP earned by project',
              data: points,
              backgroundColor: '#801877'
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      });
      
    // End of first Graphic

    // Second Graphic

    var data2 = [
      //{ date: '2023-01-01', xp: 100 },
    ];

    var date = [];

    for(let i = 0; i < transaction.length; i++) {

      var actual = transaction[i]
      
      let date = actual.createdAt.substring(0, 10);
      let heure = actual.createdAt.substring(11,16)

      if (actual.type == "xp") {
          data2.push(actual)
      }

    }

    // Trier par ordre croissant
    data2.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    // Delet Type
    data2 = data2.map(({ type, ...rest }) => rest);
    // Rename  Amount and createdAt
    data2 = data2.map(({ amount, ...rest }) => ({ xp: amount, ...rest }));
    data2 = data2.map(({ createdAt, ...rest }) => ({ date: createdAt, ...rest }));

    for(let i = 0; i < data2.length; i++) {

      var y = (i - 1)
  
      if (i != 0) {
        var precedxp = data2[y].xp;

        var Total = precedxp + data2[i].xp;

        data2[i].xp = Total
      }
    }

    // Clean la Date
    data2 = data2.map(({ xp, date }) => ({
      xp: xp,
      date: date.split('T')[0]
    }));

    console.log(data2)

    $(document).ready(function() {

      // Extraire les dates et les points XP dans des tableaux distincts
      var dates = data2.map(function(item) {
        return item.date;
      });
    
      var xpValues = data2.map(function(item) {
        return item.xp/100;
      });
    
      // Créer le deuxième graphique avec Chart.js
      var ctx = document.getElementById('myChart').getContext('2d');
      var myChart2 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [{
            label: 'XP earned in a time period',
            data: xpValues,
            //borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: '#801877',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    });
  
    // End of second graphic


  }

  //- -----------------------------------------------------------

})


.catch(error => console.error(error));


