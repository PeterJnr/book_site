const Layout = require("./email.layout");

const otpTemplate = (user, otpCode) => {
  return (`
    ${Layout.Header()}

    <div style="text-align: center;">
      <p>Dear ${user.name},</p>
      <p style="text-align: center;">
        To complete your sign-in or verification, please use the following One-Time Password (OTP):
      </p>
      <br/>
      <h2 style="font-size: 24px; color: #333;">${otpCode}</h2>
      <br/>
      <p style="text-align: center;">
        This OTP is valid for the next 10 minutes.<br/>
        Please do not share this OTP with anyone for your security.
      </p>
      <br/>
      <hr />
      <br/>
      <p style="text-align: center;">
        If you did not request this, please contact our support team immediately.<br />
        Thanks,<br/>
        Your Favorite Book Store Team.
      </p>
    </div>

    ${Layout.Footer()}
  `);
};

module.exports = otpTemplate;
