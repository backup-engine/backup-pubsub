import { AzureFunction, Context } from "@azure/functions"
import { ServiceBusClient } from "@azure/service-bus";

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {

    const connectionString = 'Endpoint=sb://bk-pubsub.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SfO6nS6P+P7O5BAHjzahrVoyiI5UYDGe3+ASbCfB1cU=';
    const queueName = 'task-queue-free';

    if (connectionString && queueName) {

        // Create client
        const sbClient = new ServiceBusClient(connectionString);
        // createSender() can also be used to create a sender for a topic.
        const sender = sbClient.createSender(queueName);

        const messages = [
            { body: "Albert Einstein" },
            { body: "Werner Heisenberg" },
            { body: "Marie Curie" },
            { body: "Steven Hawking" },
            { body: "Isaac Newton" },
            { body: "Niels Bohr" },
            { body: "Michael Faraday" },
            { body: "Galileo Galilei" },
            { body: "Johannes Kepler" },
            { body: "Nikolaus Kopernikus" }
        ];

        try {
            // Tries to send all messages in a single batch.
            // Will fail if the messages cannot fit in a batch.
            // await sender.sendMessages(messages);

            // create a batch object
            let batch = await sender.createMessageBatch();
            for (let i = 0; i < messages.length; i++) {
                // for each message in the array			

                // try to add the message to the batch
                if (!batch.tryAddMessage(messages[i])) {
                    // if it fails to add the message to the current batch
                    // send the current batch as it is full
                    await sender.sendMessages(batch);
                    context.log(`Sent a batch of messages to the queue: ${queueName}`);

                    // then, create a new batch 
                    batch = await sender.createMessageBatch();

                    // now, add the message failed to be added to the previous batch to this batch
                    if (!batch.tryAddMessage(messages[i])) {
                        // if it still can't be added to the batch, the message is probably too big to fit in a batch
                        throw new Error("Message too big to fit in a batch");
                    }
                }
            }

            // Send the last created batch of messages to the queue
            await sender.sendMessages(batch);

            context.log(`Sent a batch of messages to the queue: ${queueName}`);

            // Close the sender
            await sender.close();
        } finally {
            await sbClient.close();
        }
    } else {
        context.log("Connection String or Queue Name undefined");
    }
};

export default timerTrigger;
