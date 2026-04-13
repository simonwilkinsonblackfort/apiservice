import {
  S3Client as AWSS3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from '../../config/index.js'

export class S3Client {
  private client: AWSS3Client

  constructor() {
    this.client = new AWSS3Client({
      region: config.AWS_REGION,
      ...(config.AWS_ACCESS_KEY_ID && {
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
      }),
    })
  }

  async getFile(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    const response = await this.client.send(command)

    if (!response.Body) throw new Error('Empty response body from S3')

    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  async putFile(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
    return this.client.send(command)
  }

  async deleteFile(bucket: string, key: string) {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key })
    return this.client.send(command)
  }

  async getPresignedUrl(bucket: string, key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    return getSignedUrl(this.client, command, { expiresIn })
  }

  getDefaultBucket() {
    return config.S3_BUCKET_NAME
  }
}
