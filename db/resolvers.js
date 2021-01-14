const Usuario = require('./../models/Usuario');
const Cliente = require('./../models/Cliente');
const Producto = require('./../models/Producto');
const Pedido = require('./../models/Pedido');
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
      obtenerUsuario: async (_, {token}, ctx) => {
        //return await jwt.verify(token, process.env.JWT_SECRET);
        return ctx.usuario;
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
      obtenerClientes: async () => {
        try {
          const clientes = await Cliente.find();

          return clientes;
        } catch (error) {
          console.log(error);
        }
      },
      obtenerClientesVendedor: async (_, {}, ctx) => {
        try {
          const vendedorId = ctx.usuario.id.toString();
          const clientes = await Cliente.find({vendedor: vendedorId});

          return clientes;
        } catch (error) {
          console.log(error);
        }
      },
      obtenerCliente: async (_, {id}, ctx) => {
        const cliente = await Cliente.findById(id);

        if (!cliente) {
          throw new Error('El cliente no existe');
        }

        if (cliente.vendedor.toString() !== ctx.usuario.id) {
          throw new Error('Acceso denegado: No puedes ver este cliente');
        }

        return cliente;
      },
      obtenerPedidos: async () => {
        try {
          const pedidos = await Pedido.find();

          return pedidos;
        } catch (error) {
          console.log(error);
        }
      },
      obtenerPedidosVendedor: async (_, {}, ctx) => {
        try {
          const vendedor = ctx.usuario.id;
          const pedidos = await Pedido.find({vendedor});

          return pedidos;
        } catch (error) {
          console.log(error);
        }
      },
      obtenerPedido: async (_, {id}, ctx) => {
        try {
          const vendedor = ctx.usuario.id;
          const pedido = await Pedido.findById(id);

          if (!pedido) {
            throw new Error('El pedido no existe');
          }

          if (pedido.vendedor.toString() !== vendedor) {
            throw new Error('No tienes permiso para ver este pedido');
          }

          return pedido;
        } catch (error) {
          console.log(error);
        }
      },
      obtenerPedidosEstado: async (_, {estado}, ctx) => {
        const pedidos = await Pedido.find({vendedor: ctx.usuario.id, estado});

        return pedidos;
      },
      mejoresClientes: async () => {
        const clientes = await Pedido.aggregate([
          {$match: {estado: "COMPLETADO"}},
          {
            $group: {
              _id: "$cliente",
              total: {$sum: '$total'}
            }
          },
          {
            $lookup: {
              from: "clientes",
              localField: "_id",
              foreignField: '_id',
              as: "cliente",
            }
          },
          {
            $sort: {
              total: -1,
            }
          }
        ]);

        return clientes;
      },
      mejoresVendedores: async () => {
        const vendedores = await Pedido.aggregate([
          {
            $match: {estado: "COMPLETADO"},
          },
          {
            $group: {
              _id: "$vendedor",
              total: {$sum: '$total'}
            }
          },
          {
            $lookup: {
              from: 'usuarios',
              localField: '_id',
              foreignField: '_id',
              as: 'vendedor',
            }
          },
          {
            $limit: 3,
          },
          {
            $sort: {
              total: -1,
            }
          }
        ]);

        return vendedores;
      },
      buscarProducto: async (_, {text}) => {
        const productos = await Producto.find({$text: {$search: text}}).limit(10);

        return productos;
      }
    },
    Mutation: {
      nuevoUsuario: async (_, {input}) => {
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
      nuevoCliente: async (_, {input}, ctx) => {
        const {email} = input;
        let cliente = await Cliente.findOne({email});

        if (cliente) {
          throw new Error('El cliente ya esta registrado');
        }

        cliente = new Cliente(input);

        cliente.vendedor = ctx.usuario.id;

        try {
          cliente = await cliente.save();

          return cliente;
        } catch (error) {
          console.log(error);
        }

      },
      actualizarCliente: async (_, {id, input}, ctx) => {
        let cliente = await Cliente.findById(id);

        if (!cliente) {
          throw new Error('El cliente no existe');
        }

        if (cliente.vendedor.toString() !== ctx.usuario.id) {
          throw new Error('No puedes modificar este cliente');
        }

        cliente = await Cliente.findByIdAndUpdate({_id: id}, input, {new: true});

        return cliente;
      },
      eliminarCliente: async (_, {id}, ctx) => {
        let cliente = await Cliente.findById(id);

        if (!cliente) {
          throw new Error('El cliente no existe');
        }

        if (cliente.vendedor.toString() !== ctx.usuario.id) {
          throw new Error('No puedes modificar este cliente');
        }

        await cliente.delete();

        return "El cliente ha sido eliminado";
      },
      nuevoPedido: async (_, {input}, ctx) => {
        const {cliente} = input;
        // Verificar existencia cliente
        let clienteExiste = await Cliente.findById(cliente);

        if (!clienteExiste) {
          throw new Error('El cliente no existe');
        }

        // Cliente pertenece al vendedor
        if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
          throw new Error('No puedes modificar este cliente');
        }

        // Stock disponible
        for await (const articulo of input.pedido) {
          const {id} = articulo;

          const producto = await Producto.findById(id);

          if (articulo.cantidad > producto.existencia) {
            throw new Error('Uno de los productos no tiene suficiente stock');
          } else {
            producto.existencia = producto.existencia - articulo.cantidad;
            await producto.save();
          }
        }

        const nuevoPedido = new Pedido(input);

        // Asignar vendedor
        nuevoPedido.vendedor = ctx.usuario.id;

        //Guardar pedido
        await nuevoPedido.save();

        return nuevoPedido;
      },
      actualizarPedido: async (_, {id, input}, ctx) => {
        const {cliente} = input;

        const existePedido = await Pedido.findById(id);

        if (!existePedido) {
          throw new Error('El pedido no existe');
        }

        const existeCliente = await Cliente.findById(cliente);
        if (!existeCliente) {
          throw new Error('El cliente no existe');
        }

        if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
          throw new Error('Acceso denegado: no tienes permiso');
        }

        if (input.pedido) {

          for await (const articulo of input.pedido) {
            const {id} = articulo;

            const producto = await Producto.findById(id);

            if (articulo.cantidad > producto.existencia) {
              throw new Error('Uno de los productos no tiene suficiente stock');
            } else {
              producto.existencia = producto.existencia - articulo.cantidad;
              await producto.save();
            }
          }
        }

        const pedido = await Pedido.findByIdAndUpdate({_id: id}, input, {new: true});

        return pedido;
      },
      eliminarPedido: async (_, {id}, ctx) => {
        const pedido = await Pedido.findById(id);

        if (!pedido) {
          throw new Error('El pedido no existe');
        }

        if (pedido.vendedor.toString() !== ctx.usuario.id) {
          throw new Error('Acceso denegado: no tienes permiso');
        }

        await pedido.delete();

        return "El pedido ha sido eliminado";
      }
    },
  };

module.exports = resolvers;