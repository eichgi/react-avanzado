const Usuario = require('./../models/Usuario');
const Producto = require('./../models/Producto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

const crearToken = (usuario, secret, expiresIn) => {
  const {id, email, nombre, apellido} = usuario;

  return jwt.sign({id, email, nombre, apellido}, secret, {expiresIn});
};

const
  resolvers = {
    Query: {
      obtenerUsuario: async (_, {token}) => {
        return await jwt.verify(token, process.env.JWT_SECRET);
      },
      obtenerProductos: async () => {
        try {
          return await Producto.find({});
        } catch (error) {
          console.log(error);
        }
      },
      obtenerProducto: async (_, {id}) => {
        const producto = await Producto.findById(id);

        if (!producto) {
          throw new Error('El producto no existe.');
        }

        return producto;
      },
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
      },
      autenticarUsuario: async (_, {input}) => {

        //Existencia del usuario
        const {email, password} = input;

        const usuario = await Usuario.findOne({email});

        if (!usuario) {
          throw new Error('El usuario no existe');
        }

        const rightPassword = await bcrypt.compareSync(password, usuario.password);
        if (!rightPassword) {
          throw new Error('El password es incorrecto');
        }

        return {
          token: crearToken(usuario, process.env.JWT_SECRET, '24h'),
        }
      },
      nuevoProducto: async (_, {input}) => {
        try {
          const producto = new Producto(input);

          const resultado = await producto.save();

          return resultado;
        } catch (error) {
          console.log(error);
        }
      },
      actualizarProducto: async (_, {id, input}) => {
        let producto = await Producto.findById(id);

        if (!producto) {
          throw new Error('El producto no existe.');
        }

        producto = await Producto.findOneAndUpdate({_id: id}, input, {new: true});

        return producto;
      },
      eliminarProducto: async (_, {id}) => {
        let producto = await Producto.findById(id);

        if (!producto) {
          throw new Error('El producto no existe.');
        }

        await producto.delete();

        return "El producto ha sido eliminado";
      },
    },
  };

module.exports = resolvers;