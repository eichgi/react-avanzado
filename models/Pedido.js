const mongoose = require('mongoose');

const PedidoSchema = mongoose.Schema({
  pedido: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendedor'
  },
  estado: {
    type: String,
    default: "PENDIENTE",
  },
  creado: {
    type: Date,
    default: Date.now(),
  }
}, {timestamps: true});

module.exports = mongoose.model('Pedido', PedidoSchema)