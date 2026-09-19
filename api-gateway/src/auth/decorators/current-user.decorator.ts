import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// brings current user data
export const CurrentUser = createParamDecorator((data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    request.user = data; 
});

