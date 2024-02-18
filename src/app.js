import { Logger } from '@aws-lambda-powertools/logger';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { parse } from '@fast-csv/parse';

const logger = new Logger({ serviceName: 'integracao-s3-lambda-sqs' });
const s3Client = new S3Client();
const sqsClient = new SQSClient();

export const app = async (event, context) => {
    logger.info('Iniciando lambda!');
    logger.info('Event recebido', event);

    const bucketName = event.Records[0].s3.bucket.name;
    const keyObject = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    logger.info('inputS3', { Bucket: bucketName, Key: keyObject });

    try {
        // Obtendo objeto do S3
        const { Body } = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: keyObject }));

        // Convertendo CSV
        const data = Body
            .pipe(parse({ headers: false }))
            .on('error', error => console.log('ERRO NO PARSE: ', error))
            .on('data', row => console.log('ROW NO PARSE: ', row))
            .on('end', rowCount => {
                console.log(`Parsed ${rowCount} rows`);
            });

        logger.info('Sucesso ao realizar conexão com o S3');
    } catch (error) {
        logger.error('Erro ao realizar conexão com S3', error);
        throw new Error('Erro ao realizar conexão com S3')
    }

    try {
        // Enviando para a fila SQS
        const responseSQS = await sqsClient.send(new SendMessageCommand(
            {
                QueueUrl: 'https://sqs.sa-east-1.amazonaws.com/279608136202/integracao-fila.fifo',
                MessageBody: '',
                MessageGroupId: 'messageGroupTeste',
                MessageDeduplicationId: 'messageDeduplicationIdTeste'
            }
        ));

        logger.info('Sucesso ao enviar mensagem ao SQS');
    } catch (error) {
        logger.info('Erro ao enviar mensagem ao SQS', error);
        throw new Error('Erro ao enviar mensagem ao SQS');
    }

    return {
        statusCode: 200,
        body: 'Lambda executada com sucesso!'
    }
}