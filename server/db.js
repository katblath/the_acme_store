//db set up
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_store"
);
//require stuff we were told to use
const uuid = require("uuid");
const bcrypt = require("bcrypt");

//create tables in CODE! yeah, we're doing it in code!
const createTables = async () => {
  const SQL = `--sql
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS products;

    CREATE TABLE products(
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    );
    CREATE TABLE users(
      id UUID PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL
    );
    CREATE TABLE favorites(
      id UUID PRIMARY KEY,
      "userId" UUID REFERENCES users(id) not null,
      "productId" UUID REFERENCES products(id) not null,
      CONSTRAINT unique_user_product UNIQUE("userId", "productId")
    );
    `;
  await client.query(SQL);
};

//make da users
const createUser = async ({ username, password }) => {
  const SQL = `--sql
    INSERT INTO users(id, username, password)
    VALUES ($1, $2, $3)
    RETURNING *;
    `;
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    await bcrypt.hash(password, 2),
  ]);
  return response.rows[0];
};

//make products
const createProduct = async ({ name }) => {
  const SQL = `--sql
    INSERT INTO products(id, name)
    VALUES ($1, $2)
    RETURNING *;
    `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};
//create the favorites
const createFavorite = async ({ userId, productId }) => {
  const SQL = `--sql
      INSERT INTO favorites(id, "userId", "productId")
      VALUES ($1, $2, $3)
      RETURNING *;
      `;
  const response = await client.query(SQL, [uuid.v4(), userId, productId]);
  return response.rows[0];
};
//fetch stuff
const fetchUsers = async () => {
  const SQL = `--sql
    SELECT * FROM users;
    `;
  const response = await client.query(SQL);
  return response.rows;
};
const fetchProducts = async () => {
  const SQL = `--sql
    SELECT * FROM products;
    `;
  const response = await client.query(SQL);
  return response.rows;
};
const fetchFavorites = async (id) => {
  const SQL = `--sql
    SELECT * FROM favorites
    WHERE "userId" = $1;
    `;
  const response = await client.query(SQL, [id]);
  return response.rows;
};

//dont forget to allow physical destruction of the favorites
const destroyFavorite = async ({ id, userId }) => {
  const SQL = `--sql
        DELETE FROM favorites
        WHERE id = $1 AND "userId" = $2;
        `;
  await client.query(SQL, [id, userId]);
};

//export the stuff becuase moving it from file A to file B is a goodah thing
module.exports = {
  client,
  createTables,
  createProduct,
  createUser,
  fetchUsers,
  fetchProducts,
  createFavorite,
  fetchFavorites,
  destroyFavorite,
};
