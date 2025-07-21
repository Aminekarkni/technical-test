import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback, MulterError, Field } from 'multer';
import { createFolder, getFileType } from './file.utils';
import { BadRequestResponse } from '../../core/ApiResponse';

export default class FileUploadHandler {
  private upload: multer.Multer;

  constructor() {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        createFolder('./public');
        createFolder('./public/uploads');

        const generatedFolder = getFileType('', file.mimetype);
        const dynamicFolder = req.params.mediaFolderName;
        if (dynamicFolder) {
          createFolder(`./public/uploads/${dynamicFolder}`);
          cb(null, `./public/uploads/${dynamicFolder}/`);
        } else {
          createFolder(`./public/uploads/${generatedFolder}`);
          cb(null, `./public/uploads/${generatedFolder}/`);
        }
      },
      filename: function (req, file, cb) {
        // rename the file with the field name and the current date
        const generatedFolder = getFileType('', file.mimetype);
        const dynamicFolder = req.params.mediaFolderName;
        if (dynamicFolder) {
          cb(
            null,
            `${dynamicFolder}-${Date.now()}.${file.originalname
              .split('.')
              .pop()}`
          );
        } else {
          cb(
            null,
            `${generatedFolder}-${Date.now()}.${file.originalname
              .split('.')
              .pop()}`
          );
        }
      },
    });

    const fileFilter = (
      req: Request,
      file: Express.Multer.File,
      cb: FileFilterCallback
    ) => {
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/pjpeg',
        'image/svg+xml',
        'image/png',
        'image/webp',
        'image/gif',
        'image/jpg',
        'video/mp4',
        'video/avi',
        'video/mpeg',
        'video/ogg',
        'video/webm',
        'video/mov',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'application/pdf',
        'application/octet-stream',
        'text/csv',
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    };

    this.upload = multer({ storage, fileFilter });
  }

  public handleCustomFileUpload(
    options: Field[]
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      this.upload.fields(options)(req, res, function (err) {
        if (err instanceof MulterError) {
          return next(new BadRequestResponse(err.message));
        }
        if (err) {
          return next(new BadRequestResponse(err.message));
        }
        next();
      });
    };
  }


  public handleSingleFileUpload(
    fieldName: string
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      this.upload.single(fieldName)(req, res, (err: any) => {
        if (err instanceof MulterError) {
          return next(new BadRequestResponse(err.message));
        }
        if (err) {
          return next(new BadRequestResponse(err.message));
        }
        next();
      });
    };
  }

  public handleMultipleFileUpload(
    fieldName: string
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      this.upload.array(fieldName)(req, res, (err: any) => {
        if (err instanceof MulterError) {
          return next(new BadRequestResponse(err.message));
        }
        if (err) {
          return next(new BadRequestResponse(err.message));
        }
        next();
      });
    };
  }
}
