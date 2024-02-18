import { Logger } from '@aws-lambda-powertools/logger';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { parse } from '@fast-csv/parse';

const logger = new Logger({ serviceName: 'integracao-s3-lambda-sqs' });
const s3Client = new S3Client();
const sqsClient = new SQSClient();

async function converteCSV(Body) {
    return new Promise((resolve, reject) => {
        let dataCsv = [];
        Body
            .pipe(parse({ headers: true }))
            .on('error', error => {
                reject(logger.error('Erro ao realizar conversão CSV', error));
            })
            .on('data', linha => {
                logger.info('Linha convertida', linha);
                dataCsv.push(linha);
            })
            .on('end', (countLinha) => {
                logger.info('Conversão CSV finalizada. ' + countLinha + ' linhas afetadas.');
                logger.info('DataCSV', dataCsv);
                resolve(dataCsv);
            });
    });
}

export const app = async (event, context) => {
    logger.info('Iniciando lambda!');
    logger.info('Event recebido', event);

    const bucketName = event.Records[0].s3.bucket.name;
    const keyObject = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    logger.info('inputS3', { Bucket: bucketName, Key: keyObject });

    try {
        // Obtendo objeto do S3
        const { Body } = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: keyObject }));

        logger.info('Iniciando conversão do CSV');

        let csvConvertido = await converteCSV(Body);

        // Enviando para a fila SQS
        await sqsClient.send(new SendMessageCommand(
            {
                QueueUrl: process.env.URL_SQS,
                MessageBody: JSON.stringify(csvConvertido),
                MessageGroupId: keyObject,
                MessageDeduplicationId: keyObject
            }
        ));

        logger.info('Mensagem enviado ao SQS com sucesso!');
    } catch (error) {
        logger.error('Ocorreu um erro', error);
        throw new Error('Ocorreu um erro')
    }
}