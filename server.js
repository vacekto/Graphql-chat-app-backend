const express = require("express");
const graphqlhttp = require("express-graphql");
const mongoose = require("mongoose");

const graphQlSchema = require("./graphql/schema.js");
const graphQlResolvers = require("./graphql/resolvers.js")

const app = express();


app.use(
  "/graphql",
  graphqlhttp({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true
  })
);

mongoose.connect(
  `mongodb://localhost/test`, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    app.listen(3000, () => console.log("server started"));
  })
  .catch(err => {
    console.log(err);
  })
