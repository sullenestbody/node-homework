const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");

const scrypt = util.promisify(crypto.scrypt);

// Create a salted password hash
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

// Compare a password with its stored hash
async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);

  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// REGISTER
async function register(req, res) {
  const { error, value } = userSchema.validate(req.body || {}, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const { name, email, password } = value;

  const existingUser = global.users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashedPassword = await hashPassword(password);

  const user = {
    name,
    email,
    hashedPassword,
  };

  global.users.push(user);
  global.user_id = user;

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

// LOGON
async function logon(req, res) {
  const { email, password } = req.body || {};

  const user = global.users.find(
    (user) =>
      user.email ===
      (typeof email === "string" ? email.trim().toLowerCase() : ""),
  );

  const goodCredentials =
    user &&
    typeof password === "string" &&
    (await comparePassword(password, user.hashedPassword));

  if (!goodCredentials) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  global.user_id = user;

  return res.status(200).json({
    name: user.name,
    email: user.email,
  });
}

// LOGOFF
function logoff(req, res) {
  global.user_id = null;

  return res.status(200).json({
    message: "Logged off successfully",
  });
}

module.exports = {
  register,
  logon,
  logoff,
};
