import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import S3 from './config/s3.config';
import { getSignedCookies, getSignedUrl } from '@aws-sdk/cloudfront-signer';

@Injectable()
export class StorageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = S3;
  }

  async uploadFile(file: Express.Multer.File) {
    const key = `${new Date().getTime()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);

      // const objectCommand = new GetObjectCommand({
      //   Bucket: process.env.AWS_BUCKET_NAME,
      //   Key: key,
      // });
      // Comment code below if you don't want to generate a signed URL
      // const publicUrl = await getSignedUrl(this.s3Client, objectCommand, {
      //   expiresIn: 3600,
      // });
      //// Using cloudfront + public key pair to generate signed URL
      const cloudfrontDistributionDomain = process.env.AWS_CLOUDFRONT_S3_DOMAIN;
      const url = `${cloudfrontDistributionDomain}/${key}`;
      const keyPairId = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID;
      const privateKey = process.env.AWS_CLOUDFRONT_PRIVATE_KEY;
      const dateLessThan = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 minutes
      const publicUrl = getSignedUrl({
        url,
        keyPairId,
        privateKey,
        dateLessThan,
      });
      //
      return {
        key: key,
        // url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION_ID}.amazonaws.com/${key}`,
        publicUrl: publicUrl,
      };
    } catch (error) {
      // Handle error appropriately
      throw error;
    }
  }

  async getUploadUrl(data: { fileName: string; fileType: string }) {
    const key = `${new Date().getTime()}-${data.fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: data.fileType,
    });

    // const publicUrl = getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async getCloudfrontUrl() {
    const privateKey = process.env.AWS_CLOUDFRONT_PRIVATE_KEY;
    const keyPairId = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID;
    const cloudFrontDomain = process.env.AWS_CLOUDFRONT_S3_DOMAIN;

    const policy = JSON.stringify({
      Statement: [
        {
          Resource: `${cloudFrontDomain}/*`,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': Math.floor(Date.now() / 1000) + 60 * 60 * 8,
            },
          },
        },
      ],
    });

    const cookiesRes = getSignedCookies({
      policy,
      keyPairId,
      privateKey,
    });

    const cookies = {
      cloudfrontPolicy: cookiesRes['CloudFront-Policy'],
      cloudfrontSignature: cookiesRes['CloudFront-Signature'],
      cloudfrontKeyPairId: cookiesRes['CloudFront-Key-Pair-Id'],
    };

    return {
      cloudFrontDomain: cloudFrontDomain,
      cookies: cookies,
    };
  }
}
