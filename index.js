const {ApolloServer} = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const ConectarDB = require('./config/db');
const jwt = require('jsonwebtoken');

//DB Connect
ConectarDB();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({req}) => {
    //console.log("HEADERS: ", req.headers);

    const token = req.headers['authorization'] || '';
    if (token) {
      try {
        const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);

        //console.log(usuario);

        return {usuario};
      } catch (error) {
        console.log(error);
      }
    }
  },
});

server.listen()
  .then(({url}) => {
    console.log(`Servidor listo en la URL: ${url}`)
  });