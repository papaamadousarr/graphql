const query = `
  query {
    user {
      id
      login
    }
  }
`;

fetch('https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query })
})
  .then(res => res.json())
  .then(data => console.log(data.data));


/*
// find campus name
query {
  event {
    campus
  }
}
*/

/*
// find all events xp
query {
  event {
		xps {
		  amount
		  path
		  userId
		}
  }
}
/*


/*
// Check if the site is up and responding
async function checkEndpoint() {
    const endpoint = "https://learn.zone01dakar.sn/intra/rouen/profile?event=48";
    
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        console.log("Site is up and responding");
      } else {
        console.log(`Site returned a ${response.status} status code`);
      }
    } catch (error) {
      console.error("Error checking endpoint:", error);
    }
  }
  
  checkEndpoint();
*/