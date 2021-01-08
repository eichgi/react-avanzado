const {ApolloServer} = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => {
    const myContext = "Hola";

    return {
      myContext,
    }
  }
});

server.listen()
  .then(({url}) => {
    console.log(`Servidor listo en la URL: ${url}`)
  });