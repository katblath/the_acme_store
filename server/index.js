//imports
const {
  client,
  createTables,
  createProduct,
  createUser,
  fetchUsers,
  fetchProducts,
  createFavorite,
  fetchFavorites,
  destroyFavorite,
} = require("./db");

//set up stuff
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

//api set up, but we learned to isolate this and now we combine it
app.use(express.json());
app.use(require("morgan")("dev"));

//api routes
app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (error) {
    next(error);
  }
});
app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (error) {
    next(error);
  }
});
app.get("/api/users/:id/favorites", async (req, res, next) => {
  try {
    res.send(await fetchFavorites(req.params.id));
  } catch (error) {
    next(error);
  }
});
app.post("/api/users/:id/favorites", async (req, res, next) => {
  try {
    res
      .status(201)
      .send(await createFavorite({ userId: req.params.id, ...req.body }));
    // res.send(await createFavorite({ userId: req.params.id, ...req.body }));
  } catch (error) {
    next(error);
  }
});
app.delete("/api/users/:userId/favorites/:id", async (req, res, next) => {
  try {
    await destroyFavorite({ userId: req.params.userId, id: req.params.id });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

//init
const init = async () => {
  //connect to db
  await client.connect();
  //then wait for TABLES, yes tables! to be created via code
  await createTables();
  console.log("tables created");

  //create actual data in code now
  const [mo, larry, curly, table, column, field] = await Promise.all([
    createUser({ username: "mo", password: "stooge" }),
    createUser({ username: "larry", password: "stooge" }),
    createUser({ username: "curly", password: "stooge" }),
    createProduct({ name: "table" }),
    createProduct({ name: "column" }),
    createProduct({ name: "field" }),
  ]);
  //fetch stuff and log it
  const users = await fetchUsers();
  console.log("here's your users", users);

  const products = await fetchProducts();
  console.log("here's your products", products);

  const favorites = await Promise.all([
    createFavorite({ userId: mo.id, productId: table.id }),
    createFavorite({ userId: mo.id, productId: column.id }),
    createFavorite({ userId: larry.id, productId: column.id }),
  ]);
  console.log("here's your favorites", favorites);

  //destroy a favorite
  // await destroyFavorite({ userid: mo.id, id: favorites[0].id });
  await destroyFavorite({ userId: mo.id, id: favorites[0].id });
  console.log("favorite destroyed", await fetchFavorites(mo.id));

  //another console log
  console.log(`curl localhost:3000/api/users/${larry.id}/favorites`);
  //and another
  console.log(
    `curl -X POST localhost:3000/api/users/${larry.id}/favorites -d '{"productId":"${field.id}"}' -H 'Content-Type:application/json'`
  );
  console.log(
    `curl -X DELETE localhost:3000/api/users/${larry.id}/favorites/${favorites[0].id}`
  );

  //listener here
  app.listen(port, () => console.log(`Server is serving port: ${port}`));
};
init();
