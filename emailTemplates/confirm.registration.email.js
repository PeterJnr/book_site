const Layout = require("./email.layout");

const confirmEmail = (user, resetToken) => {
  return `
        ${Layout.Header()}

        <div style="text-align: center;">
          <p>Dear ${user.name}!</p>
          <p style="text-align: center;">
             please click on the link below to confirm your email and complete your registration.<br />
          </p>
          <br/>
          <hr />
          <br/>
          <p style="text-align: center;">
            Please click here to confirm:
            <a href="${resetToken}">${resetToken}</a></p>
          </p>
          <p>${resetToken}</p>
          <br/>
          <hr />
          <br/>
          <p style="text-align: center;">
            If you did not request this change, kindly contact our security team through this email. peter@gmail.com<br />
            Thanks,<br/>
            Your Favorite Book Store.
          </p>
        </div>

        ${Layout.Footer()}
    `;
};

const adminConfirmEmail = (user, resetToken, password) => {
  return `
        ${Layout.Header()}

        <div style="text-align: center;">
          <p>Dear ${user.name}!</p>
          <p style="text-align: center;">
             Please click on the link below to confirm your email and complete your registration.
             We advise that you change your password to anything familiar so you can find it more convinient and easy to remember<br />
          </p>
          <br/>
          <hr />
          <br/>
          <p style="text-align: center;">
            Your login credentials are as follows:<br/>
            <strong>Email:</strong> ${user.email}<br/>
            <strong>Password:</strong> ${password}<br/>
          </p>
          <br/>
          <p style="text-align: center;">
            Please click here to confirm your account:
            <a href="${resetToken}">${resetToken}</a>
          </p>
          <p>${resetToken}</p>
          <br/>
          <hr />
          <br/>
          <p style="text-align: center;">
            If you did not request this registration, kindly contact our security team through this email: peter@gmail.com<br />
            Thanks,<br/>
            Your Favorite Book Store.
          </p>
        </div>

        ${Layout.Footer()}
    `;
};

module.exports = { confirmEmail, adminConfirmEmail };
