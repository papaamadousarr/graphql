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
          id
          login
          firstName
          lastName
          campus
          auditRatio
          totalUp
          totalDown
          attrs
          groups {
            group {
              members {
                user {
                  login
                }
              }
              object {
                name
              }
              auditors(where:{grade: {_is_null: false}}) {
                auditor {
                  login
                }
                grade
              }
            }
          }
          
        }
        grade: transaction(
          where: {
            type: { _eq: "level" },
            eventId: { _eq: 56 }
          },
          order_by: { id: desc }
        ) {
          path
          amount
        }
        audits: transaction(
          order_by: {createdAt: asc}
          where: {type: {_regex: "up|down"}}
        ) {
          type
          amount
          path
          createdAt
        }
        xp: transaction(
          order_by: {createdAt: asc}
          where: {type: {_eq: "xp"}, eventId: {_eq: 56}}
        ) {
          createdAt
          amount
          path
        }
        skills: transaction(
          order_by: {type: asc, createdAt: desc,amount:desc}
          distinct_on: [type]
          where: {eventId: {_eq: 56}, _and: {type: {_like: "skill_%"}}}
        ) {
          type
          amount
        }
        xpJS: transaction(order_by: {createdAt: asc}, where: {
          type: {_eq: "xp"}
            eventId: {_eq: 37}
        }) {
                createdAt
            amount
                path
          }
          xpGo: transaction(order_by: {createdAt: asc}, where: {
          type: {_eq: "xp"}
            eventId: {_eq: 2}
        }) {
                createdAt
            amount
                path
          }
        xpTotal: transaction_aggregate(where: {
          type: {_eq: "xp"}, eventId: {_eq: 56}}) {
          aggregate {
            sum {
              amount
            }
          }
        }
      }`
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
    console.log(dt);
  })
  .catch(error => console.log(error));


  async function processData(data) {
    console.log(data.data.user[0].lastName);

    /* Recup info
    var name = data.data.user[0].firstName;
    var lastName = data.data.user[0].lastName;
    var campus = data.data.user[0].campus;
    var email = data.data.user[0].email;
    //var xp = data.data.user[0].xps;
   // console.log(data.xpTotal.aggregate.sum.amount,"xps");
    
    var tel = data.data.user[0].attrs.Phone;
    var addresse = data.data.user[0].attrs.addressStreet;
    var city = data.data.user[0].attrs.addressCity;

    var ratio = data.data.user[0].auditRatio;

    var lienimage = data.data.user[0].attrs.image;
    */
     var id=data.data.user[0].id
	   var name = data.data.user[0].login
	   var email= data.data.user[0].attrs.email
	   var nationality= data.data.user[0].attrs.nationality1
	   var campus=data.data.user[0].campus
	   var ratio= data.data.user[0].auditRatio
	   var firstName= data.data.user[0].firstName
	   var lastName= data.data.user[0].lastName
	   var xp= data.data.xpTotal.aggregate.sum.amount
	   var level= data.data.grade[0].amount
     //console.log(xp);
    var image = document.createElement("img");
    image.setAttribute("src" ,lienimage);

    //var audits =dada.data.audits
    //console.log(audits);
    console.log(data.data.user[0].totalUp/data.data.user[0].totalDown);
   
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
    let total = xp;

    //console.log(xps)

    // for(let i = 0; i < xps.length; i++){

    //   let path = xps[i].path;

    //   if (path.includes("div") && !path.includes("piscine-js-2")) {
    //     console.log(path);
    //       let amount = xps[i].amount;
    //       let nb = parseInt(amount);
    //       total += nb
    //   }
    // }
    
    total = total / 1000
    total = Math.round(total)
    //console.log(total)

    




    // Print info
    document.getElementById('lastname').textContent =  firstName + lastName ;
    document.getElementById('name').textContent = name ;
    document.getElementById('campus').textContent = campus ;
    document.getElementById('email').textContent = email ;
    document.getElementById('tel').textContent = nationality;
    document.getElementById('addresse').textContent = level;
    document.getElementById('ratio').textContent = ratio.toFixed(1)
    document.getElementById('xp').textContent = total;


  }



  //- -----------------------------------------------------------

})


.catch(error => console.error(error));


