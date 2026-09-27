import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// brings current user data
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user; 
});

