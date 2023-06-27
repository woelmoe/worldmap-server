// #!/usr/bin/env node
const express = require('express');
const cors = require('cors');
const amqp = require('amqplib/callback_api')
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const { Model, DataTypes } = Sequelize;

const sequelize = new Sequelize('stilgroza', 'postgres', 'password', {
  host: '192.168.201.25',
  port: '5432',
  dialect: 'postgres',
  define: {

  }
});
async function auth() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
auth()

class Lightnings extends Model { }

Lightnings.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  latitude: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: false
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'lightnings',
  createdAt: false,
  updatedAt: false
});

const app = express()
app.use(cors());
app.use(bodyParser.json());

const host = '127.0.0.1';
const port = 7000;

app.listen(port, host, function () {
  console.log(`Server listens http://${host}:${port}`);
});

amqp.connect('amqp://test:password@192.168.201.25:5672', (err0, connection) => {
  if (err0) throw err0
  connection.createChannel((err1, channel) => {
    if (err1) throw err1
    const mainQueue = 'main'
    channel.assertQueue(mainQueue, {
      durable: false
    })
    channel.purgeQueue(mainQueue)

    app.post('/', (req, res) => {
      const postData = req.body
      const newLightnings = {
        latitude: +((+req.body.latitude).toFixed(6)),
        longitude: +((+req.body.longitude).toFixed(6)),
        time: +req.body.timestamp
      }
      Lightnings.create(newLightnings)
        .then((data) => {
          console.log('New Lightnings record saved:', data.toJSON());
        })
        .catch((error) => {
          console.error('Error saving Lightnings record:', error);
        });
      console.log(newLightnings)

      const message = JSON.stringify(postData)

      // sendMessageToConsumer(message)
      res.send(message)
    })

    channel.consume(mainQueue, (msg) => {
      const content = msg.content
      console.log(content.toString('utf-8'))
    })

    function sendMessageToConsumer(message) {
      channel.sendToQueue(mainQueue, Buffer.from(message))
    }
  })
})

// 192.165.65.82
