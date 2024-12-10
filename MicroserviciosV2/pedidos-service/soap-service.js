const soap = require('soap');
const express = require('express');
const { Pool } = require('pg');

const app = express();

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Función para obtener el estado de un pedido
async function getPedidoStatus(args) {
  const { id_pedido } = args;

  // Validar si el ID es un número válido
  if (!Number.isInteger(Number(id_pedido))) {
    return { status: 'ID del pedido inválido' };
  }

  try {
    const result = await pool.query('SELECT estado FROM pedidos WHERE id_pedido = $1', [id_pedido]);
    if (result.rows.length === 0) {
      return { status: 'Pedido no encontrado' };
    }
    return { status: result.rows[0].estado };
  } catch (error) {
    console.error('Error al consultar el estado del pedido:', error.stack);
    return { status: 'Error interno del servidor' };
  }
}

// Definición del servicio SOAP
const service = {
  PedidoService: {
    PedidoPort: {
      GetPedidoStatus: getPedidoStatus, // Vincula la función al método SOAP
    },
  },
};

// Definición del WSDL
const wsdlDefinition = `
<definitions name="PedidoService" 
             targetNamespace="http://www.example.org/PedidoService/"
             xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:tns="http://www.example.org/PedidoService/"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema">

  <message name="GetPedidoStatusRequest">
    <part name="id_pedido" type="xsd:int"/>
  </message>
  <message name="GetPedidoStatusResponse">
    <part name="status" type="xsd:string"/>
  </message>

  <portType name="PedidoPortType">
    <operation name="GetPedidoStatus">
      <input message="tns:GetPedidoStatusRequest"/>
      <output message="tns:GetPedidoStatusResponse"/>
    </operation>
  </portType>

  <binding name="PedidoPortBinding" type="tns:PedidoPortType">
    <soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="GetPedidoStatus">
      <soap:operation soapAction="GetPedidoStatus"/>
      <input>
        <soap:body use="literal"/>
      </input>
      <output>
        <soap:body use="literal"/>
      </output>
    </operation>
  </binding>

  <service name="PedidoService">
    <port name="PedidoPort" binding="tns:PedidoPortBinding">
      <soap:address location="http://localhost:4000/wsdl"/>
    </port>
  </service>
</definitions>
`;

// Iniciar el servidor SOAP
const PORT = process.env.SOAP_PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Servicio SOAP escuchando en http://localhost:${PORT}/wsdl`);
  soap.listen(server, '/wsdl', service, wsdlDefinition);
});