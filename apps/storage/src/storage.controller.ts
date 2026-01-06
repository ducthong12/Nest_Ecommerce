import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('/uploadFile')
  @UseInterceptors(FileInterceptor('file')) // 'file' là tên key trong form-data
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('File is required');
    }
    return await this.storageService.uploadFile(file);
  }

  async getUploadUrl(data: {
    fileName: string;
    fileType: string;
  }){
    return await this.storageService.getUploadUrl(data);
  }
}
