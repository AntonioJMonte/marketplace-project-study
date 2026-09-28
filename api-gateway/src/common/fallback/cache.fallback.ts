import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class CacheFallBackService {
    private readonly logger = new Logger(CacheFallBackService.name);
    // stores the last successful response of each service, not fallback results
    private readonly lastSuccessfulResponses = new Map<string, { data: any; savedAt: number }>();

    async getLastSuccessfulResponse<T> (key: string, maxAge: number = 300000): Promise<T | null> {
        const lastResponse = this.lastSuccessfulResponses.get(key);
        if (!lastResponse) {
            return null;
        }

        const isExpired = Date.now() - lastResponse.savedAt > maxAge;
        if (isExpired) {
            this.lastSuccessfulResponses.delete(key);
            return null;
        }

        this.logger.log(`Last successful response HIT for key ${key}`);
        return lastResponse.data;
    }

    // must be called after every successful service call, otherwise the fallback always uses defaultData
    saveSuccessfulResponse<T> (key: string, data: T): void {
        this.lastSuccessfulResponses.set(key, {
            data,
            savedAt: Date.now(),
        })
        this.logger.log(`Successful response SAVED for key ${key}`)
    }


    /*createEmptyArrayFallback<T>(serviceName: string): () => Promise<T[]> {
//                          └── parâmetro ──┘   └── tipo de RETORNO ──┘
    return async (): Promise<T[]> => {
        this.logger.warn(`Using empty array fallback for ${serviceName}`)
        return []
    }
}

    uma função que tem como tipo de retorno uma outra função que retorna uma Promise<T>*/
    createCacheFallback<T> (key: string, defaultData: T, maxAge: number = 300000): () => Promise<T> {
        return async (): Promise<T> => {
            const lastResponse = await this.getLastSuccessfulResponse<T>(key, maxAge);

            if (lastResponse) {
                this.logger.log(`Using last successful response for ${key}`)
                return lastResponse
            }

            this.logger.warn(`No successful response avaliable for ${key}, using default`);
            return defaultData;
        }
    }
}
