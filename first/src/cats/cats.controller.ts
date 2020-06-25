import {Controller, Get, HttpCode, Param, Post, Redirect, Req} from '@nestjs/common';
import {Request} from 'express';

@Controller('cats')
export class CatsController {
    @Post()
    @HttpCode(204)
    create(): string {
        return 'This action adds a new cat';
    }

    @Get('findall')
    findAll(@Req() request: Request): String {
        console.log(request);
        return 'This action returns all cats';
    }

    @Get(':id')
    findOne(@Param() params): string {
        console.log(params.id);
        return `This action returns a #${params.id} cat`;
    }

    @Get('redirect')
    @Redirect('http://www.google.de')
    redirect() {
        console.log('redirect');
    }

    @Get('redirect2')
    @Redirect('')
    redirect2(): any {
        return {url: 'http://www.amazon.de', statusCode: 300};
    }
}
