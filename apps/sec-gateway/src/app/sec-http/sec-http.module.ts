import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'AXIOS_INSTANCE',
      useFactory: (configService: ConfigService): AxiosInstance => {
        const axiosInstance = axios.create({
          baseURL: configService.get<string>('SEC_API_BASE_URL'),
          headers: {
            'User-Agent': configService.get<string>('SEC_API_USER_AGENT'),
          },
        });

        // Add response interceptor for error handling
        axiosInstance.interceptors.response.use(
          (response) => response,
          (error) => {
            if (error.response) {
              const status = error.response.status;
              const message = error.response.data?.message || error.message;
              
              switch (status) {
                case 404:
                  throw new HttpException(message, HttpStatus.NOT_FOUND);
                case 400:
                  throw new HttpException(message, HttpStatus.BAD_REQUEST);
                case 403:
                  throw new HttpException(message, HttpStatus.FORBIDDEN);
                case 429:
                  throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
                case 500:
                  throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
                default:
                  throw new HttpException(message, status);
              }
            }
            throw error;
          }
        );

        return axiosInstance;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['AXIOS_INSTANCE'],
})
export class SecHttpModule {}
