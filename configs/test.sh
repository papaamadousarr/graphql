npm install -g http-server
http-server

<form id="loginForm">
            <label for="username">Username or Email:</label>
            <input type="text" id="username" name="username" required>

            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>

            <button type="submit">Login</button>
            <p id="errorMessage" style="color: red; display: none;">Invalid credentials, please try again.</p>
        </form>