const Usuario = require('./../models/Usuario');
const bcrypt = require('bcryptjs');

const resolvers = {
  Query: {
    obtenerCurso: () => "Hi hi ho"
  },
  Mutation: {
    nuevoUsuario: async (_, {input}) => {
      console.log(input);
      const {email, password} = input;

      //Revisar existencia de usuario
      const usuario = await Usuario.findOne({email: email});

      if (usuario) {
        throw new Error('El usuario ya esta registrado');
      }

      //Hashear password
      const salt = await bcrypt.genSaltSync(10);
      input.password = await bcrypt.hashSync(password, salt);

      //Almacenar registro
      try {
        const usuario = new Usuario(input);
        await usuario.save();
        return usuario;

      } catch (error) {
        console.log(error);
      }
    }
  }
};

module.exports = resolvers;