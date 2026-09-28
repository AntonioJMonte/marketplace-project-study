import { Injectable, Logger } from "@nestjs/common";
import { CircuitBreakerState, CircuitBreakerOptions, CircuitBreakerStateEnum } from "./circuit-breaker.interface.js";

@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger('CircuitBreaker');
    private readonly circuits = new Map<string, CircuitBreakerState>(); // circuits receives the key (service) and the key's informations (state. failures, etc)
    private readonly defaultOptions: CircuitBreakerOptions = {
        failureThreshold: 5,
        timeout: 60000,
        resetTimeout: 30000,
    };
    
    async executeWithCircuitBreaker<T> (
        operation: () => Promise<T>, // is the operation active in the moment
        key: string, // key is the service being protected
        fallback?: () => Promise<T>,
        options: CircuitBreakerOptions = this.defaultOptions,
    ): Promise<T> {
        if (key === undefined) throw new Error ('Undefined Key')

        const config = { ...this.defaultOptions, ...options };
        const circuit = this.getOrCreateCircuit(key, config);


        if (circuit.state === 'OPEN') {
            if (Date.now() < circuit.nextAttemptTime) {
                this.logger.warn(`Circuit breaker OPEN for ${key}, using  fallback`);
                if (fallback) {
                    return await fallback()
                }
                throw new Error('Circuit breaker OPEN')
            } else {
                circuit.state = CircuitBreakerStateEnum.HALF_OPEN;
                this.logger.warn(`Circuit breaker HALF_OPEN for ${key}, using  fallback`)
            }
        }

        try {
            const result = await operation();
            this.onSuccess(circuit, key);
            
            return result
        } catch (error) {
            this.onFailure(circuit, key, config);
            this.logger.error(
                `Using fallback for ${key}:`,
                error instanceof Error ? error.message : String(error),
            )
            if(fallback) {
                this.logger.log(`Using fallback for ${key}`)
                return await fallback();
            }
            throw error
        }

    }


    // verify if the circuits already exists for this key
    private getOrCreateCircuit (key: string, options: CircuitBreakerOptions): CircuitBreakerState {
        if (!this.circuits.has(key)) {
            this.circuits.set(key, {
                state: CircuitBreakerStateEnum.CLOSED,
                failureCount: 0,
                lastFailureTime: 0,
                nextAttemptTime: Date.now() + options.timeout,
            })
        }
        return this.circuits.get(key)!;
    }


    private onSuccess (circuit: CircuitBreakerState, key: string): void {
        circuit.failureCount = 0;
        circuit.state = CircuitBreakerStateEnum.CLOSED; // mantains in the CLOSE statte
        this.logger.debug(`Circuit breaker SUCCESS for ${key}, state: CLOSED`);
    }

    private onFailure (circuit: CircuitBreakerState, key: string, options: CircuitBreakerOptions): void {
        circuit.failureCount++;
        circuit.lastFailureTime = Date.now();
        if (circuit.failureCount > options.failureThreshold) {
            circuit.state = CircuitBreakerStateEnum.OPEN // change the CLOSED state to OPEN state
            circuit.nextAttemptTime = Date.now() + options.resetTimeout;
            this.logger.warn(`Circuit breaker OPEN for ${key} after ${circuit.failureCount} failures`)
        }
    }

    getCircuitState(key: string): CircuitBreakerState | undefined {
        return this.circuits.get(key)
    }

    getAllCircuits(): Map<String, CircuitBreakerState> {
        return new Map(this.circuits);
    }

    resetCircuit(key: string): void {
        this.circuits.delete(key)
        this.logger.log(`Circuit breaker RESET for ${key}`);
    }
}