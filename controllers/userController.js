const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");
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
async function register(req, res, next) {
  const { error, value } = userSchema.validate(req.body || {}, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const { name, email, password } = value;
  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
      select: {
        name: true,
        email: true,
        id: true,
      },
    });

    global.user_id = user.id;

    return res.status(201).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    return next(err);
  }
}

// LOGON
async function logon(req, res, next) {
  const { email, password } = req.body || {};

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || typeof password !== "string") {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const goodCredentials =
      user && (await comparePassword(password, user.hashedPassword));

    if (!goodCredentials) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    global.user_id = user.id;

    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    return next(err);
  }
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
