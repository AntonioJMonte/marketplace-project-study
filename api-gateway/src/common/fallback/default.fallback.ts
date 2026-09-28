import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class DefaultFallBackService {
    private readonly logger = new Logger(DefaultFallBackService.name)

    createDefaultFallback<T>(defaultResponse: T, serviceName: string): () => Promise<T> {
        return async (): Promise<T> => {
            this.logger.warn(`Using default fallback for ${serviceName}`)
            return defaultResponse
        }
    }

    createErrorFallback (serviceName: string, errorMessage: string): () => Promise<never> {
        return async (): Promise<never> => {
            this.logger.error(`Fallback error for ${serviceName}: ${errorMessage}`)
            throw new Error (`${serviceName} service unavailable: ${errorMessage}`)
        }
    }

    createEmptyArrayFallback<T>(serviceName: string): () => Promise<T[]> {
        return async (): Promise<T[]> => {
            this.logger.warn(`Using empty array fallback for ${serviceName}`)
            return []
        }
    }

    createEmptyObjectFallback<T>(serviceName: string): () => Promise<T> {
        return async (): Promise<T> => {
            this.logger.warn(`Using empty object fallback for ${serviceName}`)
            return {} as T
        }
    }
}