const {ApolloServer, gql} = require('apollo-server');

const server = new ApolloServer({});

server.listen()
  .then(({url}) => {
    console.log(`Servidor listo en la URL: ${url}`)
  });