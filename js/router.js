console.log('router.js loaded');
const urlRoutes = {
    '/graphql/': {
        template: "<dashboard-page></dashboard-page>"
    },
    '/index.html': {
        template: "<dashboard-page></dashboard-page>"
    },
    '/': {
        template: "<dashboard-page></dashboard-page>"
    },
    '/login': {
        template: "<login-page></login-page>"
    }
};

const urlRoute = (path) => {
    urlLocationHolder();
  };
  
  const urlLocationHolder = async () => {
    let location = window.location.pathname;
  
    const jwt = localStorage.getItem("jwt");
  
    if (jwt == null && location == "/graphql/") {
      location = "/login";
    }
  
    const route = urlRoutes[location];
    const html = route.template;
    document.getElementById("main").innerHTML = html;
  };
  
  window.route = urlRoute;
  urlLocationHolder();