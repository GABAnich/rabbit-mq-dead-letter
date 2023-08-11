const amqp = require('amqplib');

amqp.connect('amqp://localhost')
  .then((connection) => {
    console.log('connected');

    connection.createChannel()
      .then((channel) => {
        const queue = 'main';
        const deadQueue = 'dead_queue';
        const deadExchange = 'dead_exchange';
        channel.assertQueue(queue, {
          durable: true,
          deadLetterExchange: deadExchange,
          deadLetterRoutingKey: 'dlx_key',
        });
        channel.assertExchange(deadExchange, 'direct');
        channel.assertQueue(deadQueue, {
          durable: true,
        });
        channel.bindQueue(deadQueue, deadExchange, 'dlx_key');
        channel.prefetch(1);
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

        channel.consume(queue, (msg) => {
          const message = msg.content.toString();
          console.log(queue, message);
          setTimeout(() => {
            channel.nack(msg, false, false);
          }, 100);
        });

        channel.consume(deadQueue, (msg) => {
          console.log(deadQueue, msg.content.toString());
          const obj = JSON.parse(msg.content.toString());
          const new_obj = { ...obj, retries_count: obj.retries_count + 1};
          console.log(obj, new_obj);
          const new_msg = JSON.stringify(new_obj);
          if (new_obj.retries_count < 5) {
            channel.sendToQueue(queue, Buffer.from(new_msg));
          }
          channel.ack(msg);
        });

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
