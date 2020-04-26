require("dotenv").config()
const { ApolloServer } = require("apollo-server")
const mongoose = require("mongoose")

const typeDefs = require("./graphql/schema.js")
const resolvers = require("./graphql/resolvers.js")

const server = new ApolloServer({ typeDefs, resolvers })

mongoose.connect(process.env.MONGODB, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  server.listen(3001).then(({ url, subscriptionsUrl }) => {
    console.log(`Server ready at ${url}`);
    console.log(`Subscriptions ready at ${subscriptionsUrl}`);
  })
}).then(() => {
  console.log(`server started`)
}).catch(err => {
  console.log(err);
})
