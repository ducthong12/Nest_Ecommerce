import { Controller, Get, Res } from '@nestjs/common';
import { StorageService } from './storage.service';
import { Response } from 'express'; // Bắt buộc lấy từ express

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('cloudfrontUrl')
  async getCloudfrontUrl(@Res({ passthrough: true }) res: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      path: '/',
      domain: 'https://d3dgrf4jvcgsgx.cloudfront.net',
      sameSite: 'none' as const,
    };

    const result = await this.storageService.getCloudfrontUrl();

    res.cookie(
      'CloudFront-Policy',
      result.cookies.cloudfrontPolicy,
      cookieOptions,
    );
    res.cookie(
      'CloudFront-Signature',
      result.cookies.cloudfrontSignature,
      cookieOptions,
    );
    res.cookie(
      'CloudFront-Key-Pair-Id',
      result.cookies.cloudfrontKeyPairId,
      cookieOptions,
    );

    return result;
  }
}
