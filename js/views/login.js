class Login extends HTMLElement{
    constructor(){
        super();
    }
    async login(e){
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        let formData = {
            "emailUsername": document.getElementById("loginUsername").value,
            "password": document.getElementById("loginPassword").value,
        }
        if (!validLoginForm(formData)) {
            e.preventDefault();
            console.log("invalid login form");
            return false;
        };
        const credentials = `${username}:${password}`;
        const encodedCredentials = new TextEncoder().encode(credentials);
        const base64Credentials = fromByteArray(encodedCredentials);
        const headers = new Headers();
        headers.append('Authorization', 'Basic ' + base64Credentials);
        headers.append('Content-Type', 'application/json');
        try {
            const response = await fetch('https://learn.zone01dakar.sn/api/auth/signin', {
                method: 'POST',
                headers: headers,
            })
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('jwt', data);
                // go to dashboard
                location.reload();
            } else {
                document.getElementById("loginErrorMessage").innerHTML = "Invalid username or password";
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    connectedCallback() {
        this.render();
        this.addEventListener('submit', this.login);
    };
    disconnectedCallback() {};
    render() {
        this.innerHTML = `
        <div class = "loginPage" id="loginPage">
        <!--LEFT-->
        <div class="container__left">
            <div class="main__logo-title">
                <a href="" class="mainlogo__link" id="mainlogo">
                    <h1 class= "mainlogo_title">My Intrack</h1>
                </a>
            </div>
        </div>
        <!--RIGHT-->
        <div class="container__right">
            <!------------------------------------LOGIN FORM----------------------------------->
            <form class="form" id="login">
                <!--title-->
                <h1 class="form__title">Login</h1>
                <div class="form__message form__message--error" id="loginErrorMessage"></div>
        
                <div class="form__input-group">
                    <!--username-->
                    <!--   <h2>Username</h2> -->
                    <div class="form__input-error-message" id="loginUsernameErrMsg"></div>
                    <input type="text" class="form__input" autofocus placeholder="Username or Email" name="loginUsername" id="loginUsername" required>
                </div>
    
                <div class="form__input-group">
                    <!--password-->
                    <!-- <h2>Password</h2> -->
                    <div class="form__input-error-message" id="loginPasswordErrMsg"></div>
                    <input type="password" class="form__input" autofocus placeholder="Password" id="loginPassword" name="loginPassword" required>
                    
                </div>
                <!--submit button-->
                <input type="submit" class="form__button" id="loginSubmit" value="Submit">
            </form>
        </div>`
    }
}

function fromByteArray(uint8array) {
    return btoa(String.fromCharCode.apply(null, uint8array));
}

customElements.define("login-page", Login);

function validLoginForm(formData){
    const usernameErrMsg =  document.getElementById("loginUsernameErrMsg")
    const passwordErrMsg =  document.getElementById("loginPasswordErrMsg")

    let valid = {
        username: true,
        password: true,
    }
// check if username is empty
if (formData.username == ""){
    valid.username = false;
 } else {
     // check if usernameemail is valid username or email
     const emailRegex = new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/);
     const usernameRegex = new RegExp(/^[åäöÅÄÖA-Za-z0-9]+$/);
     if (!(usernameRegex.test(formData.username) || emailRegex.test(formData.username))){
         usernameErrMsg.innerHTML = "Username is invalid";
         valid.username = false;
     } else {
         // else username is valid
         usernameErrMsg.classList.remove("form__input-error-message");
         usernameErrMsg.innerHTML = "";
         valid.username = true;
     }
 }

    // check if password is empty
    if (formData.password == ""){
        passwordErrMsg.classList.add("form__input-error-message");
        valid.password = false;
    } else {
        passwordErrMsg.classList.remove("form__input-error-message");
        passwordErrMsg.innerHTML = "";
        valid.password = true;
    }
    
    // if all booleans are true, return true else return false
    if (valid.username == false || valid.password == false){
        return false;
    } else {
        return true;
    }
}
