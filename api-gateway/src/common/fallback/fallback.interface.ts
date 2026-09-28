
export interface FallBackStrategy<T> {
    execute(): Promise<T>
}

export interface FallBackOptions {
    userCache?: boolean;
    cacheTimeout?: number;
    defaultResponse?: any;
    retryCount?: number;
    retryDelay?: number;
}