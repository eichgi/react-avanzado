const {gql} = require('apollo-server');

//Schema
const typeDefs = gql`
    type Query {
        obtenerUsuario(token: String!): Usuario
    }
    
    type Usuario {
        id: ID
        nombre: String
        apellido: String
        email: String
        creado: String
    }
    
    type Token {
        token: String
    }
    
    input UsuarioInput {
        nombre: String!
        apellido: String!
        email: String!
        password: String!
    }
    
    input AutenticarInput {
        email: String!
        password: String!
    }
    
    type Mutation {
        nuevoUsuario(input: UsuarioInput): Usuario
        autenticarUsuario(input: AutenticarInput): Token
    }
`;

module.exports = typeDefs;