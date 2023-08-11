const amqp = require('amqplib');

amqp.connect('amqp://localhost')
  .then((connection) => {
    console.log('connected');

    connection.createChannel()
      .then((channel) => {
        const deadExchange = 'dead_exchange';
        channel.assertQueue('main', {
          durable: true,
          deadLetterExchange: deadExchange,
          deadLetterRoutingKey: 'dlx_key',
        });

        Array.from({ length: 10 }, (_, i) => {
          const msg = `abc${i}`;
          console.log('[x] sent "%s"', msg);
          channel.sendToQueue('main', Buffer.from(msg));
        });

        setTimeout(() => {
          console.log('[!] close connection');
          connection.close();
          process.exit(0);
        }, 2000);
      })
      .catch((err) => {
        console.log('channel creation error', err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.log('connection error', err);
    process.exit(1);
  });
