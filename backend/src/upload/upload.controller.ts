import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AtGuard } from '../common/guards/at.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
}

@UseGuards(AtGuard)
@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: uploadsDir,
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `${uniqueSuffix}${ext}`);
            },
        }),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB max
        },
        fileFilter: (req, file, cb) => {
            const allowedMimes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm',
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Invalid file type'), false);
            }
        },
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Determine file type category
        let fileType = 'document';
        if (file.mimetype.startsWith('image/')) {
            fileType = 'image';
        } else if (file.mimetype.startsWith('audio/')) {
            fileType = 'audio';
        } else if (file.mimetype.startsWith('video/')) {
            fileType = 'video';
        }

        return {
            url: `/uploads/${file.filename}`,
            type: fileType,
            name: file.originalname,
            size: file.size,
        };
    }
}
